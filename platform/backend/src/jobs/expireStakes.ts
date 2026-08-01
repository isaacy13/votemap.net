import { PrismaClient } from '@prisma/client';
import type { Server as SocketServer } from 'socket.io';
import { appendLedgerEntry } from '../services/ledger';

export async function expireDueStakes(prisma: PrismaClient, io?: SocketServer) {
  const due = await prisma.stake.findMany({
    where: {
      status: 'active',
      deadlineAt: { lte: new Date() },
    },
    include: { outcome: true },
    take: 100,
  });

  let expiredCount = 0;

  for (const stake of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.stake.updateMany({
          where: { id: stake.id, status: 'active' },
          data: { status: 'refunded', refundedAt: new Date() },
        });
        if (updated.count !== 1) return;

        await appendLedgerEntry(tx, {
          type: 'deadline_refund',
          amountUsdc: stake.amountUsdc,
          userId: stake.userId,
          outcomeId: stake.outcomeId,
          stakeId: stake.id,
          entityId: stake.outcome.entityId,
          memo: 'Automatic refund: personal deadline expired without delivery approval',
        });

        const remaining = await tx.stake.count({
          where: { outcomeId: stake.outcomeId, status: 'active' },
        });
        if (remaining === 0) {
          const openDeliverables = await tx.deliverable.count({
            where: { outcomeId: stake.outcomeId },
          });
          await tx.outcome.update({
            where: { id: stake.outcomeId },
            data: {
              status: openDeliverables > 0 ? 'resolved' : 'expired',
            },
          });
        }
      });

      expiredCount += 1;
      io?.to(`/outcome/${stake.outcomeId}`).emit('stake-expired', {
        outcomeId: stake.outcomeId,
        stakeId: stake.id,
      });
    } catch (error) {
      console.error('Failed to expire stake', stake.id, error);
    }
  }

  // Also expire stale pending vote sessions
  await prisma.voteSession.updateMany({
    where: { status: 'pending', expiresAt: { lte: new Date() } },
    data: { status: 'expired' },
  });

  return { expiredCount };
}

export function startExpireStakesJob(
  prisma: PrismaClient,
  io: SocketServer,
  intervalMs = 60_000
): NodeJS.Timeout {
  const tick = () => {
    expireDueStakes(prisma, io).catch((err) => console.error('expireDueStakes error', err));
  };
  tick();
  return setInterval(tick, intervalMs);
}
