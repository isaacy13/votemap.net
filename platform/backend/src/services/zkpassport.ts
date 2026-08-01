import type { Env } from '../config/env';

export interface ZkVerifyInput {
  mode: 'live' | 'mock';
  proofs?: unknown;
  query?: unknown;
  queryResult?: unknown;
  mockNullifier?: string;
  ageBand?: string;
  region?: string;
  userId: string;
}

export interface ZkVerifyResult {
  verified: boolean;
  uniqueIdentifier: string;
  ageBand?: string;
  region?: string;
  provider: 'zkpassport' | 'mock';
}

type ZkPassportSdk = {
  ZKPassport: new (domain: string) => {
    verify: (args: {
      proofs: unknown;
      originalQuery: unknown;
      queryResult: unknown;
    }) => Promise<{ verified: boolean; uniqueIdentifier?: string }>;
  };
};

/**
 * Verify a ZKPassport proof server-side.
 * In ZKPASSPORT_DEV_MODE (or mode=mock), accepts a deterministic mock nullifier
 * so local/CI can run without the ZKPassport mobile app ($0, no vendor).
 */
export async function verifyZkPassport(
  env: Env,
  input: ZkVerifyInput
): Promise<ZkVerifyResult> {
  const allowMock = env.ZKPASSPORT_DEV_MODE || env.NODE_ENV !== 'production';

  if (input.mode === 'mock') {
    if (!allowMock) {
      throw new Error('Mock ZKPassport verification is disabled in production');
    }
    const uniqueIdentifier =
      input.mockNullifier ?? `mock:${input.userId}:${Date.now().toString(36)}`;
    return {
      verified: true,
      uniqueIdentifier,
      ageBand: input.ageBand ?? '18+',
      region: input.region,
      provider: 'mock',
    };
  }

  try {
    // Optional peer dependency — installed when going live with ZKPassport.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = (await Function('return import("@zkpassport/sdk")')()) as ZkPassportSdk;
    const zkPassport = new mod.ZKPassport(env.ZKPASSPORT_DOMAIN);
    const result = await zkPassport.verify({
      proofs: input.proofs,
      originalQuery: input.query,
      queryResult: input.queryResult,
    });

    if (!result.verified || !result.uniqueIdentifier) {
      throw new Error('ZKPassport proof verification failed');
    }

    const queryResult = input.queryResult as
      | {
          age?: { gte?: { result?: boolean } };
          nationality?: { disclose?: { result?: string } };
        }
      | undefined;

    return {
      verified: true,
      uniqueIdentifier: result.uniqueIdentifier,
      ageBand: queryResult?.age?.gte?.result ? '18+' : input.ageBand,
      region: queryResult?.nationality?.disclose?.result ?? input.region,
      provider: 'zkpassport',
    };
  } catch (error) {
    throw new Error(
      `ZKPassport live verification unavailable: ${error instanceof Error ? error.message : String(error)}. Use mode=mock in development.`
    );
  }
}
