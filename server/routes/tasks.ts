// routes/tasks.ts
import express from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';

const router = express.Router();

// Get all tasks
router.get('/', verifyAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tasks ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tasks list', details: err.message });
  }
});

// Create a new task manually
router.post('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { title, description, assignee_name, assignee_avatar, priority, deadline, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const id = `tsk-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const result = await query(
      `INSERT INTO tasks(id, title, description, assignee_name, assignee_avatar, priority, deadline, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id,
        title,
        description || '',
        assignee_name || 'Unassigned',
        assignee_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
        priority || 'medium',
        deadline || 'June 12, 2026',
        status || 'todo'
      ]
    );

    // Seed activity logs
    const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
    const creatorName = req.user?.name || 'User';
    await query(
      'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
      [actId, creatorName, req.user?.avatar || '', `created task: "${title}"`, 'Just now']
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// Update task column status
router.put('/:id/status', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'New task status column is required' });

  try {
    const result = await query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    // Log drag/column transition in activity logger
    const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
    const moverName = req.user?.name || 'User';
    await query(
      'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
      [actId, moverName, req.user?.avatar || '', `moved task "${result.rows[0].title}" to ${status}`, 'Just now']
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update task status', details: err.message });
  }
});

// Delete task
router.delete('/:id', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Retrieve task to log details before deletion
    const taskResult = await query('SELECT title FROM tasks WHERE id = $1', [req.params.id]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);

    const actId = `act-${Math.random().toString(36).substr(2, 9)}`;
    const deleterName = req.user?.name || 'User';
    await query(
      'INSERT INTO activity_logs(id, user_name, avatar, action, time) VALUES($1, $2, $3, $4, $5)',
      [actId, deleterName, req.user?.avatar || '', `deleted task "${taskResult.rows[0].title}"`, 'Just now']
    );

    res.json({ message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

export default router;
