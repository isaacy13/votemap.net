import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { Env } from '../config/env';

export function createHealthRouter(prisma: PrismaClient, env: Env) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        zkPassportDevMode: Boolean(env.ZKPASSPORT_DEV_MODE || env.NODE_ENV !== 'production'),
      });
    } catch {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
