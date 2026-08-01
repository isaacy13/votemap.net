import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  provider: string;
  isIdentityVerified: boolean;
  isWriteEnabled: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

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

/** Write access requires authenticated + ZKPassport (or mock) identity verification. */
export function requireWriteAccess(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authMiddleware = requireAuth(jwtSecret);
    authMiddleware(req, res, () => {
      if (!req.user?.isIdentityVerified) {
        res.status(403).json({
          error: 'Write access requires ZKPassport identity verification',
          code: 'IDENTITY_REQUIRED',
        });
        return;
      }
      next();
    });
  };
}
