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

/** Canonical MVP disclosures — keep in sync with frontend verify screen. */
export const ZKPASSPORT_SCOPE = 'votemap-personhood';

type OfflineDone = { query: unknown };
type QueryBuilderOffline = {
  gte: (field: string, value: number) => QueryBuilderOffline;
  done: () => OfflineDone;
};
type ZkPassportSdk = {
  ZKPassport: new (
    domain?: string
  ) => {
    createQuery: () => QueryBuilderOffline;
    verify: (args: {
      proofs: unknown;
      originalQuery: unknown;
      queryResult: unknown;
      scope?: string;
      devMode?: boolean;
    }) => Promise<{
      verified: boolean;
      uniqueIdentifier?: string;
    }>;
  };
};

async function loadZkPassportSdk(): Promise<ZkPassportSdk | null> {
  try {
    return (await Function('return import("@zkpassport/sdk")')()) as ZkPassportSdk;
  } catch {
    return null;
  }
}

/**
 * Verify a ZKPassport proof server-side.
 * Mock mode for local/CI ($0). Live mode uses @zkpassport/sdk when installed.
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

  const mod = await loadZkPassportSdk();
  if (!mod) {
    throw new Error(
      'Live ZKPassport verification requires @zkpassport/sdk. Install it or use mode=mock in development.'
    );
  }

  const zkPassport = new mod.ZKPassport(env.ZKPASSPORT_DOMAIN);
  // Recreate the expected query server-side so clients cannot tamper with gates.
  const { query: expectedQuery } = zkPassport.createQuery().gte('age', 18).done();
  const originalQuery = input.query ?? expectedQuery;

  const result = await zkPassport.verify({
    proofs: input.proofs,
    originalQuery,
    queryResult: input.queryResult,
    scope: ZKPASSPORT_SCOPE,
    devMode: allowMock,
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
    ageBand: queryResult?.age?.gte?.result ? '18+' : input.ageBand ?? '18+',
    region: queryResult?.nationality?.disclose?.result ?? input.region,
    provider: 'zkpassport',
  };
}
