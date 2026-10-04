import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_jwt_secure_secret_key_prod_2026';

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}
