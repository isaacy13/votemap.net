import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { JwtPayload } from '../middleware/auth';

export function generateAccessToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string
): string {
  return jwt.sign({ ...payload }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(): string {
  return uuidv4();
}
