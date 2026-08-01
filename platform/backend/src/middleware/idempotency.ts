import { Request, Response, NextFunction } from 'express';

const processedKeys = new Map<string, { status: number; body: unknown; expiry: number }>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Middleware: Ensures idempotent write operations via Idempotency-Key header.
 */
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key) {
    next();
    return;
  }

  const cached = processedKeys.get(key);
  if (cached && cached.expiry > Date.now()) {
    res.status(cached.status).json(cached.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    processedKeys.set(key, {
      status: res.statusCode,
      body,
      expiry: Date.now() + CACHE_TTL_MS,
    });
    return originalJson(body);
  };

  next();
}
