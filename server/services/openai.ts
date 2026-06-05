// services/openai.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({ apiKey });
  console.log('OpenAI service initialized successfully.');
} else {
  console.log('OpenAI API Key not found. AI operations will use dynamic simulation fallback.');
}

// Transcribe audio using Whisper API
export const transcribeAudio = async (audioBuffer: Buffer, extension: string = 'wav'): Promise<string> => {
  if (openai) {
    try {
      // Save temporary audio file for Whisper API input
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      const tempFile = path.join(tempDir, `audio_${Date.now()}.${extension}`);
      fs.writeFileSync(tempFile, audioBuffer);

      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
      });

      // Clean up temp file
      fs.unlinkSync(tempFile);
      return response.text;
    } catch (err) {
      console.error('Whisper Transcription API error, running fallback...', err);
    }
  }

  // Fallback simulator: cycle through realistic meeting transcripts
  const samplePhrases = [
    "We need to finalize the UX specifications for the Arc-based sidebar layout.",
    "The focus score is looking healthy, but team collaboration can be improved.",
    "Alex, can you integrate the Recharts components into the Meeting DNA by June 10?",
    "Elena will debug the Framer Motion layout shift on Auth screens by June 6.",
    "Let's make sure we configure Tailwind CSS v4 variables for the neon themes.",
    "We've got about three actionable decisions identified from the general sync."
  ];
  return samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
};

// Analyze sentiment percentages and organizational metrics from transcript text
export const analyzeSentiment = async (transcript: string) => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of the following meeting transcript segment. 
            Respond ONLY with a JSON object containing these integer percentage values (must sum to 100 for positive, neutral, negative):
            {
              "positive": number,
              "neutral": number,
              "negative": number,
              "stress": number, (0-100)
              "engagement": number, (0-100)
              "collaboration": number (0-100)
            }`
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      return {
        positive: data.positive ?? 50,
        neutral: data.neutral ?? 40,
        negative: data.negative ?? 10,
        stress: data.stress ?? 20,
        engagement: data.engagement ?? 80,
        collaboration: data.collaboration ?? 75,
      };
    } catch (err) {
      console.error('OpenAI Sentiment Analysis error, running fallback...', err);
    }
  }

  // Dynamic simulation based on transcript keywords
  const text = transcript.toLowerCase();
  let positive = 50, neutral = 40, negative = 10, stress = 15, engagement = 75, collaboration = 70;

  if (text.includes('error') || text.includes('bug') || text.includes('challenge') || text.includes('snap')) {
    negative += 15;
    positive -= 10;
    neutral -= 5;
    stress += 25;
  }
  if (text.includes('finalize') || text.includes('integrate') || text.includes('complete') || text.includes('success')) {
    positive += 20;
    negative -= 5;
    neutral -= 15;
    engagement += 15;
    collaboration += 20;
  }

  return { positive, neutral, negative, stress, engagement, collaboration };
};

// Extract Kanban tasks automatically from meeting transcript text
export const extractTasks = async (transcript: string, meetingId: string): Promise<any[]> => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Identify all actionable items, tasks, and assignments in the following meeting transcript. 
            Respond ONLY with a JSON array of task objects matching this structure:
            [
              {
                "title": "Clear concise summary of task",
                "description": "Elaborate context of what needs to be done",
                "assignee_name": "Name of person assigned (or 'Unassigned')",
                "priority": "low" | "medium" | "high",
                "deadline": "Month Day, Year (e.g. June 10, 2026) or default to next week"
              }
            ]`
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{"tasks": []}');
      const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      
      return tasks.map((t: any) => ({
        id: `tsk-${Math.random().toString(36).substr(2, 9)}`,
        meeting_id: meetingId,
        title: t.title || 'Extracted Task',
        description: t.description || '',
        assignee_name: t.assignee_name || 'Unassigned',
        assignee_avatar: getAvatarForUser(t.assignee_name),
        priority: t.priority || 'medium',
        deadline: t.deadline || 'June 12, 2026',
        status: 'todo'
      }));
    } catch (err) {
      console.error('OpenAI Task Extraction error, running fallback...', err);
    }
  }

  // Fallback simulator scanning for keywords
  const tasks: any[] = [];
  const lowercase = transcript.toLowerCase();

  if (lowercase.includes('specifications') || lowercase.includes('sidebar')) {
    tasks.push({
      id: `tsk-${Math.random().toString(36).substr(2, 9)}`,
      meeting_id: meetingId,
      title: 'Review Sidebar UX specs',
      description: 'Ensure floating sidebar complies with Vision Pro layout tokens.',
      assignee_name: 'Sarah Connor',
      assignee_avatar: getAvatarForUser('Sarah Connor'),
      priority: 'high',
      deadline: 'June 8, 2026',
      status: 'todo'
    });
  }

  if (lowercase.includes('recharts') || lowercase.includes('dna')) {
    tasks.push({
      id: `tsk-${Math.random().toString(36).substr(2, 9)}`,
      meeting_id: meetingId,
      title: 'Setup Recharts DNA configurations',
      description: 'Review radial parameters and map dynamic data nodes.',
      assignee_name: 'Alex Rivera',
      assignee_avatar: getAvatarForUser('Alex Rivera'),
      priority: 'medium',
      deadline: 'June 10, 2026',
      status: 'todo'
    });
  }

  return tasks;
};

// Generate meeting executive summary, key decisions, action items, risks, and next steps
export const generateSummary = async (transcript: string) => {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the meeting transcript and compile an executive meeting summary. 
            Respond ONLY with a JSON object matching this structure:
            {
              "summary": "High level paragraph summarizing meeting outcomes",
              "decisions": ["Decision 1", "Decision 2"],
              "actionItems": ["Action Item 1", "Action Item 2"],
              "risks": ["Risk 1"],
              "nextSteps": ["Next Step 1"]
            }`
          },
          { role: 'user', content: transcript }
        ],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (err) {
      console.error('OpenAI Meeting Summary error, running fallback...', err);
    }
  }

  // Fallback summary response
  return {
    summary: 'The project team aligned on implementing Tailwind CSS v4 configurations for neon styling, while initiating task cards dragging using Framer Motion physics. Multi-peer WebRTC video grids and speech-to-text transcript streams are scheduled for next deployment.',
    decisions: [
      'Approved Deep Space Background (#070B14) as the core workspace background color.',
      'Approved transition of Kanban columns into interactive drag elements.'
    ],
    actionItems: [
      'Sarah Connor to finalize Apple Vision Pro depth mockups.',
      'Alex Rivera to build DNA Radar integration.'
    ],
    risks: [
      'Potential layout shifts in Vite hot-reloading configurations.'
    ],
    nextSteps: [
      'Connect the front-end interface directly to the Express server API endpoints.'
    ]
  };
};

// Helpers
const getAvatarForUser = (name: string): string => {
  if (!name) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
  const n = name.toLowerCase();
  if (n.includes('sarah')) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80';
  if (n.includes('alex')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80';
  if (n.includes('elena')) return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80';
  return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120';
};
