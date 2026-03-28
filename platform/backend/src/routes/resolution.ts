import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { writeLimiter } from '../middleware/rateLimiter';
import { resolveSchema, pulloutVoteSchema } from '../utils/validation';
import { getParam } from '../utils/params';

export function createResolutionRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router();

  /**
   * POST /issues/:id/resolve — Individual resolution: approve or reject own contribution share.
   */
  router.post('/:id/resolve', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = resolveSchema.parse(req.body);
      const userId = req.user!.userId;

      // Verify contribution belongs to this user
      const contribution = await prisma.contribution.findUnique({
        where: { id: body.contributionId },
        include: { issue: true },
      });

      if (!contribution) {
        res.status(404).json({ error: 'Contribution not found' });
        return;
      }

      if (contribution.userId !== userId) {
        res.status(403).json({ error: 'You can only resolve your own contributions' });
        return;
      }

      if (contribution.issue.status !== 'claimed') {
        res.status(400).json({ error: 'Issue must be in claimed status for resolution' });
        return;
      }

      if (contribution.resolutionDecision && contribution.resolutionDecision !== 'pending') {
        res.status(400).json({ error: 'Contribution already resolved' });
        return;
      }

      // Record the decision
      const [decision] = await prisma.$transaction([
        prisma.resolutionDecision.create({
          data: {
            contributionId: body.contributionId,
            userId,
            decision: body.decision,
          },
        }),
        prisma.contribution.update({
          where: { id: body.contributionId },
          data: {
            resolutionDecision: body.decision === 'approve' ? 'approved' : 'rejected',
            redeemableAsCredit: body.decision === 'approve',
          },
        }),
      ]);

      // Update reliability score based on decision
      const scoreChange = body.decision === 'approve' ? 1 : -1;
      await prisma.user.update({
        where: { id: userId },
        data: { reliabilityScore: { increment: scoreChange } },
      });

      res.json({ decision });
    } catch (error) {
      console.error('Resolution error:', error);
      res.status(400).json({ error: 'Failed to process resolution' });
    }
  });

  /**
   * POST /issues/:id/pullout-vote — Cast a collective pullout vote.
   * Triggers pullout when >50% users AND >50% USDC vote in favor.
   */
  router.post('/:id/pullout-vote', writeLimiter, requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = pulloutVoteSchema.parse(req.body);
      const issueId = getParam(req, 'id');
      const userId = req.user!.userId;

      const issue = await prisma.issue.findUnique({ where: { id: issueId } });
      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      if (issue.status !== 'open' && issue.status !== 'claimed') {
        res.status(400).json({ error: 'Pullout voting not available for this issue status' });
        return;
      }

      // Check if user already voted
      const existingVote = await prisma.pulloutVote.findFirst({
        where: { issueId, userId },
      });

      if (existingVote) {
        res.status(400).json({ error: 'You have already cast a pullout vote for this issue' });
        return;
      }

      // Record the vote
      const vote = await prisma.pulloutVote.create({
        data: { issueId, userId, amountWeight: body.amountWeight },
      });

      // Check pullout threshold: >50% users AND >50% USDC
      const totalContributors = await prisma.contribution.groupBy({
        by: ['userId'],
        where: { issueId },
      });

      const pulloutVotes = await prisma.pulloutVote.findMany({ where: { issueId } });

      const totalUsers = totalContributors.length;
      const votingUsers = pulloutVotes.length;
      const totalUsdc = Number(issue.totalBountyUsdc);
      const votingUsdc = pulloutVotes.reduce((sum, v) => sum + Number(v.amountWeight), 0);

      const userThresholdMet = totalUsers > 0 && votingUsers / totalUsers > 0.5;
      const usdcThresholdMet = totalUsdc > 0 && votingUsdc / totalUsdc > 0.5;

      if (userThresholdMet && usdcThresholdMet) {
        await prisma.issue.update({
          where: { id: issueId },
          data: { status: 'pullout_triggered' },
        });
      }

      res.status(201).json({
        vote,
        pulloutTriggered: userThresholdMet && usdcThresholdMet,
        stats: {
          userVotePercent: totalUsers > 0 ? (votingUsers / totalUsers) * 100 : 0,
          usdcVotePercent: totalUsdc > 0 ? (votingUsdc / totalUsdc) * 100 : 0,
        },
      });
    } catch (error) {
      console.error('Pullout vote error:', error);
      res.status(400).json({ error: 'Failed to cast pullout vote' });
    }
  });

  return router;
}
