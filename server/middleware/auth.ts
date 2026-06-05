// auth.ts
import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { query } from '../db/db.js';

// Extend Express Request type to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: string;
    company?: string;
  };
}

let firebaseInitialized = false;

try {
  // Initialize Firebase Admin if credential configs are present in process.env
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully.');
  } else {
    console.log('Firebase credentials not fully provided. Auth will operate in Dev/Mock mode.');
  }
} catch (err) {
  console.warn('Firebase Admin SDK failed to initialize. Reverting to Dev/Mock mode.', err);
}

export const verifyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header is missing or malformed' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Check for local developer testing token
  if (token.startsWith('dev-token-')) {
    const email = token.replace('dev-token-', '');
    const defaultName = email.split('@')[0].replace('.', ' ');
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    const id = `usr-${email.replace(/[@.]/g, '-')}`;

    try {
      // Find or seed developer user
      const selectResult = await query('SELECT * FROM users WHERE id = $1', [id]);
      let user = selectResult.rows[0];

      if (!user) {
        const insertResult = await query(
          'INSERT INTO users(id, email, name, avatar, role, company) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
          [
            id,
            email,
            formattedName,
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&fit=crop&q=80',
            'Senior Project Architect',
            'IntellMeet Enterprise'
          ]
        );
        user = insertResult.rows[0];
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        company: user.company,
      };
      
      return next();
    } catch (dbErr) {
      console.error('Error handling dev-token verification:', dbErr);
      return res.status(500).json({ error: 'Database authentication verification error' });
    }
  }

  // 2. Real Firebase token verification
  if (!firebaseInitialized) {
    return res.status(500).json({ 
      error: 'Firebase SDK not configured. Set FIREBASE_ env values or log in using dev-token-... credentials.' 
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';
    const name = decodedToken.name || email.split('@')[0];
    const avatar = decodedToken.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&fit=crop&q=80';

    // Verify user exists in pg table, or seed them
    const selectResult = await query('SELECT * FROM users WHERE id = $1', [uid]);
    let user = selectResult.rows[0];

    if (!user) {
      const insertResult = await query(
        'INSERT INTO users(id, email, name, avatar, role, company) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
        [uid, email, name, avatar, 'Team Member', 'IntellMeet Enterprise']
      );
      user = insertResult.rows[0];
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      company: user.company,
    };
    
    next();
  } catch (err: any) {
    console.error('Firebase Auth verification failed:', err);
    res.status(403).json({ error: 'Forbidden: Invalid authorization credentials', details: err.message });
  }
};
