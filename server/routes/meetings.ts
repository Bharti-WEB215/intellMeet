// routes/meetings.ts
import express from 'express';
import multer from 'multer';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';
import { analyzeSentiment, extractTasks, generateSummary, transcribeAudio } from '../services/openai.js';

const upload = multer();
const router = express.Router();

// Get all meetings
router.get('/', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM meetings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch meetings', details: err.message });
  }
});

// Create meeting room
router.post('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Meeting title is required' });

  const id = `mtg-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const result = await query(
      'INSERT INTO meetings(id, title, status) VALUES($1, $2, $3) RETURNING *',
      [id, title, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create meeting', details: err.message });
  }
});

// Get meeting by ID
router.get('/:id', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM meetings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve meeting details', details: err.message });
  }
});

// Submit transcript segment
router.post('/:id/transcript', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { speaker_name, text } = req.body;
  if (!speaker_name || !text) return res.status(400).json({ error: 'Speaker and transcript text required' });

  const tId = `tr-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const result = await query(
      'INSERT INTO transcripts(id, meeting_id, speaker_name, text) VALUES($1, $2, $3, $4) RETURNING *',
      [tId, req.params.id, speaker_name, text]
    );

    // Run async sentiment calculation in background
    analyzeSentiment(text).then(async (sentiment) => {
      // Log sentiment scores
      await query(
        'INSERT INTO sentiment_scores(meeting_id, positive, neutral, negative, stress, engagement, collaboration) VALUES($1, $2, $3, $4, $5, $6, $7)',
        [req.params.id, sentiment.positive, sentiment.neutral, sentiment.negative, sentiment.stress, sentiment.engagement, sentiment.collaboration]
      );
    }).catch(console.error);

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save transcript block', details: err.message });
  }
});

// Submit audio blob transcription
router.post('/:id/transcript-blob', verifyAuth, upload.single('audio'), async (req: AuthenticatedRequest, res) => {
  const meetingId = req.params.id;
  const { speaker_name } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Audio file upload is required' });
  }

  try {
    const text = await transcribeAudio(req.file.buffer, 'wav');
    const tId = `tr-${Math.random().toString(36).substr(2, 9)}`;

    const result = await query(
      'INSERT INTO transcripts(id, meeting_id, speaker_name, text) VALUES($1, $2, $3, $4) RETURNING *',
      [tId, meetingId, speaker_name || 'Speaker', text]
    );

    // Calculate sentiment asynchronously
    analyzeSentiment(text).then(async (sentiment) => {
      await query(
        'INSERT INTO sentiment_scores(meeting_id, positive, neutral, negative, stress, engagement, collaboration) VALUES($1, $2, $3, $4, $5, $6, $7)',
        [meetingId, sentiment.positive, sentiment.neutral, sentiment.negative, sentiment.stress, sentiment.engagement, sentiment.collaboration]
      );
    }).catch(console.error);

    res.json({ text, transcript: result.rows[0] });
  } catch (err: any) {
    console.error('Failed to transcribe audio blob:', err);
    res.status(500).json({ error: 'Failed to transcribe audio segment', details: err.message });
  }
});

// Get transcript segments for meeting
router.get('/:id/transcript', verifyAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve transcripts', details: err.message });
  }
});

// End meeting and trigger summary + tasks extraction
router.post('/:id/end', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const meetingId = req.params.id;

  try {
    // 1. Mark meeting as completed
    const mtgResult = await query(
      'UPDATE meetings SET status = $1, duration = $2 WHERE id = $3 RETURNING *',
      ['completed', 45 * 60, meetingId] // Mock duration 45 mins
    );

    if (mtgResult.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });

    // 2. Fetch full transcript text
    const transcriptsResult = await query(
      'SELECT speaker_name, text FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC',
      [meetingId]
    );

    const fullTranscript = transcriptsResult.rows
      .map(t => `${t.speaker_name}: ${t.text}`)
      .join('\n') || 'General Sync Discussion.';

    // 3. Trigger AI operations
    const sentimentPromise = analyzeSentiment(fullTranscript);
    const tasksPromise = extractTasks(fullTranscript, meetingId);
    const summaryPromise = generateSummary(fullTranscript);

    const [sentiment, tasks, summary] = await Promise.all([
      sentimentPromise,
      tasksPromise,
      summaryPromise
    ]);

    // 4. Save Analytics to database
    // Generate some DNA scores (Decision Quality, Focus, Energy) based on text/sentiment length
    const dec = Math.min(100, Math.max(30, 40 + sentiment.positive - sentiment.stress / 2));
    const foc = Math.min(100, Math.max(35, 85 - sentiment.neutral / 2));
    const ene = Math.min(100, Math.max(40, sentiment.positive + sentiment.neutral / 3));
    const bal = Math.min(100, Math.max(30, 60 + (transcriptsResult.rows.length > 5 ? 20 : 0)));
    const act = Math.min(100, Math.max(30, 30 + tasks.length * 15));

    await query(
      `INSERT INTO meeting_analytics(
        meeting_id, positive_percent, neutral_percent, negative_percent, 
        stress_percent, engagement_percent, collaboration_percent,
        decision_quality, focus_score, energy_score, participation_balance, actionability
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        meetingId, sentiment.positive, sentiment.neutral, sentiment.negative,
        sentiment.stress, sentiment.engagement, sentiment.collaboration,
        dec, foc, ene, bal, act
      ]
    );

    // Save Summary to meeting insights
    const insightId = `ins-${Math.random().toString(36).substr(2, 9)}`;
    const summaryText = JSON.stringify(summary);
    await query(
      'INSERT INTO meeting_insights(id, meeting_id, text) VALUES($1, $2, $3)',
      [insightId, meetingId, summaryText]
    );

    // Save Tasks to database
    for (const t of tasks) {
      await query(
        `INSERT INTO tasks(id, meeting_id, title, description, assignee_name, assignee_avatar, priority, deadline, status)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [t.id, meetingId, t.title, t.description, t.assignee_name, t.assignee_avatar, t.priority, t.deadline, 'todo']
      );
      
      // Seed activity logs
      const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
      await query(
        'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
        [actId, 'AI Copilot', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120', `auto-extracted task: "${t.title}" from meeting`, 'Just now']
      );
    }

    res.json({
      meeting: mtgResult.rows[0],
      analytics: {
        positive_percent: sentiment.positive,
        neutral_percent: sentiment.neutral,
        negative_percent: sentiment.negative,
        stress_percent: sentiment.stress,
        engagement_percent: sentiment.engagement,
        collaboration_percent: sentiment.collaboration,
        decision_quality: dec,
        focus_score: foc,
        energy_score: ene,
        participation_balance: bal,
        actionability: act
      },
      summary,
      tasksCreated: tasks.length
    });
  } catch (err: any) {
    console.error('Error ending meeting:', err);
    res.status(500).json({ error: 'Failed to wrap up meeting analytics', details: err.message });
  }
});

// Get meeting summary & insights
router.get('/:id/summary', verifyAuth, async (req, res) => {
  try {
    const insightsResult = await query(
      'SELECT text FROM meeting_insights WHERE meeting_id = $1 LIMIT 1',
      [req.params.id]
    );
    const analyticsResult = await query(
      'SELECT * FROM meeting_analytics WHERE meeting_id = $1 LIMIT 1',
      [req.params.id]
    );

    if (insightsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Summary report not ready or not found' });
    }

    const summaryData = JSON.parse(insightsResult.rows[0].text);
    res.json({
      summary: summaryData,
      analytics: analyticsResult.rows[0] || null
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve meeting summary', details: err.message });
  }
});

export default router;
