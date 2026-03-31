import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { writeLimiter } from '../middleware/rateLimiter';
import { contributeSchema } from '../utils/validation';
import { getParam } from '../utils/params';
import type { Server as SocketServer } from 'socket.io';

export function createContributionsRouter(prisma: PrismaClient, jwtSecret: string, io: SocketServer) {
  const router = Router();

  /**
   * POST /issues/:id/contribute — Contribute USDC to an issue (write access required).
   * Blocks if entity has not posted a monthly update in the last 30 days.
   */
  router.post('/:id/contribute', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = contributeSchema.parse(req.body);
      const issueId = getParam(req, 'id');
      const userId = req.user!.userId;

      // Verify issue exists and is open
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { entity: true },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      if (issue.status !== 'open') {
        res.status(400).json({ error: 'Issue is not open for contributions' });
        return;
      }

      // Block new contributions if entity hasn't posted monthly update in 30 days
      if (issue.entity.lastMonthlyUpdate) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (issue.entity.lastMonthlyUpdate < thirtyDaysAgo) {
          res.status(400).json({ error: 'Entity has not posted a monthly update in the last 30 days' });
          return;
        }
      }

      // Create contribution and update issue total (atomic transaction)
      const [contribution] = await prisma.$transaction([
        prisma.contribution.create({
          data: {
            issueId,
            userId,
            amountUsdc: body.amountUsdc,
            txHash: body.txHash,
            resolutionDecision: 'pending',
          },
        }),
        prisma.issue.update({
          where: { id: issueId },
          data: { totalBountyUsdc: { increment: body.amountUsdc } },
        }),
      ]);

      io.to(`/issue/${issueId}`).emit('contribution', { issueId, contributionId: contribution.id });

      res.status(201).json({ contribution });
    } catch (error) {
      console.error('Contribute error:', error);
      res.status(400).json({ error: 'Failed to create contribution' });
    }
  });

  return router;
}
