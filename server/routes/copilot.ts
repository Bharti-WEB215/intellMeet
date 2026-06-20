// server/routes/copilot.ts — AI Copilot API (OpenAI + rule-based fallback)
import { Router, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest, verifyToken } from '../middleware/jwt-auth.js';
import { Meeting, Transcript, Task, MeetingAnalytics } from '../models/index.js';
import { cacheGet, cacheSet } from '../db/redis.js';

const router = Router();

// ─── Helpers ───

/** Generate a short hash for cache keys */
const hashKey = (input: string): string =>
  crypto.createHash('md5').update(input).digest('hex').slice(0, 16);

/** Fetch full transcript text for a meeting */
const getTranscriptText = async (meetingId: string): Promise<string[]> => {
  const segments = await Transcript.find({ meetingId })
    .sort({ timestamp: 1 })
    .lean();
  return segments.map(s => `[${s.speakerName}]: ${s.text}`);
};

/** Extract key sentences — picks the first sentence of each speaker turn and
 *  any sentence containing action-oriented words. */
const extractKeySentences = (lines: string[], max = 10): string[] => {
  const keywords = ['decided', 'agreed', 'action', 'deadline', 'next step', 'will', 'must', 'should', 'important', 'priority'];
  const key: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(k => lower.includes(k)) || key.length < 3) {
      key.push(line);
    }
    if (key.length >= max) break;
  }

  return key.length > 0 ? key : lines.slice(0, max);
};

/** Search transcript for lines matching a query */
const searchTranscript = (lines: string[], query: string, max = 5): string[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = lines
    .map(line => ({
      line,
      score: terms.reduce((s, t) => s + (line.toLowerCase().includes(t) ? 1 : 0), 0),
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return scored.map(r => r.line);
};

// ─── Risk keyword analysis ───
const RISK_KEYWORDS = ['delay', 'blocker', 'risk', 'concern', 'issue', 'problem', 'blocked', 'stuck', 'worried', 'challenge', 'escalat', 'critical', 'urgent', 'fail'];

const analyzeRisks = (lines: string[]): string[] => {
  return lines.filter(line => {
    const lower = line.toLowerCase();
    return RISK_KEYWORDS.some(k => lower.includes(k));
  });
};

// ─── Rule-based command handlers ───

const handleSummary = async (meetingId: string): Promise<string> => {
  const lines = await getTranscriptText(meetingId);
  if (lines.length === 0) return '📝 No transcript found for this meeting.';

  const key = extractKeySentences(lines);
  return `📝 **Meeting Summary** (${lines.length} transcript segments)\n\n` +
    key.map(l => `• ${l}`).join('\n');
};

const handleTasks = async (meetingId: string): Promise<string> => {
  const tasks = await Task.find({ meetingId }).sort({ priority: -1 }).lean();
  if (tasks.length === 0) return '✅ No tasks found for this meeting.';

  const priorityIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusIcon: Record<string, string> = { 'todo': '⬜', 'in-progress': '🔄', 'review': '👀', 'done': '✅' };

  const lines = tasks.map(t =>
    `${priorityIcon[t.priority] || '⚪'} ${statusIcon[t.status] || '⬜'} **${t.title}** — assigned to ${t.assigneeName} (${t.status})${t.deadline ? ` | Due: ${t.deadline}` : ''}`
  );

  return `📋 **Meeting Tasks** (${tasks.length} total)\n\n` + lines.join('\n');
};

const handleRisks = async (meetingId: string): Promise<string> => {
  const lines = await getTranscriptText(meetingId);
  const risks = analyzeRisks(lines);

  if (risks.length === 0) return '✅ No risk indicators found in the transcript.';

  return `⚠️ **Risk Analysis** (${risks.length} findings)\n\n` +
    risks.map(r => `• ${r}`).join('\n');
};

const handleEmail = async (meetingId: string): Promise<string> => {
  const meeting = await Meeting.findById(meetingId).lean();
  const lines = await getTranscriptText(meetingId);
  const tasks = await Task.find({ meetingId }).lean();
  const keySentences = extractKeySentences(lines, 5);

  const title = meeting?.title || 'Meeting';
  const date = meeting?.startTime ? new Date(meeting.startTime).toLocaleDateString() : 'N/A';

  let email = `📧 **Meeting Follow-up Email**\n\n`;
  email += `**Subject:** Follow-up: ${title} — ${date}\n\n`;
  email += `Hi Team,\n\n`;
  email += `Here is a summary of our meeting "${title}" held on ${date}.\n\n`;
  email += `**Key Discussion Points:**\n`;
  email += keySentences.map(s => `• ${s}`).join('\n');
  email += '\n\n';

  if (tasks.length > 0) {
    email += `**Action Items:**\n`;
    email += tasks.map(t => `• ${t.title} — ${t.assigneeName} (${t.status})`).join('\n');
    email += '\n\n';
  }

  email += `Please reach out if you have any questions.\n\nBest regards`;
  return email;
};

const handleReport = async (meetingId: string): Promise<string> => {
  const meeting = await Meeting.findById(meetingId).lean();
  const lines = await getTranscriptText(meetingId);
  const tasks = await Task.find({ meetingId }).lean();
  const analytics = await MeetingAnalytics.findOne({ meetingId }).lean();
  const risks = analyzeRisks(lines);
  const keySentences = extractKeySentences(lines, 8);

  const title = meeting?.title || 'Meeting';
  const date = meeting?.startTime ? new Date(meeting.startTime).toLocaleDateString() : 'N/A';
  const duration = meeting?.duration ? `${Math.round(meeting.duration / 60)} min` : 'N/A';
  const participantCount = meeting?.participants?.length || 0;

  let report = `📊 **Full Meeting Report**\n\n`;
  report += `| Field | Value |\n|-------|-------|\n`;
  report += `| Title | ${title} |\n`;
  report += `| Date | ${date} |\n`;
  report += `| Duration | ${duration} |\n`;
  report += `| Participants | ${participantCount} |\n`;
  report += `| Transcript Segments | ${lines.length} |\n\n`;

  if (analytics) {
    report += `**Sentiment Analysis:**\n`;
    report += `• Positive: ${analytics.positivePercent}% | Neutral: ${analytics.neutralPercent}% | Negative: ${analytics.negativePercent}%\n`;
    report += `• Engagement: ${analytics.engagementPercent}% | Collaboration: ${analytics.collaborationPercent}%\n\n`;
  }

  report += `**Key Discussion Points:**\n`;
  report += keySentences.map(s => `• ${s}`).join('\n') + '\n\n';

  if (tasks.length > 0) {
    report += `**Action Items (${tasks.length}):**\n`;
    report += tasks.map(t => `• [${t.priority.toUpperCase()}] ${t.title} → ${t.assigneeName} (${t.status})`).join('\n') + '\n\n';
  }

  if (risks.length > 0) {
    report += `**Risks & Concerns (${risks.length}):**\n`;
    report += risks.map(r => `• ${r}`).join('\n') + '\n\n';
  }

  return report;
};

// ─── OpenAI call (when API key present) ───

const callOpenAI = async (
  message: string,
  transcriptContext: string,
  meetingTitle: string
): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI copilot for the meeting platform IntellMeet. You help users analyze meetings, summarize discussions, identify action items, and provide insights. Be concise, professional, and use markdown formatting. The current meeting is: "${meetingTitle}".`,
        },
        {
          role: 'user',
          content: transcriptContext
            ? `Meeting transcript context:\n${transcriptContext}\n\nUser question: ${message}`
            : message,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || 'No response generated.';
};

// ═══════════════════════════════════════════
//  POST /chat
// ═══════════════════════════════════════════
router.post('/chat', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, meetingId, context } = req.body as {
      message: string;
      meetingId?: string;
      context?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const trimmed = message.trim();

    // ── Check Redis cache ──
    const cacheKey = `copilot:${hashKey(trimmed + (meetingId || '') + (req.userId || ''))}`;
    const cached = await cacheGet<{ response: string; type: string }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // ── If OpenAI key is available, use AI ──
    if (process.env.OPENAI_API_KEY) {
      try {
        let transcriptContext = context || '';
        let meetingTitle = 'General';

        if (meetingId) {
          const meeting = await Meeting.findById(meetingId).lean();
          meetingTitle = meeting?.title || 'Meeting';

          if (!transcriptContext) {
            const lines = await getTranscriptText(meetingId);
            transcriptContext = lines.slice(-50).join('\n'); // last 50 segments for context window
          }
        }

        const aiResponse = await callOpenAI(trimmed, transcriptContext, meetingTitle);
        const result = { response: aiResponse, type: 'ai' as const };

        await cacheSet(cacheKey, result, 300);
        res.json(result);
        return;
      } catch (aiError: any) {
        console.error('OpenAI call failed, falling back to rule-based:', aiError.message);
        // Fall through to rule-based
      }
    }

    // ── Rule-based fallback ──
    let response: string;
    const command = trimmed.toLowerCase();

    if (!meetingId && (command.startsWith('/summary') || command.startsWith('/tasks') || command.startsWith('/risks') || command.startsWith('/email') || command.startsWith('/report'))) {
      res.status(400).json({ error: 'Meeting ID is required for this command. Please select a meeting first.' });
      return;
    }

    if (command.startsWith('/summary')) {
      response = await handleSummary(meetingId!);
    } else if (command.startsWith('/tasks')) {
      response = await handleTasks(meetingId!);
    } else if (command.startsWith('/risks')) {
      response = await handleRisks(meetingId!);
    } else if (command.startsWith('/email')) {
      response = await handleEmail(meetingId!);
    } else if (command.startsWith('/report')) {
      response = await handleReport(meetingId!);
    } else if (meetingId) {
      // Freeform question — search transcript for relevant segments
      const lines = await getTranscriptText(meetingId);
      const matches = searchTranscript(lines, trimmed);

      if (matches.length > 0) {
        response = `🔍 **Relevant transcript segments:**\n\n` +
          matches.map(m => `• ${m}`).join('\n') +
          `\n\n_Found ${matches.length} matching segment(s) for "${trimmed}"_`;
      } else {
        response = `🤔 I couldn't find transcript segments matching "${trimmed}". Try commands like:\n• \`/summary\` — Meeting summary\n• \`/tasks\` — Action items\n• \`/risks\` — Risk analysis\n• \`/email\` — Draft follow-up email\n• \`/report\` — Full meeting report`;
      }
    } else {
      response = `👋 Hi! I'm your meeting copilot. Select a meeting and try:\n• \`/summary\` — Meeting summary\n• \`/tasks\` — Action items\n• \`/risks\` — Risk analysis\n• \`/email\` — Draft follow-up email\n• \`/report\` — Full meeting report\n• Or ask any freeform question about the meeting!`;
    }

    const result = { response, type: 'rule-based' as const };
    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (error: any) {
    console.error('Copilot error:', error);
    res.status(500).json({ error: 'Copilot request failed.', details: error.message });
  }
});

export default router;
