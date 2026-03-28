import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { writeLimiter } from '../middleware/rateLimiter';
import { deliverableSchema } from '../utils/validation';
import { getParam } from '../utils/params';

export function createDeliverablesRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router();

  /**
   * POST /issues/:id/deliverable — Submit proof of delivery or monthly update.
   */
  router.post('/:id/deliverable', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = deliverableSchema.parse(req.body);
      const issueId = getParam(req, 'id');

      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { entity: true },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Create deliverable
      const deliverable = await prisma.deliverable.create({
        data: {
          issueId,
          proofText: body.proofText,
          proofFiles: body.proofFiles,
          proofTxHashes: body.proofTxHashes,
        },
      });

      // If this is a monthly update, update the entity's lastMonthlyUpdate timestamp
      const isMonthlyUpdate = body.proofText.toLowerCase().includes('monthly update');
      if (isMonthlyUpdate) {
        await prisma.entity.update({
          where: { id: issue.entityId },
          data: { lastMonthlyUpdate: new Date() },
        });
      }

      // If issue is open and this is a resolution deliverable, mark as claimed
      if (issue.status === 'open' && !isMonthlyUpdate) {
        await prisma.issue.update({
          where: { id: issueId },
          data: { status: 'claimed' },
        });
      }

      res.status(201).json({ deliverable });
    } catch (error) {
      console.error('Deliverable error:', error);
      res.status(400).json({ error: 'Failed to submit deliverable' });
    }
  });

  return router;
}
