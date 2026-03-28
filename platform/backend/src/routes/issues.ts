import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWriteAccess } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { createIssueSchema } from '../utils/validation';

export function createIssuesRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router();

  /**
   * GET /issues — Public listing of all issues (read-only, no auth required for browsing).
   */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const issues = await prisma.issue.findMany({
        include: {
          entity: { select: { id: true, name: true, type: true, verified: true } },
          _count: { select: { contributions: true, deliverables: true, pulloutVotes: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ issues });
    } catch (error) {
      console.error('List issues error:', error);
      res.status(500).json({ error: 'Failed to list issues' });
    }
  });

  /**
   * GET /issues/:id — Public detail of a single issue with contributions, deliverables, etc.
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const issue = await prisma.issue.findUnique({
        where: { id: req.params.id },
        include: {
          entity: true,
          contributions: {
            include: {
              user: { select: { id: true, displayName: true, showName: true, reliabilityScore: true } },
            },
          },
          deliverables: true,
          pulloutVotes: true,
          escrows: true,
        },
      });

      if (!issue) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      // Anonymize user names when showName is false
      const sanitizedContributions = issue.contributions.map((c) => ({
        ...c,
        user: c.user.showName
          ? c.user
          : { ...c.user, displayName: 'Anonymous' },
      }));

      res.json({ ...issue, contributions: sanitizedContributions });
    } catch (error) {
      console.error('Get issue error:', error);
      res.status(500).json({ error: 'Failed to get issue' });
    }
  });

  /**
   * POST /issues — Create a new issue (write access required).
   */
  router.post('/', requireWriteAccess(jwtSecret), idempotency, async (req: Request, res: Response) => {
    try {
      const body = createIssueSchema.parse(req.body);

      // Verify entity exists
      const entity = await prisma.entity.findUnique({ where: { id: body.entityId } });
      if (!entity) {
        res.status(404).json({ error: 'Entity not found' });
        return;
      }

      const issue = await prisma.issue.create({
        data: {
          entityId: body.entityId,
          title: body.title,
          description: body.description,
          successCriteria: body.successCriteria,
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
        },
      });

      res.status(201).json({ issue });
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(400).json({ error: 'Failed to create issue' });
    }
  });

  return router;
}
