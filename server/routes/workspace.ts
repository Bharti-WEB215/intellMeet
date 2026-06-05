// routes/workspace.ts
import express from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';

const router = express.Router();

// Get workspace channels
router.get('/channels', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM workspace_channels');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch channels', details: err.message });
  }
});

// Get workspace messages for a channel
router.get('/channels/:id/messages', verifyAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM workspace_messages WHERE channel_id = $1 ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch channel chat history', details: err.message });
  }
});

// Post message to a workspace channel
router.post('/channels/:id/messages', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message body cannot be empty' });

  const id = `wmsg-${Math.random().toString(36).substr(2, 9)}`;
  const sender = req.user?.name || 'User';
  const avatar = req.user?.avatar || '';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    const result = await query(
      `INSERT INTO workspace_messages(id, channel_id, sender, avatar, text, timestamp)
       VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, req.params.id, sender, avatar, text, timestamp]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to broadcast message', details: err.message });
  }
});

// Get workspace assets/files
router.get('/files', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM workspace_assets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assets list', details: err.message });
  }
});

// Register uploaded workspace asset
router.post('/files', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { name, size, type } = req.body;
  if (!name) return res.status(400).json({ error: 'File name is required' });

  const id = `f-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = 'Just now';

  try {
    const result = await query(
      'INSERT INTO workspace_assets(id, name, size, type, timestamp) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [id, name, size || '0 KB', type || 'DOC', timestamp]
    );

    // Seed activity logs
    const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
    const uName = req.user?.name || 'User';
    await query(
      'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
      [actId, uName, req.user?.avatar || '', `uploaded file: "${name}"`, 'Just now']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register file upload', details: err.message });
  }
});

// Get workspace activity feed logs
router.get('/activities', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM activity_logs ORDER BY time ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch activities feed', details: err.message });
  }
});

export default router;
