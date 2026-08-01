import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const appleAuthSchema = z.object({
  idToken: z.string().min(1),
  nonce: z.string().optional(),
});

export const devLoginSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(100).optional(),
});

export const createOutcomeSchema = z.object({
  entityId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  successCriteria: z.string().min(1).max(5000),
  defaultSplitJson: z.string().max(2000).optional(),
});

export const createStakeSchema = z.object({
  amountUsdc: z.number().positive().max(1_000_000_000),
  deadlineAt: z.string().datetime(),
  txHash: z.string().min(1).max(200).optional(),
  voteSessionId: z.string().uuid(),
});

export const createDonationSchema = z.object({
  amountUsdc: z.number().positive().max(1_000_000_000),
  memo: z.string().max(1000).optional(),
  txHash: z.string().min(1).max(200).optional(),
  voteSessionId: z.string().uuid(),
});

export const resolveStakeSchema = z.object({
  stakeId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  voteSessionId: z.string().uuid(),
});

export const deliverableSchema = z.object({
  proofText: z.string().min(1).max(10000),
  proofFiles: z.array(z.string().url()).default([]),
  proofTxHashes: z.array(z.string()).default([]),
  voteSessionId: z.string().uuid(),
});

export const createEntitySchema = z.object({
  name: z.string().min(1).max(500),
  type: z.enum([
    'politician',
    'government',
    'company',
    'nonprofit',
    'creator',
    'sports_team',
    'small_business',
    'church',
  ]),
  walletAddress: z.string().min(1).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(100)
    .optional(),
  bio: z.string().max(2000).optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        url: z.string().url(),
      })
    )
    .max(20)
    .optional(),
});

export const updateEntitySchema = z.object({
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        url: z.string().url(),
      })
    )
    .max(20)
    .optional(),
});

export const createVoteSessionSchema = z.object({
  action: z.enum(['stake', 'donate', 'resolve', 'deliverable']),
  payloadHash: z.string().min(1).max(128),
});

export const zkPassportVerifySchema = z.object({
  mode: z.enum(['live', 'mock']).default('mock'),
  proofs: z.unknown().optional(),
  query: z.unknown().optional(),
  queryResult: z.unknown().optional(),
  mockNullifier: z.string().min(8).max(200).optional(),
  ageBand: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
});
