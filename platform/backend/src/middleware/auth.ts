import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  provider: string;
  xUserId?: string;
  isIdentityVerified: boolean;
  isWriteEnabled: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: Requires a valid JWT (read-only access).
 */
export function requireAuth(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

/**
 * Middleware: Requires write access (X account linked + identity verified).
 */
export function requireWriteAccess(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authMiddleware = requireAuth(jwtSecret);
    authMiddleware(req, res, () => {
      if (!req.user?.xUserId || !req.user?.isIdentityVerified) {
        res.status(403).json({
          error: 'Write access requires a linked and verified X account',
        });
        return;
      }
      next();
    });
  };
}
