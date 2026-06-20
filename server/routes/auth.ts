// routes/auth.ts — Authentication routes (MongoDB/Mongoose)
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { AuthRequest, verifyToken, generateToken } from '../middleware/jwt-auth.js';
import { blacklistToken } from '../db/redis.js';

const router = Router();

// ─── POST /register ───
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in MongoDB
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'member',
    });

    // Generate JWT
    const token = generateToken(user._id.toString(), user.email, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        company: user.company,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.', details: err.message });
  }
});

// ─── POST /login ───
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = generateToken(user._id.toString(), user.email, user.role);

    // Update online status
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: new Date() });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        company: user.company,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

// ─── GET /me ───
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    // req.user is already populated by verifyToken middleware (minus passwordHash)
    res.json(req.user);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user context.', details: err.message });
  }
});

// ─── POST /update-profile ───
router.post('/update-profile', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    const { name, avatar, company, role } = req.body;

    // Build update object — only include fields that were actually sent
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (company !== undefined) updates.company = company;
    if (role !== undefined) updates.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user profile.', details: err.message });
  }
});

// ─── POST /logout ───
router.post('/logout', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      // Blacklist token for 7 days (matches JWT_EXPIRES_IN default)
      await blacklistToken(token, 7 * 24 * 60 * 60);
    }

    // Set user offline
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { isOnline: false, lastSeen: new Date() });
    }

    res.json({ message: 'Logged out successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed.', details: err.message });
  }
});

export default router;
