// routes/notifications.ts — MongoDB/Mongoose rewrite
import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/jwt-auth.js';
import { Notification } from '../models/index.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized context' });

    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user notifications', details: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req: AuthRequest, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification', details: err.message });
  }
});

export default router;
