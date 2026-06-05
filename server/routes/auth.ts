// routes/auth.ts
import express from 'express';
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { query } from '../db/db.js';

const router = express.Router();

// Get current user profile
router.get('/me', verifyAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized user context' });
  }
  
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user context', details: err.message });
  }
});

// Update user profile properties
router.post('/update-profile', verifyAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized user context' });
  }

  const { name, role, company, avatar } = req.body;

  try {
    const result = await query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           role = COALESCE($2, role), 
           company = COALESCE($3, company), 
           avatar = COALESCE($4, avatar) 
       WHERE id = $5 
       RETURNING *`,
      [name, role, company, avatar, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user profile', details: err.message });
  }
});

export default router;
