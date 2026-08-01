import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { requireAuth } from '../middleware/auth';
import { authLimiter, readLimiter } from '../middleware/rateLimiter';
import {
  googleAuthSchema,
  appleAuthSchema,
  devLoginSchema,
  zkPassportVerifySchema,
} from '../utils/validation';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import type { JwtPayload } from '../middleware/auth';
import type { Env } from '../config/env';
import { verifyZkPassport } from '../services/zkpassport';

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function toAuthPayload(user: {
  id: string;
  provider: string;
  isIdentityVerified: boolean;
}): JwtPayload {
  return {
    userId: user.id,
    provider: user.provider,
    isIdentityVerified: user.isIdentityVerified,
    isWriteEnabled: user.isIdentityVerified,
  };
}

export function createAuthRouter(prisma: PrismaClient, env: Env) {
  const router = Router();
  const jwtSecret = env.JWT_SECRET;
  const jwtExpiresIn = env.JWT_EXPIRES_IN;

  router.post('/google', authLimiter, async (req: Request, res: Response) => {
    try {
      const body = googleAuthSchema.parse(req.body);
      const allowed = (env.GOOGLE_CLIENT_IDS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const { payload } = await jwtVerify(body.idToken, googleJwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: allowed.length > 0 ? allowed : undefined,
      });

      const providerId = String(payload.sub);
      const email = typeof payload.email === 'string' ? payload.email : undefined;

      const user = await prisma.user.upsert({
        where: { providerId },
        update: { email },
        create: { provider: 'google', providerId, email },
      });

      const accessToken = generateAccessToken(toAuthPayload(user), jwtSecret, jwtExpiresIn);
      const refreshToken = generateRefreshToken();
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          displayName: user.displayName,
          isIdentityVerified: user.isIdentityVerified,
        },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(400).json({ error: 'Invalid Google authentication' });
    }
  });

  router.post('/apple', authLimiter, async (req: Request, res: Response) => {
    try {
      const body = appleAuthSchema.parse(req.body);

      // Production: verify against Apple JWKS. Dev may decode when ALLOW_DEV_LOGIN.
      let providerId: string;
      let email: string | undefined;

      try {
        const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
        const { payload } = await jwtVerify(body.idToken, appleJwks, {
          issuer: 'https://appleid.apple.com',
        });
        providerId = String(payload.sub);
        email = typeof payload.email === 'string' ? payload.email : undefined;
      } catch (verifyError) {
        if (!(env.ALLOW_DEV_LOGIN || env.NODE_ENV === 'development')) {
          throw verifyError;
        }
        const decoded = JSON.parse(
          Buffer.from(body.idToken.split('.')[1] ?? '', 'base64url').toString()
        ) as { sub?: string; email?: string };
        if (!decoded.sub) throw verifyError;
        providerId = decoded.sub;
        email = decoded.email;
      }

      const user = await prisma.user.upsert({
        where: { providerId },
        update: { email },
        create: { provider: 'apple', providerId, email },
      });

      const accessToken = generateAccessToken(toAuthPayload(user), jwtSecret, jwtExpiresIn);
      const refreshToken = generateRefreshToken();
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          displayName: user.displayName,
          isIdentityVerified: user.isIdentityVerified,
        },
      });
    } catch (error) {
      console.error('Apple auth error:', error);
      res.status(400).json({ error: 'Invalid Apple authentication' });
    }
  });

  /** Local/CI login without OAuth — disabled in production unless ALLOW_DEV_LOGIN. */
  router.post('/dev-login', authLimiter, async (req: Request, res: Response) => {
    if (!(env.ALLOW_DEV_LOGIN || env.NODE_ENV !== 'production')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    try {
      const body = devLoginSchema.parse(req.body ?? {});
      const providerId = `dev:${body.email ?? 'demo@votemap.local'}`;
      const user = await prisma.user.upsert({
        where: { providerId },
        update: { displayName: body.displayName ?? 'Demo Voter' },
        create: {
          provider: 'dev',
          providerId,
          email: body.email ?? 'demo@votemap.local',
          displayName: body.displayName ?? 'Demo Voter',
        },
      });
      const accessToken = generateAccessToken(toAuthPayload(user), jwtSecret, jwtExpiresIn);
      const refreshToken = generateRefreshToken();
      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          displayName: user.displayName,
          isIdentityVerified: user.isIdentityVerified,
        },
      });
    } catch (error) {
      console.error('Dev login error:', error);
      res.status(400).json({ error: 'Dev login failed' });
    }
  });

  router.get('/me', readLimiter, requireAuth(jwtSecret), async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      isIdentityVerified: user.isIdentityVerified,
      ageBand: user.ageBand,
      region: user.region,
      tier: user.tier,
      reliabilityScore: user.reliabilityScore,
      lastVerifiedAt: user.lastVerifiedAt,
      verificationProvider: user.verificationProvider,
    });
  });

  /**
   * POST /auth/zkpassport/verify
   * Bind a ZKPassport uniqueIdentifier (or mock) to the current user.
   */
  router.post('/zkpassport/verify', authLimiter, requireAuth(jwtSecret), async (req, res) => {
    try {
      const body = zkPassportVerifySchema.parse(req.body);
      const userId = req.user!.userId;

      const result = await verifyZkPassport(env, {
        mode: body.mode,
        proofs: body.proofs,
        query: body.query,
        queryResult: body.queryResult,
        mockNullifier: body.mockNullifier,
        ageBand: body.ageBand,
        region: body.region,
        userId,
      });

      if (!result.verified) {
        res.status(400).json({ error: 'Verification failed' });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { zkPassportNullifier: result.uniqueIdentifier },
      });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: 'This passport identity is already linked to another account' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isIdentityVerified: true,
          zkPassportNullifier: result.uniqueIdentifier,
          verificationProvider: result.provider,
          lastVerifiedAt: new Date(),
          ageBand: result.ageBand ?? body.ageBand,
          region: result.region ?? body.region,
          tier: 'silver',
        },
      });

      const accessToken = generateAccessToken(toAuthPayload(user), jwtSecret, jwtExpiresIn);
      res.json({
        accessToken,
        isIdentityVerified: true,
        uniqueIdentifier: result.uniqueIdentifier,
        provider: result.provider,
      });
    } catch (error) {
      console.error('ZKPassport verify error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Verification failed',
      });
    }
  });

  return router;
}
