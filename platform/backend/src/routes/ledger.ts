import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { readLimiter } from '../middleware/rateLimiter';

export function createLedgerRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', readLimiter, async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 50), 100);
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;

      const entries = await prisma.ledgerEntry.findMany({
        where: type ? { type } : undefined,
        take: limit,
        ...(cursor
          ? {
              skip: 1,
              cursor: { id: cursor },
            }
          : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, displayName: true, showName: true, tier: true },
          },
          entity: { select: { id: true, name: true, slug: true } },
          outcome: { select: { id: true, title: true } },
        },
      });

      const sanitized = entries.map((e) => ({
        ...e,
        user: e.user
          ? e.user.showName
            ? e.user
            : { ...e.user, displayName: 'Anonymous' }
          : null,
      }));

      res.json({
        entries: sanitized,
        nextCursor: entries.length === limit ? entries[entries.length - 1]?.id : null,
      });
    } catch (error) {
      console.error('Ledger list error:', error);
      res.status(500).json({ error: 'Failed to list ledger entries' });
    }
  });

  return router;
}
