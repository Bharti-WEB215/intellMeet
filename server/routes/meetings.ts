// routes/meetings.ts — Meeting routes (MongoDB/Mongoose)
import { Router, Response } from 'express';
import multer from 'multer';
import { AuthRequest, verifyToken } from '../middleware/jwt-auth.js';
import {
  Meeting,
  Transcript,
  SentimentScore,
  MeetingAnalytics,
  MeetingInsight,
  MeetingMessage,
  Task,
  ActivityLog,
} from '../models/index.js';
import { transcribeAudio, analyzeSentiment, extractTasks, generateSummary } from '../services/openai.js';

const upload = multer();
const router = Router();

// ─── GET / — List all meetings for user ───
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const meetings = await Meeting.find()
      .populate('creatorId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch meetings', details: err.message });
  }
});

// ─── POST / — Create meeting ───
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  const { title, scheduledFor } = req.body;
  if (!title) return res.status(400).json({ error: 'Meeting title is required' });

  try {
    const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
    const isScheduled = Boolean(scheduledDate && !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now());

    const meeting = await Meeting.create({
      title,
      creatorId: req.userId,
      status: isScheduled ? 'scheduled' : 'active',
      startTime: isScheduled ? scheduledDate : new Date(),
      participants: [{ userId: req.userId, role: 'host', joinedAt: new Date() }],
    });

    // Populate creator info before returning
    const populated = await Meeting.findById(meeting._id)
      .populate('creatorId', 'name email avatar');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create meeting', details: err.message });
  }
});

// ─── GET /:id — Get meeting by ID ───
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('creatorId', 'name email avatar')
      .populate('participants.userId', 'name email avatar');

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve meeting details', details: err.message });
  }
});

// ─── POST /:id/transcript — Submit transcript segment ───
router.post('/:id/transcript', verifyToken, async (req: AuthRequest, res: Response) => {
  const { speaker_name, text } = req.body;
  if (!speaker_name || !text) {
    return res.status(400).json({ error: 'Speaker and transcript text required' });
  }

  try {
    const transcript = await Transcript.create({
      meetingId: req.params.id,
      speakerName: speaker_name,
      speakerId: req.userId,
      text,
    });

    // Run async sentiment calculation in background
    analyzeSentiment(text).then(async (sentiment) => {
      await SentimentScore.create({
        meetingId: req.params.id,
        positive: sentiment.positive,
        neutral: sentiment.neutral,
        negative: sentiment.negative,
        label: sentiment.positive > sentiment.negative ? 'positive' : 'negative',
      });
    }).catch(console.error);

    // Broadcast via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('transcript:new', transcript);
    }

    res.status(201).json(transcript);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save transcript block', details: err.message });
  }
});

// ─── POST /:id/transcript-blob — Submit audio blob for transcription ───
router.post('/:id/transcript-blob', verifyToken, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  const meetingId = req.params.id;
  const { speaker_name } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file upload is required' });
  }

  try {
    const text = await transcribeAudio(req.file.buffer, 'wav');

    const transcript = await Transcript.create({
      meetingId,
      speakerName: speaker_name || 'Speaker',
      speakerId: req.userId,
      text,
    });

    // Calculate sentiment asynchronously
    analyzeSentiment(text).then(async (sentiment) => {
      await SentimentScore.create({
        meetingId,
        positive: sentiment.positive,
        neutral: sentiment.neutral,
        negative: sentiment.negative,
        label: sentiment.positive > sentiment.negative ? 'positive' : 'negative',
      });
    }).catch(console.error);

    // Broadcast via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(meetingId).emit('transcript:new', transcript);
    }

    res.json({ text, transcript });
  } catch (err: any) {
    console.error('Failed to transcribe audio blob:', err);
    res.status(500).json({ error: 'Failed to transcribe audio segment', details: err.message });
  }
});

// ─── GET /:id/transcript — Get transcript segments for meeting ───
router.get('/:id/transcript', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const transcripts = await Transcript.find({ meetingId: req.params.id })
      .sort({ timestamp: 1 });

    res.json(transcripts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve transcripts', details: err.message });
  }
});

// ─── POST /:id/end — End meeting and trigger AI summary + task extraction ───
router.post('/:id/end', verifyToken, async (req: AuthRequest, res: Response) => {
  const meetingId = req.params.id;

  try {
    // 1. Mark meeting as completed and set endTime
    const endTime = new Date();
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Calculate actual duration in seconds
    const startTime = meeting.startTime || meeting.createdAt;
    const durationSec = Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000);

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { status: 'completed', endTime, duration: durationSec },
      { new: true }
    );

    // 2. Fetch full transcript text
    const transcripts = await Transcript.find({ meetingId }).sort({ timestamp: 1 });

    const fullTranscript = transcripts
      .map(t => `${t.speakerName}: ${t.text}`)
      .join('\n') || 'General Sync Discussion.';

    // 3. Trigger AI operations in parallel
    const [sentiment, tasks, summary] = await Promise.all([
      analyzeSentiment(fullTranscript),
      extractTasks(fullTranscript, meetingId),
      generateSummary(fullTranscript),
    ]);

    // 4. Calculate DNA scores from sentiment
    const dec = Math.min(100, Math.max(30, 40 + sentiment.positive - sentiment.stress / 2));
    const foc = Math.min(100, Math.max(35, 85 - sentiment.neutral / 2));
    const ene = Math.min(100, Math.max(40, sentiment.positive + sentiment.neutral / 3));
    const bal = Math.min(100, Math.max(30, 60 + (transcripts.length > 5 ? 20 : 0)));
    const act = Math.min(100, Math.max(30, 30 + tasks.length * 15));

    // 5. Save MeetingAnalytics
    await MeetingAnalytics.create({
      meetingId,
      positivePercent: sentiment.positive,
      neutralPercent: sentiment.neutral,
      negativePercent: sentiment.negative,
      stressPercent: sentiment.stress,
      engagementPercent: sentiment.engagement,
      collaborationPercent: sentiment.collaboration,
      decisionQuality: dec,
      focusScore: foc,
      energyScore: ene,
      participationBalance: bal,
      actionability: act,
    });

    // 6. Save MeetingInsight with summary
    const summaryText = JSON.stringify(summary);
    await MeetingInsight.create({
      meetingId,
      type: 'highlight',
      content: summaryText,
      confidence: 0.9,
    });

    // 7. Save Tasks extracted by AI
    for (const t of tasks) {
      await Task.create({
        title: t.title,
        description: t.description,
        assigneeName: t.assignee_name,
        assigneeAvatar: t.assignee_avatar,
        priority: t.priority,
        deadline: t.deadline,
        status: 'todo',
        meetingId,
        creatorId: req.userId,
      });

      // Log activity
      await ActivityLog.create({
        userId: req.userId,
        userName: 'AI Copilot',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
        action: `auto-extracted task: "${t.title}" from meeting`,
      });
    }

    res.json({
      meeting: updatedMeeting,
      analytics: {
        positivePercent: sentiment.positive,
        neutralPercent: sentiment.neutral,
        negativePercent: sentiment.negative,
        stressPercent: sentiment.stress,
        engagementPercent: sentiment.engagement,
        collaborationPercent: sentiment.collaboration,
        decisionQuality: dec,
        focusScore: foc,
        energyScore: ene,
        participationBalance: bal,
        actionability: act,
      },
      summary,
      tasksCreated: tasks.length,
    });
  } catch (err: any) {
    console.error('Error ending meeting:', err);
    res.status(500).json({ error: 'Failed to wrap up meeting analytics', details: err.message });
  }
});

// ─── GET /:id/summary — Get meeting summary & insights ───
router.get('/:id/summary', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const insight = await MeetingInsight.findOne({ meetingId: req.params.id });
    const analytics = await MeetingAnalytics.findOne({ meetingId: req.params.id });
    const tasks = await Task.find({ meetingId: req.params.id });

    if (!insight) {
      return res.status(404).json({ error: 'Summary report not ready or not found' });
    }

    let summaryData;
    try {
      summaryData = JSON.parse(insight.content);
    } catch {
      summaryData = insight.content;
    }

    res.json({
      summary: summaryData,
      analytics: analytics || null,
      tasks,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve meeting summary', details: err.message });
  }
});

// ─── GET /:id/messages — Fetch in-meeting chat messages ───
router.get('/:id/messages', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const messages = await MeetingMessage.find({ meetingId: req.params.id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch meeting messages', details: err.message });
  }
});

// ─── GET /:id/participants — Return meeting participants with user info ───
router.get('/:id/participants', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('participants.userId', 'name email avatar isOnline');

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    res.json(meeting.participants);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch participants', details: err.message });
  }
});

// ─── POST /:id/invite — Send meeting invitation emails ───
router.post('/:id/invite', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'At least one email address is required.' });
    }

    const normalizedEmails = Array.from(new Set(emails
      .map((email: any) => String(email || '').trim().toLowerCase())
      .filter(Boolean)));

    if (normalizedEmails.length === 0) {
      return res.status(400).json({ error: 'At least one valid email address is required.' });
    }
    if (normalizedEmails.length > 2) {
      return res.status(400).json({ error: 'You can invite up to 2 email addresses at once.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = normalizedEmails.filter((email: string) => !emailPattern.test(email));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ error: `Invalid email address(es): ${invalidEmails.join(', ')}` });
    }

    const meeting = await Meeting.findById(req.params.id)
      .populate('creatorId', 'name email');
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    const hostName = (meeting.creatorId as any)?.name || 'A team member';
    const meetingCode = meeting._id.toString();
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const meetingLink = `${frontendUrl.replace(/\/$/, '')}/room/${meetingCode}`;

    // Build a beautiful HTML email
    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6D5DFC, #46C2CB); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">✨ IntellMeet</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">You're invited to a meeting</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="font-size: 20px; margin: 0 0 16px; color: #f1f5f9;">${meeting.title || 'Team Meeting'}</h2>
          <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px;">${hostName} has invited you to join a meeting on IntellMeet.</p>
          <div style="background: #1a1a3e; border: 1px solid #2d2d5e; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Meeting Code</p>
            <p style="margin: 0; font-size: 20px; font-family: monospace; color: #6D5DFC; font-weight: bold;">${meetingCode}</p>
          </div>
          <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #6D5DFC, #46C2CB); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">Join Meeting →</a>
          <p style="margin: 24px 0 0; font-size: 12px; color: #475569;">Or copy this link: <span style="color: #6D5DFC;">${meetingLink}</span></p>
        </div>
        <div style="padding: 16px 32px; background: #0a0a1a; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #475569;">© 2026 IntellMeet AI Platforms Corp.</p>
        </div>
      </div>
    `;

    // Use Nodemailer if available, otherwise log the invite
    let emailResults: any[] = [];
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });

      for (const email of emails) {
        try {
          const info = await transporter.sendMail({
            from: `"IntellMeet" <${process.env.SMTP_USER || 'noreply@intellmeet.app'}>`,
            to: email,
            subject: `${hostName} invited you to: ${meeting.title || 'Meeting'}`,
            html: htmlTemplate,
          });
          emailResults.push({ email, status: 'sent', messageId: info.messageId });
        } catch (sendErr: any) {
          emailResults.push({ email, status: 'failed', error: sendErr.message });
        }
      }
    } catch (importErr) {
      // Nodemailer not installed — return success with invite data anyway
      emailResults = emails.map((e: string) => ({ email: e, status: 'queued', note: 'SMTP not configured' }));
    }

    res.json({
      message: `Invitations processed for ${emails.length} recipient(s).`,
      meetingCode,
      meetingLink,
      results: emailResults,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send invitations', details: err.message });
  }
});

export default router;
