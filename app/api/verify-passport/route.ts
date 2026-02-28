import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { upsertPassportVerification } from '@/lib/db';
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const body = await request.json();
    const { attestationId, proof, publicSignals, userContextData } = body;

    if (!attestationId || !proof || !publicSignals || !userContextData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // userContextData contains the wallet address (set by the frontend QR code builder)
    const walletAddress = userContextData;

    const scope = process.env.SELF_SCOPE;
    const endpoint = process.env.SELF_ENDPOINT ?? 'https://forno.celo.org';

    if (!scope) {
      return NextResponse.json({ error: 'Self.xyz not configured' }, { status: 500 });
    }

    const verifier = new SelfBackendVerifier(
      scope,
      endpoint,
      false, // mockPassport (set true for testing with fake passports)
      AllIds,
      new DefaultConfigStore({ minimumAge: 18 }),
      'hex'
    );

    const result = await verifier.verify(attestationId, proof, publicSignals, userContextData);

    if (!result.isValidDetails.isValid) {
      return NextResponse.json({ error: 'Passport verification failed', details: result.isValidDetails }, { status: 400 });
    }

    const nationality = result.discloseOutput.nationality;
    const userIdentifier = result.userData.userIdentifier;

    if (!nationality) {
      return NextResponse.json({ error: 'Nationality not found in proof' }, { status: 400 });
    }

    await upsertPassportVerification(env.DB, {
      walletAddress,
      nationality,
      userIdentifier,
    });

    return NextResponse.json({ success: true, nationality });
  } catch (err) {
    console.error('POST /api/verify-passport error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
