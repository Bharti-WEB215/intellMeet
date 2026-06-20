// routes/tasks.ts — Task routes (MongoDB/Mongoose)
import { Router, Response } from 'express';
import { AuthRequest, verifyToken } from '../middleware/jwt-auth.js';
import { Task, ActivityLog } from '../models/index.js';
import { cacheDeletePattern } from '../db/redis.js';

const router = Router();

// ─── GET / — List all tasks for current user ───
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ creatorId: req.userId })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tasks list', details: err.message });
  }
});

// ─── POST / — Create a new task ───
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  const { title, description, assigneeName, assigneeAvatar, priority, deadline, status, meetingId } = req.body;

  if (!title) return res.status(400).json({ error: 'Task title is required' });

  try {
    const task = await Task.create({
      title,
      description: description || '',
      assigneeName: assigneeName || 'Unassigned',
      assigneeAvatar: assigneeAvatar || '',
      priority: priority || 'medium',
      deadline: deadline || '',
      status: status || 'todo',
      meetingId: meetingId || undefined,
      creatorId: req.userId,
    });

    // Log activity
    const creatorName = req.user?.name || 'User';
    await ActivityLog.create({
      userId: req.userId,
      userName: creatorName,
      userAvatar: req.user?.avatar || '',
      action: `created task: "${title}"`,
    });

    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// ─── PUT /:id/status — Update task status ───
router.put('/:id/status', verifyToken, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'New task status column is required' });

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Invalidate any cached dashboard / task data
    await cacheDeletePattern('dashboard:*');
    await cacheDeletePattern(`tasks:${req.userId}:*`);

    // Log activity
    const moverName = req.user?.name || 'User';
    await ActivityLog.create({
      userId: req.userId,
      userName: moverName,
      userAvatar: req.user?.avatar || '',
      action: `moved task "${task.title}" to ${status}`,
    });

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update task status', details: err.message });
  }
});

// ─── DELETE /:id — Delete task ───
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await Task.findByIdAndDelete(req.params.id);

    // Log activity
    const deleterName = req.user?.name || 'User';
    await ActivityLog.create({
      userId: req.userId,
      userName: deleterName,
      userAvatar: req.user?.avatar || '',
      action: `deleted task "${task.title}"`,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

export default router;
