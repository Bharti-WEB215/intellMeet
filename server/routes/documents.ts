// routes/documents.ts
import express from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';

const router = express.Router();

// Get all documents
router.get('/', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch documents', details: err.message });
  }
});

// Create a new document
router.post('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Document title is required' });

  const id = `doc-${Math.random().toString(36).substr(2, 9)}`;
  const author = req.user?.name || 'Julian Carter';

  try {
    const result = await query(
      'INSERT INTO documents(id, title, content, author, last_updated) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [id, title, content || '', author, 'Just now']
    );

    // Seed activity logs
    const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
    await query(
      'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
      [actId, author, req.user?.avatar || '', `created document: "${title}"`, 'Just now']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create document', details: err.message });
  }
});

export default router;
