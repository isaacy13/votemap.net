import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import type { Server as SocketServer } from 'socket.io';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { readLimiter, writeLimiter } from '../middleware/rateLimiter';
import { createEntitySchema, updateEntitySchema, createDonationSchema } from '../utils/validation';
import { getParam } from '../utils/params';
import { appendLedgerEntry, hashPayload } from '../services/ledger';
import { consumeVoteSession } from '../services/voteSession';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function createEntitiesRouter(prisma: PrismaClient, jwtSecret: string, io: SocketServer) {
  const router = Router();

  router.get('/', readLimiter, async (_req: Request, res: Response) => {
    try {
      const entities = await prisma.entity.findMany({
        include: {
          links: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { outcomes: true, donations: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ entities });
    } catch (error) {
      console.error('List entities error:', error);
      res.status(500).json({ error: 'Failed to list entities' });
    }
  });

  router.get('/:idOrSlug', readLimiter, async (req: Request, res: Response) => {
    try {
      const idOrSlug = getParam(req, 'idOrSlug');
      const entity = await prisma.entity.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          links: { orderBy: { sortOrder: 'asc' } },
          outcomes: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              totalBountyUsdc: true,
              createdAt: true,
            },
          },
          donations: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              user: {
                select: { id: true, displayName: true, showName: true, reliabilityScore: true, tier: true, isIdentityVerified: true, ageBand: true, region: true, lastVerifiedAt: true },
              },
            },
          },
        },
      });
      if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
      }

      const donationTotal = await prisma.donation.aggregate({
        where: { entityId: entity.id },
        _sum: { amountUsdc: true },
      });

      res.json({
        entity: {
          ...entity,
          donations: entity.donations.map((d) => ({
            ...d,
            user: d.user.showName ? d.user : { ...d.user, displayName: 'Anonymous' },
          })),
          donationTotalUsdc: donationTotal._sum.amountUsdc ?? new Prisma.Decimal(0),
        },
      });
    } catch (error) {
      console.error('Get entity error:', error);
      res.status(500).json({ error: 'Failed to get entity' });
    }
  });

  router.post('/', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req, res) => {
    try {
      const body = createEntitySchema.parse(req.body);
      const userId = req.user!.userId;
      const slug = body.slug ?? slugify(body.name);

      const entity = await prisma.entity.create({
        data: {
          name: body.name,
          type: body.type,
          walletAddress: body.walletAddress,
          slug,
          bio: body.bio,
          ownerUserId: userId,
          links: body.links
            ? {
                create: body.links.map((l, i) => ({
                  label: l.label,
                  url: l.url,
                  sortOrder: i,
                })),
              }
            : undefined,
        },
        include: { links: true },
      });

      io.emit('entity-created', { entityId: entity.id });
      res.status(201).json({ entity });
    } catch (error) {
      console.error('Create entity error:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid entity data', details: error.flatten().fieldErrors });
        return;
      }
      res.status(400).json({ error: 'Failed to create entity' });
    }
  });

  router.patch('/:id', writeLimiter, requireWriteAccess(jwtSecret), async (req, res) => {
    try {
      const id = getParam(req, 'id');
      const body = updateEntitySchema.parse(req.body);
      const entity = await prisma.entity.findUnique({ where: { id } });
      if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
      }
      if (entity.ownerUserId !== req.user!.userId) {
        res.status(403).json({ error: 'Only the entity owner can update this profile' });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (body.links) {
          await tx.entityLink.deleteMany({ where: { entityId: id } });
          await tx.entityLink.createMany({
            data: body.links.map((l, i) => ({
              entityId: id,
              label: l.label,
              url: l.url,
              sortOrder: i,
            })),
          });
        }
        return tx.entity.update({
          where: { id },
          data: {
            bio: body.bio,
            avatarUrl: body.avatarUrl,
          },
          include: { links: { orderBy: { sortOrder: 'asc' } } },
        });
      });

      res.json({ entity: updated });
    } catch (error) {
      console.error('Update entity error:', error);
      res.status(400).json({ error: 'Failed to update entity' });
    }
  });

  router.post(
    '/:id/donations',
    writeLimiter,
    requireWriteAccess(jwtSecret),
    idempotency,
    async (req, res) => {
      try {
        const body = createDonationSchema.parse(req.body);
        const entityId = getParam(req, 'id');
        const userId = req.user!.userId;
        const payloadHash = hashPayload({
          action: 'donate',
          entityId,
          amountUsdc: body.amountUsdc,
          memo: body.memo ?? null,
        });

        const consumed = await consumeVoteSession(prisma, {
          voteSessionId: body.voteSessionId,
          userId,
          action: 'donate',
          payloadHash,
        });
        if (!consumed.ok) {
          res.status(consumed.status).json({ error: consumed.error, code: consumed.code });
          return;
        }

        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) {
          res.status(404).json({ error: 'Entity not found' });
          return;
        }

        const result = await prisma.$transaction(async (tx) => {
          const donation = await tx.donation.create({
            data: {
              entityId,
              userId,
              amountUsdc: body.amountUsdc,
              memo: body.memo,
              txHash: body.txHash,
            },
          });
          const ledger = await appendLedgerEntry(tx, {
            type: 'donation',
            amountUsdc: body.amountUsdc,
            userId,
            entityId,
            donationId: donation.id,
            txHash: body.txHash,
            memo: body.memo ?? 'Direct donation',
          });
          return { donation, ledger };
        });

        io.to(`/entity/${entityId}`).emit('donation', {
          entityId,
          donationId: result.donation.id,
        });
        res.status(201).json(result);
      } catch (error) {
        console.error('Donation error:', error);
        res.status(400).json({ error: 'Failed to create donation' });
      }
    }
  );

  return router;
}
