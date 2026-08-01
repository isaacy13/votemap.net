import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { Server as SocketServer } from 'socket.io';
import { requireAuth, requireWriteAccess } from '../middleware/auth';
import { writeLimiter, readLimiter } from '../middleware/rateLimiter';
import { createVoteSessionSchema } from '../utils/validation';
import { getParam } from '../utils/params';
import type { Env } from '../config/env';

export function createVoteSessionsRouter(
  prisma: PrismaClient,
  env: Env,
  jwtSecret: string,
  io: SocketServer
) {
  const router = Router();

  /** Create a pending Face ID confirmation session (web or mobile). */
  router.post('/', writeLimiter, requireWriteAccess(jwtSecret), async (req: Request, res: Response) => {
    try {
      const body = createVoteSessionSchema.parse(req.body);
      const userId = req.user!.userId;
      const expiresAt = new Date(Date.now() + env.VOTE_SESSION_TTL_SEC * 1000);

      const session = await prisma.voteSession.create({
        data: {
          userId,
          action: body.action,
          payloadHash: body.payloadHash,
          expiresAt,
        },
      });

      res.status(201).json({
        session,
        deepLink: `votemap://vote-confirm/${session.id}`,
        expiresInSec: env.VOTE_SESSION_TTL_SEC,
      });
    } catch (error) {
      console.error('Create vote session error:', error);
      res.status(400).json({ error: 'Failed to create vote session' });
    }
  });

  /** Poll session status (web waiting for phone Face ID). */
  router.get('/:id', readLimiter, requireAuth(jwtSecret), async (req: Request, res: Response) => {
    const id = getParam(req, 'id');
    const session = await prisma.voteSession.findUnique({ where: { id } });
    if (!session || session.userId !== req.user!.userId) {
      res.status(404).json({ error: 'Vote session not found' });
      return;
    }
    if (session.status === 'pending' && session.expiresAt.getTime() < Date.now()) {
      const expired = await prisma.voteSession.update({
        where: { id },
        data: { status: 'expired' },
      });
      res.json({ session: expired });
      return;
    }
    res.json({ session });
  });

  /**
   * Confirm session after successful Face ID on phone.
   * Client must only call this after LocalAuthentication.authenticateAsync succeeds.
   */
  router.post(
    '/:id/confirm',
    writeLimiter,
    requireWriteAccess(jwtSecret),
    async (req: Request, res: Response) => {
      try {
        const id = getParam(req, 'id');
        const userId = req.user!.userId;
        const session = await prisma.voteSession.findUnique({ where: { id } });

        if (!session || session.userId !== userId) {
          res.status(404).json({ error: 'Vote session not found' });
          return;
        }
        if (session.status !== 'pending') {
          res.status(400).json({ error: `Session is ${session.status}` });
          return;
        }
        if (session.expiresAt.getTime() < Date.now()) {
          await prisma.voteSession.update({ where: { id }, data: { status: 'expired' } });
          res.status(400).json({ error: 'Vote session expired' });
          return;
        }

        const updated = await prisma.voteSession.update({
          where: { id },
          data: { status: 'confirmed', confirmedAt: new Date() },
        });

        io.to(`/vote-session/${id}`).emit('vote-session-confirmed', { sessionId: id });
        res.json({ session: updated });
      } catch (error) {
        console.error('Confirm vote session error:', error);
        res.status(400).json({ error: 'Failed to confirm vote session' });
      }
    }
  );

  return router;
}
