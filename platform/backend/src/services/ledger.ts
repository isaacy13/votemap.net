import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';

export type LedgerType =
  | 'stake_lock'
  | 'release'
  | 'refund'
  | 'deadline_refund'
  | 'donation'
  | 'adjust';

export interface AppendLedgerInput {
  type: LedgerType;
  amountUsdc: Prisma.Decimal | number | string;
  memo?: string;
  txHash?: string | null;
  userId?: string | null;
  entityId?: string | null;
  outcomeId?: string | null;
  stakeId?: string | null;
  donationId?: string | null;
}

export async function appendLedgerEntry(
  tx: Prisma.TransactionClient | PrismaClient,
  input: AppendLedgerInput
) {
  return tx.ledgerEntry.create({
    data: {
      type: input.type,
      amountUsdc: input.amountUsdc,
      memo: input.memo,
      txHash: input.txHash ?? null,
      userId: input.userId ?? null,
      entityId: input.entityId ?? null,
      outcomeId: input.outcomeId ?? null,
      stakeId: input.stakeId ?? null,
      donationId: input.donationId ?? null,
    },
  });
}

export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
