// routes/notifications.ts
import express from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized context' });

  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY timestamp DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user notifications', details: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', verifyAuth, async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification', details: err.message });
  }
});

export default router;
