// routes/workspace.ts — MongoDB/Mongoose rewrite
import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/jwt-auth.js';
import {
  WorkspaceChannel,
  WorkspaceMessage,
  WorkspaceAsset,
  ActivityLog,
} from '../models/index.js';

const router = express.Router();

// Default channels to seed if collection is empty
const DEFAULT_CHANNELS = [
  { name: 'general',       type: 'text' as const, description: 'General discussion for the team' },
  { name: 'design',        type: 'text' as const, description: 'Design discussions and feedback' },
  { name: 'engineering',   type: 'text' as const, description: 'Engineering and development topics' },
  { name: 'announcements', type: 'announcement' as const, description: 'Important team announcements' },
];

// Get workspace channels (seed defaults if empty)
router.get('/channels', verifyToken, async (req: AuthRequest, res) => {
  try {
    let channels = await WorkspaceChannel.find();

    // Seed default channels if collection is empty
    if (channels.length === 0) {
      channels = await WorkspaceChannel.insertMany(DEFAULT_CHANNELS);
    }

    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch channels', details: err.message });
  }
});

// Get messages for a channel
router.get('/channels/:id/messages', verifyToken, async (req: AuthRequest, res) => {
  try {
    const messages = await WorkspaceMessage.find({ channelId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Return in chronological order for display
    res.json(messages.reverse());
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch channel chat history', details: err.message });
  }
});

// Post message to a workspace channel
router.post('/channels/:id/messages', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Message body cannot be empty' });

    const message = await WorkspaceMessage.create({
      channelId: req.params.id,
      userId: req.userId,
      userName: req.user?.name || 'User',
      userAvatar: req.user?.avatar || '',
      text,
    });

    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to broadcast message', details: err.message });
  }
});

// Get workspace assets/files
router.get('/files', verifyToken, async (req: AuthRequest, res) => {
  try {
    const files = await WorkspaceAsset.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assets list', details: err.message });
  }
});

// Register uploaded workspace asset
router.post('/files', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { name, size, type, url, cloudinaryId } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });

    const asset = await WorkspaceAsset.create({
      name,
      size: size || '0 KB',
      type: type || 'file',
      url: url || '',
      cloudinaryId: cloudinaryId || undefined,
      uploadedBy: req.userId,
      uploaderName: req.user?.name || 'User',
    });

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      userName: req.user?.name || 'User',
      userAvatar: req.user?.avatar || '',
      action: `uploaded file: "${name}"`,
    });

    res.status(201).json(asset);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register file upload', details: err.message });
  }
});

// Get workspace activity feed
router.get('/activities', verifyToken, async (req: AuthRequest, res) => {
  try {
    const activities = await ActivityLog.find().sort({ createdAt: -1 }).limit(20);
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch activities feed', details: err.message });
  }
});

export default router;
