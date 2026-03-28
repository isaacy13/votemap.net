import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleAuthSchema, appleAuthSchema, linkXSchema } from '../utils/validation';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens';
import type { JwtPayload } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

export function createAuthRouter(prisma: PrismaClient, jwtSecret: string, jwtExpiresIn: string) {
  const router = Router();

  /**
   * POST /auth/google — Read-only login via Google ID token.
   */
  router.post('/google', authLimiter, async (req: Request, res: Response) => {
    try {
      const body = googleAuthSchema.parse(req.body);

      // In production, verify the idToken with Google's public keys.
      // For now, we decode and trust the payload (replace with real verification).
      const decoded = JSON.parse(
        Buffer.from(body.idToken.split('.')[1] ?? '', 'base64').toString()
      );
      const providerId = decoded.sub as string;
      const email = decoded.email as string | undefined;
      const displayName = decoded.name as string | undefined;

      const user = await prisma.user.upsert({
        where: { providerId },
        update: { email, displayName },
        create: {
          provider: 'google',
          providerId,
          email,
          displayName,
        },
      });

      const payload: JwtPayload = {
        userId: user.id,
        provider: 'google',
        xUserId: user.xUserId ?? undefined,
        isIdentityVerified: user.isIdentityVerified,
        isWriteEnabled: !!user.xUserId && user.isIdentityVerified,
      };

      const accessToken = generateAccessToken(payload, jwtSecret, jwtExpiresIn);
      const refreshToken = generateRefreshToken();

      res.json({ accessToken, refreshToken, user: { id: user.id, displayName: user.displayName } });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(400).json({ error: 'Invalid Google authentication' });
    }
  });

  /**
   * POST /auth/apple — Read-only login via Apple ID token.
   */
  router.post('/apple', authLimiter, async (req: Request, res: Response) => {
    try {
      const body = appleAuthSchema.parse(req.body);

      // In production, verify the idToken with Apple's public keys.
      const decoded = JSON.parse(
        Buffer.from(body.idToken.split('.')[1] ?? '', 'base64').toString()
      );
      const providerId = decoded.sub as string;
      const email = decoded.email as string | undefined;

      const user = await prisma.user.upsert({
        where: { providerId },
        update: { email },
        create: {
          provider: 'apple',
          providerId,
          email,
        },
      });

      const payload: JwtPayload = {
        userId: user.id,
        provider: 'apple',
        xUserId: user.xUserId ?? undefined,
        isIdentityVerified: user.isIdentityVerified,
        isWriteEnabled: !!user.xUserId && user.isIdentityVerified,
      };

      const accessToken = generateAccessToken(payload, jwtSecret, jwtExpiresIn);
      const refreshToken = generateRefreshToken();

      res.json({ accessToken, refreshToken, user: { id: user.id, displayName: user.displayName } });
    } catch (error) {
      console.error('Apple auth error:', error);
      res.status(400).json({ error: 'Invalid Apple authentication' });
    }
  });

  /**
   * POST /auth/link-x — Link X account and verify identity. Requires read-only auth.
   */
  router.post('/link-x', authLimiter, requireAuth(jwtSecret), async (req: Request, res: Response) => {
    try {
      const body = linkXSchema.parse(req.body);
      const userId = req.user!.userId;

      // Exchange authorization code for X access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: body.code,
          grant_type: 'authorization_code',
          redirect_uri: body.redirectUri,
          code_verifier: 'challenge', // In production, use real PKCE verifier
        }),
      });

      if (!tokenResponse.ok) {
        res.status(400).json({ error: 'Failed to exchange X authorization code' });
        return;
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string };

      // Get X user info
      const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=verified,verified_type,is_identity_verified', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
        res.status(400).json({ error: 'Failed to fetch X user info' });
        return;
      }

      const xData = (await userResponse.json()) as {
        data: {
          id: string;
          username: string;
          verified_type?: string;
          is_identity_verified?: boolean;
        };
      };

      const xUser = xData.data;

      // Update user record with X verification data
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xUserId: xUser.id,
          xHandle: xUser.username,
          xVerifiedType: xUser.verified_type ?? null,
          isIdentityVerified: xUser.is_identity_verified ?? false,
        },
      });

      // Issue new JWT with write access if verified
      const payload: JwtPayload = {
        userId: updatedUser.id,
        provider: updatedUser.provider,
        xUserId: updatedUser.xUserId ?? undefined,
        isIdentityVerified: updatedUser.isIdentityVerified,
        isWriteEnabled: !!updatedUser.xUserId && updatedUser.isIdentityVerified,
      };

      const accessToken = generateAccessToken(payload, jwtSecret, jwtExpiresIn);

      res.json({
        accessToken,
        xLinked: true,
        isIdentityVerified: updatedUser.isIdentityVerified,
      });
    } catch (error) {
      console.error('X linking error:', error);
      res.status(400).json({ error: 'Failed to link X account' });
    }
  });

  return router;
}
