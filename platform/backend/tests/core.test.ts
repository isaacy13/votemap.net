import { createHash } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hashPayload, appendLedgerEntry } from '../src/services/ledger';
import { expireDueStakes } from '../src/jobs/expireStakes';
import { consumeVoteSession } from '../src/services/voteSession';
import { verifyZkPassport } from '../src/services/zkpassport';
import type { Env } from '../src/config/env';

const hasDb = Boolean(process.env.DATABASE_URL);

const mockEnv = {
  NODE_ENV: 'test',
  ZKPASSPORT_DEV_MODE: true,
  ZKPASSPORT_DOMAIN: 'localhost',
} as Env;

describe('hashPayload', () => {
  it('is stable for the same object', () => {
    const a = hashPayload({ action: 'stake', amountUsdc: 10, outcomeId: 'x' });
    const b = hashPayload({ action: 'stake', amountUsdc: 10, outcomeId: 'x' });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});

describe('verifyZkPassport mock', () => {
  it('accepts mock mode in dev', async () => {
    const result = await verifyZkPassport(mockEnv, {
      mode: 'mock',
      userId: 'user-1',
      mockNullifier: 'test-nullifier-abc',
      ageBand: '18+',
    });
    expect(result.verified).toBe(true);
    expect(result.uniqueIdentifier).toBe('test-nullifier-abc');
    expect(result.provider).toBe('mock');
  });
});

describe.runIf(hasDb)('database flows', () => {
  const prisma = new PrismaClient();
  let userId = '';
  let outcomeId = '';
  let entityId = '';

  beforeAll(async () => {
    await prisma.$connect();
    const user = await prisma.user.create({
      data: {
        provider: 'dev',
        providerId: `test:${Date.now()}`,
        displayName: 'Test Voter',
        isIdentityVerified: true,
        verificationProvider: 'mock',
        zkPassportNullifier: `nullifier-${Date.now()}`,
        lastVerifiedAt: new Date(),
      },
    });
    userId = user.id;

    const entity = await prisma.entity.create({
      data: {
        name: 'Test Entity',
        slug: `test-entity-${Date.now()}`,
        type: 'nonprofit',
        walletAddress: 'TestWallet',
        ownerUserId: userId,
      },
    });
    entityId = entity.id;

    const outcome = await prisma.outcome.create({
      data: {
        entityId,
        title: 'Test outcome',
        description: 'Desc',
        successCriteria: 'Done',
      },
    });
    outcomeId = outcome.id;
  });

  afterAll(async () => {
    await prisma.ledgerEntry.deleteMany({ where: { userId } });
    await prisma.resolutionDecision.deleteMany({ where: { userId } });
    await prisma.stake.deleteMany({ where: { userId } });
    await prisma.donation.deleteMany({ where: { userId } });
    await prisma.deliverable.deleteMany({ where: { outcomeId } });
    await prisma.voteSession.deleteMany({ where: { userId } });
    await prisma.outcome.deleteMany({ where: { id: outcomeId } });
    await prisma.entity.deleteMany({ where: { id: entityId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('requires confirmed vote session to consume', async () => {
    const session = await prisma.voteSession.create({
      data: {
        userId,
        action: 'stake',
        payloadHash: hashPayload({ action: 'stake', outcomeId }),
        expiresAt: new Date(Date.now() + 60_000),
        status: 'pending',
      },
    });
    const pending = await consumeVoteSession(prisma, {
      voteSessionId: session.id,
      userId,
      action: 'stake',
    });
    expect(pending.ok).toBe(false);

    await prisma.voteSession.update({
      where: { id: session.id },
      data: { status: 'confirmed', confirmedAt: new Date() },
    });
    const ok = await consumeVoteSession(prisma, {
      voteSessionId: session.id,
      userId,
      action: 'stake',
    });
    expect(ok.ok).toBe(true);

    const replay = await consumeVoteSession(prisma, {
      voteSessionId: session.id,
      userId,
      action: 'stake',
    });
    expect(replay.ok).toBe(false);
  });

  it('locks stake and refunds on deadline expiry', async () => {
    const stake = await prisma.stake.create({
      data: {
        outcomeId,
        userId,
        amountUsdc: 25,
        deadlineAt: new Date(Date.now() - 1000),
        status: 'active',
      },
    });
    await appendLedgerEntry(prisma, {
      type: 'stake_lock',
      amountUsdc: 25,
      userId,
      outcomeId,
      stakeId: stake.id,
      entityId,
    });

    const { expiredCount } = await expireDueStakes(prisma);
    expect(expiredCount).toBeGreaterThanOrEqual(1);

    const updated = await prisma.stake.findUnique({ where: { id: stake.id } });
    expect(updated?.status).toBe('refunded');

    const refund = await prisma.ledgerEntry.findFirst({
      where: { stakeId: stake.id, type: 'deadline_refund' },
    });
    expect(refund).toBeTruthy();
  });

  it('records donations on the ledger', async () => {
    const donation = await prisma.donation.create({
      data: { entityId, userId, amountUsdc: 5, memo: 'test' },
    });
    await appendLedgerEntry(prisma, {
      type: 'donation',
      amountUsdc: 5,
      userId,
      entityId,
      donationId: donation.id,
      memo: 'test',
    });
    const entry = await prisma.ledgerEntry.findFirst({
      where: { donationId: donation.id },
    });
    expect(entry?.type).toBe('donation');
    expect(createHash('sha256').update('x').digest('hex')).toHaveLength(64);
  });
});
