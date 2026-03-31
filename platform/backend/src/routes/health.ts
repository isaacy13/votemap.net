import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export function createHealthRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
  });

  return router;
}
