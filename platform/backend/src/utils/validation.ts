import { z } from 'zod';

export const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const appleAuthSchema = z.object({
  idToken: z.string().min(1),
  nonce: z.string().optional(),
});

export const linkXSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});

export const createIssueSchema = z.object({
  entityId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  successCriteria: z.string().min(1).max(5000),
  targetDate: z.string().datetime().optional(),
});

export const contributeSchema = z.object({
  amountUsdc: z.number().positive(),
  txHash: z.string().min(1),
});

export const resolveSchema = z.object({
  contributionId: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
});

export const pulloutVoteSchema = z.object({
  amountWeight: z.number().positive(),
});

export const deliverableSchema = z.object({
  proofText: z.string().min(1).max(10000),
  proofFiles: z.array(z.string().url()).default([]),
  proofTxHashes: z.array(z.string()).default([]),
});
