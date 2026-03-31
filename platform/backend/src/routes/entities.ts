import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { createEntitySchema } from '../utils/validation';
import { getParam } from '../utils/params';
import type { Server as SocketServer } from 'socket.io';

export function createEntitiesRouter(prisma: PrismaClient, jwtSecret: string, io: SocketServer) {
  const router = Router();

  /**
   * GET /entities — Public listing of all entities (read-only, no auth required).
   */
  router.get('/', readLimiter, async (_req: Request, res: Response) => {
    try {
      const entities = await prisma.entity.findMany({
        include: {
          _count: { select: { issues: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ entities });
    } catch (error) {
      console.error('List entities error:', error);
      res.status(500).json({ error: 'Failed to list entities' });
    }
  });

  /**
   * GET /entities/:id — Public detail of a single entity with its issues.
   */
  router.get('/:id', readLimiter, async (req: Request, res: Response) => {
    try {
      const id = getParam(req, 'id');
      const entity = await prisma.entity.findUnique({
        where: { id },
        include: {
          issues: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              totalBountyUsdc: true,
              createdAt: true,
            },
          },
        },
      });

      if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
      }

      res.json({ entity });
    } catch (error) {
      console.error('Get entity error:', error);
      res.status(500).json({ error: 'Failed to get entity' });
    }
  });

  /**
   * POST /entities — Create a new entity (write access required).
   */
  router.post('/', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = createEntitySchema.parse(req.body);

      const entity = await prisma.entity.create({
        data: {
          name: body.name,
          type: body.type,
          walletAddress: body.walletAddress,
        },
      });

      io.emit('entity-created', { entityId: entity.id });

      res.status(201).json({ entity });
    } catch (error) {
      console.error('Create entity error:', error);
      res.status(400).json({ error: 'Failed to create entity' });
    }
  });

  return router;
}
