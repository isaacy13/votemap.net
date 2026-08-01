import { PrismaClient } from '@prisma/client';
import { appendLedgerEntry } from '../services/ledger';

/**
 * Consume a Face ID–confirmed vote session for a money/vote action.
 * Marks session consumed atomically; rejects reuse / mismatch / expiry.
 */
export async function consumeVoteSession(
  prisma: PrismaClient,
  opts: {
    voteSessionId: string;
    userId: string;
    action: string;
    payloadHash?: string;
  }
) {
  const session = await prisma.voteSession.findUnique({
    where: { id: opts.voteSessionId },
  });

  if (!session) {
    return { ok: false as const, error: 'Vote session not found', status: 404 };
  }
  if (session.userId !== opts.userId) {
    return { ok: false as const, error: 'Vote session belongs to another user', status: 403 };
  }
  if (session.action !== opts.action) {
    return { ok: false as const, error: 'Vote session action mismatch', status: 400 };
  }
  if (session.status !== 'confirmed') {
    return {
      ok: false as const,
      error: 'Vote session must be Face ID confirmed on your phone first',
      status: 403,
      code: 'FACEID_REQUIRED',
    };
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.voteSession.update({
      where: { id: session.id },
      data: { status: 'expired' },
    });
    return { ok: false as const, error: 'Vote session expired', status: 400 };
  }
  if (opts.payloadHash && session.payloadHash !== opts.payloadHash) {
    return { ok: false as const, error: 'Vote session payload mismatch', status: 400 };
  }

  const updated = await prisma.voteSession.updateMany({
    where: { id: session.id, status: 'confirmed' },
    data: { status: 'consumed', consumedAt: new Date() },
  });

  if (updated.count !== 1) {
    return { ok: false as const, error: 'Vote session already used', status: 409 };
  }

  return { ok: true as const, session };
}

export { appendLedgerEntry };
