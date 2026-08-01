import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { Server as SocketServer } from 'socket.io';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { createOutcomeSchema, createStakeSchema, resolveStakeSchema, deliverableSchema } from '../utils/validation';
import { getParam } from '../utils/params';
import { appendLedgerEntry, hashPayload } from '../services/ledger';
import { consumeVoteSession } from '../services/voteSession';

function publicUser<T extends { showName: boolean; displayName: string | null }>(u: T) {
  return u.showName ? u : { ...u, displayName: 'Anonymous' };
}

export function createOutcomesRouter(prisma: PrismaClient, jwtSecret: string, io: SocketServer) {
  const router = Router();

  router.get('/', readLimiter, async (_req: Request, res: Response) => {
    try {
      const outcomes = await prisma.outcome.findMany({
        include: {
          entity: { select: { id: true, name: true, type: true, verified: true, slug: true } },
          _count: { select: { stakes: true, deliverables: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ outcomes });
    } catch (error) {
      console.error('List outcomes error:', error);
      res.status(500).json({ error: 'Failed to list outcomes' });
    }
  });

  router.get('/:id', readLimiter, async (req: Request, res: Response) => {
    try {
      const id = getParam(req, 'id');
      const outcome = await prisma.outcome.findUnique({
        where: { id },
        include: {
          entity: { include: { links: { orderBy: { sortOrder: 'asc' } } } },
          stakes: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  showName: true,
                  reliabilityScore: true,
                  tier: true,
                  isIdentityVerified: true,
                  ageBand: true,
                  region: true,
                  lastVerifiedAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          deliverables: { orderBy: { submittedAt: 'desc' } },
        },
      });
      if (!outcome) {
        res.status(404).json({ error: 'Outcome not found' });
        return;
      }
      res.json({
        ...outcome,
        stakes: outcome.stakes.map((s) => ({ ...s, user: publicUser(s.user) })),
      });
    } catch (error) {
      console.error('Get outcome error:', error);
      res.status(500).json({ error: 'Failed to get outcome' });
    }
  });

  router.post('/', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req, res) => {
    try {
      const body = createOutcomeSchema.parse(req.body);
      if (body.entityId) {
        const entity = await prisma.entity.findUnique({ where: { id: body.entityId } });
        if (!entity) {
          res.status(404).json({ error: 'Entity not found' });
          return;
        }
      }
      const outcome = await prisma.outcome.create({
        data: {
          entityId: body.entityId,
          title: body.title,
          description: body.description,
          successCriteria: body.successCriteria,
          defaultSplitJson: body.defaultSplitJson,
        },
      });
      io.emit('outcome-created', { outcomeId: outcome.id });
      res.status(201).json({ outcome });
    } catch (error) {
      console.error('Create outcome error:', error);
      res.status(400).json({ error: 'Failed to create outcome' });
    }
  });

  router.post(
    '/:id/stakes',
    writeLimiter,
    requireWriteAccess(jwtSecret),
    idempotency,
    async (req, res) => {
      try {
        const body = createStakeSchema.parse(req.body);
        const outcomeId = getParam(req, 'id');
        const userId = req.user!.userId;
        const deadlineAt = new Date(body.deadlineAt);

        if (deadlineAt.getTime() <= Date.now()) {
          res.status(400).json({ error: 'Deadline must be in the future' });
          return;
        }

        const payloadHash = hashPayload({
          action: 'stake',
          outcomeId,
          amountUsdc: body.amountUsdc,
          deadlineAt: body.deadlineAt,
        });

        const consumed = await consumeVoteSession(prisma, {
          voteSessionId: body.voteSessionId,
          userId,
          action: 'stake',
          payloadHash,
        });
        if (!consumed.ok) {
          res.status(consumed.status).json({ error: consumed.error, code: consumed.code });
          return;
        }

        const outcome = await prisma.outcome.findUnique({ where: { id: outcomeId } });
        if (!outcome) {
          res.status(404).json({ error: 'Outcome not found' });
          return;
        }
        if (outcome.status !== 'open' && outcome.status !== 'delivery_submitted') {
          res.status(400).json({ error: 'Outcome is not open for stakes' });
          return;
        }

        const result = await prisma.$transaction(async (tx) => {
          const stake = await tx.stake.create({
            data: {
              outcomeId,
              userId,
              amountUsdc: body.amountUsdc,
              deadlineAt,
              txHash: body.txHash,
              status: 'active',
            },
          });
          await tx.outcome.update({
            where: { id: outcomeId },
            data: { totalBountyUsdc: { increment: body.amountUsdc } },
          });
          const ledger = await appendLedgerEntry(tx, {
            type: 'stake_lock',
            amountUsdc: body.amountUsdc,
            userId,
            outcomeId,
            stakeId: stake.id,
            entityId: outcome.entityId,
            txHash: body.txHash,
            memo: `Stake locked until ${deadlineAt.toISOString()}`,
          });
          return { stake, ledger };
        });

        io.to(`/outcome/${outcomeId}`).emit('stake', {
          outcomeId,
          stakeId: result.stake.id,
        });
        res.status(201).json(result);
      } catch (error) {
        console.error('Stake error:', error);
        res.status(400).json({ error: 'Failed to create stake' });
      }
    }
  );

  router.post(
    '/:id/deliverables',
    writeLimiter,
    requireWriteAccess(jwtSecret),
    idempotency,
    async (req, res) => {
      try {
        const body = deliverableSchema.parse(req.body);
        const outcomeId = getParam(req, 'id');
        const userId = req.user!.userId;
        const payloadHash = hashPayload({
          action: 'deliverable',
          outcomeId,
          proofText: body.proofText,
        });

        const consumed = await consumeVoteSession(prisma, {
          voteSessionId: body.voteSessionId,
          userId,
          action: 'deliverable',
          payloadHash,
        });
        if (!consumed.ok) {
          res.status(consumed.status).json({ error: consumed.error, code: consumed.code });
          return;
        }

        const outcome = await prisma.outcome.findUnique({ where: { id: outcomeId } });
        if (!outcome) {
          res.status(404).json({ error: 'Outcome not found' });
          return;
        }

        const deliverable = await prisma.$transaction(async (tx) => {
          const d = await tx.deliverable.create({
            data: {
              outcomeId,
              proofText: body.proofText,
              proofFiles: body.proofFiles,
              proofTxHashes: body.proofTxHashes,
              submittedById: userId,
            },
          });
          await tx.outcome.update({
            where: { id: outcomeId },
            data: { status: 'delivery_submitted' },
          });
          return d;
        });

        io.to(`/outcome/${outcomeId}`).emit('deliverable', { outcomeId, deliverableId: deliverable.id });
        res.status(201).json({ deliverable });
      } catch (error) {
        console.error('Deliverable error:', error);
        res.status(400).json({ error: 'Failed to submit deliverable' });
      }
    }
  );

  router.post(
    '/:id/resolve',
    writeLimiter,
    requireWriteAccess(jwtSecret),
    idempotency,
    async (req, res) => {
      try {
        const body = resolveStakeSchema.parse(req.body);
        const outcomeId = getParam(req, 'id');
        const userId = req.user!.userId;
        const payloadHash = hashPayload({
          action: 'resolve',
          outcomeId,
          stakeId: body.stakeId,
          decision: body.decision,
        });

        const consumed = await consumeVoteSession(prisma, {
          voteSessionId: body.voteSessionId,
          userId,
          action: 'resolve',
          payloadHash,
        });
        if (!consumed.ok) {
          res.status(consumed.status).json({ error: consumed.error, code: consumed.code });
          return;
        }

        const stake = await prisma.stake.findUnique({
          where: { id: body.stakeId },
          include: { outcome: true },
        });
        if (!stake || stake.outcomeId !== outcomeId) {
          res.status(404).json({ error: 'Stake not found' });
          return;
        }
        if (stake.userId !== userId) {
          res.status(403).json({ error: 'You can only resolve your own stakes' });
          return;
        }
        if (stake.status !== 'active') {
          res.status(400).json({ error: 'Stake is not active' });
          return;
        }
        if (stake.outcome.status !== 'delivery_submitted' && stake.outcome.status !== 'partially_resolved') {
          res.status(400).json({ error: 'Outcome must have a submitted deliverable' });
          return;
        }

        const approve = body.decision === 'approve';
        const result = await prisma.$transaction(async (tx) => {
          const decision = await tx.resolutionDecision.create({
            data: { stakeId: stake.id, userId, decision: body.decision },
          });
          const updatedStake = await tx.stake.update({
            where: { id: stake.id },
            data: approve
              ? { status: 'released', releasedAt: new Date() }
              : { status: 'refunded', refundedAt: new Date() },
          });
          await appendLedgerEntry(tx, {
            type: approve ? 'release' : 'refund',
            amountUsdc: stake.amountUsdc,
            userId,
            outcomeId,
            stakeId: stake.id,
            entityId: stake.outcome.entityId,
            memo: approve ? 'Stake released to deliverers' : 'Stake refunded by voter',
          });
          await tx.user.update({
            where: { id: userId },
            data: { reliabilityScore: { increment: approve ? 1 : -1 } },
          });

          const remaining = await tx.stake.count({
            where: { outcomeId, status: 'active' },
          });
          await tx.outcome.update({
            where: { id: outcomeId },
            data: {
              status: remaining === 0 ? 'resolved' : 'partially_resolved',
            },
          });

          return { decision, stake: updatedStake };
        });

        io.to(`/outcome/${outcomeId}`).emit('resolution', {
          outcomeId,
          stakeId: stake.id,
          decision: body.decision,
        });
        res.json(result);
      } catch (error) {
        console.error('Resolve error:', error);
        res.status(400).json({ error: 'Failed to resolve stake' });
      }
    }
  );

  return router;
}
