// routes/documents.ts — MongoDB/Mongoose rewrite
import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/jwt-auth.js';
import { Doc, ActivityLog } from '../models/index.js';

const router = express.Router();

// Get all documents
router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const docs = await Doc.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch documents', details: err.message });
  }
});

// Create a new document
router.post('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Document title is required' });

    const doc = await Doc.create({
      title,
      content: content || '',
      authorId: req.userId,
      authorName: req.user?.name || 'Unknown',
      lastUpdated: new Date().toLocaleDateString(),
    });

    // Log activity
    await ActivityLog.create({
      userId: req.userId,
      userName: req.user?.name || 'Unknown',
      userAvatar: req.user?.avatar || '',
      action: `created document: "${title}"`,
    });

    res.status(201).json(doc);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create document', details: err.message });
  }
});

// Update a document
router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;

    const updated = await Doc.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        lastUpdated: new Date().toLocaleDateString(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Document not found' });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update document', details: err.message });
  }
});

// Delete a document
router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const deleted = await Doc.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found' });

    res.json({ success: true, message: 'Document deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete document', details: err.message });
  }
});

export default router;
