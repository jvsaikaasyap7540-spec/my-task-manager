import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { queryOne, execute } from '../db/database.ts';
import { generateToken } from '../utils/jwt.ts';
import { UserRecord } from '../types/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { isValidEmail } from '../../utils/email.ts';

const googleOAuthClient = new OAuth2Client();

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body ?? {};

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      res.status(422).json({
        success: false,
        message: 'Name, email, and password are required',
      });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(422).json({ success: false, message: 'Name must be between 2 and 80 characters' });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      res.status(422).json({ success: false, message: 'Enter a valid email address' });
      return;
    }

    if (password.trim().length === 0 || password.length < 8 || password.length > 72) {
      res.status(422).json({
        success: false,
        message: 'Password must be between 8 and 72 characters and cannot be blank',
      });
      return;
    }

    const existing = await queryOne<UserRecord>(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO users (id, name, email, passwordHash, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, cleanName, cleanEmail, passwordHash, now, now]
    );

    const token = generateToken({
      userId: id,
      email: cleanEmail,
      name: cleanName,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id,
        name: cleanName,
        email: cleanEmail,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating account',
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      res.status(422).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      res.status(422).json({ success: false, message: 'Enter a valid email address' });
      return;
    }
    const user = await queryOne<UserRecord>(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
    });
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const credential = req.body?.credential;

  if (!clientId) {
    res.status(503).json({ success: false, message: 'Google sign-in is not configured on this server' });
    return;
  }
  if (typeof credential !== 'string' || !credential) {
    res.status(422).json({ success: false, message: 'Google credential is required' });
    return;
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      res.status(401).json({ success: false, message: 'Google account email must be verified' });
      return;
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    let user = await queryOne<UserRecord>(`SELECT * FROM users WHERE googleId = ?`, [payload.sub]);
    if (!user) {
      user = await queryOne<UserRecord>(`SELECT * FROM users WHERE email = ?`, [cleanEmail]);
      if (user?.googleId && user.googleId !== payload.sub) {
        res.status(409).json({ success: false, message: 'This email is linked to a different Google account' });
        return;
      }

      const now = new Date().toISOString();
      if (user) {
        await execute(`UPDATE users SET googleId = ?, updatedAt = ? WHERE id = ?`, [payload.sub, now, user.id]);
        user.googleId = payload.sub;
      } else {
        const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const name = payload.name?.trim() || cleanEmail.split('@')[0];
        const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
        await execute(
          `INSERT INTO users (id, name, email, googleId, passwordHash, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, name, cleanEmail, payload.sub, passwordHash, now, now]
        );
        user = { id, name, email: cleanEmail, googleId: payload.sub, passwordHash, createdAt: now, updatedAt: now };
      }
    }

    const token = generateToken({ userId: user.id, email: user.email, name: user.name });
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ success: false, message: 'Google sign-in could not be verified' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await queryOne<UserRecord>(`SELECT id, name, email, createdAt FROM users WHERE id = ?`, [userId]);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
