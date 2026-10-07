import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types/index.ts';

const DEFAULT_JWT_SECRET = 'dayflow_jwt_secure_secret_key_prod_2026';

export function generateToken(payload: AuthTokenPayload, secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET): string {
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string, secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET): AuthTokenPayload | null {
  try {
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}
