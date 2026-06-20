// server/middleware/jwt-auth.ts — JWT Authentication + Role-based access
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/index.js';
import { isTokenBlacklisted } from '../db/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'intellmeet-dev-secret-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

// ─── Generate JWT ───
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
};

// ─── Verify Token Middleware ───
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Check Redis blacklist (for logged-out tokens)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      res.status(401).json({ error: 'Token has been revoked.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };

    // Fetch full user from DB
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired. Please login again.' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token.' });
    } else {
      res.status(500).json({ error: 'Authentication failed.' });
    }
  }
};

// ─── Role-based Access Control ───
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
      return;
    }
    next();
  };
};

export { JWT_SECRET };
