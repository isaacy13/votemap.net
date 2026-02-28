import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { getBountyDetail } from '@/lib/db';
import { ESCROW_MIN_SOL_LAMPORTS } from '@/lib/constants';
import { getServerRpc } from '@/lib/solana';
import { PublicKey } from '@solana/web3.js';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const bounty = await getBountyDetail(env.DB, id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }

    // Check if escrow needs SOL activation
    let needsActivation = false;
    if (bounty.status === 'open') {
      try {
        const rpc = getServerRpc();
        // @ts-expect-error – @solana/kit RPC typing
        const balance = await rpc.getBalance(bounty.escrow_pubkey as unknown as PublicKey).send();
        needsActivation = (balance?.value ?? 0) < ESCROW_MIN_SOL_LAMPORTS;
      } catch {
        // Non-fatal: skip activation check if RPC fails
      }
    }

    return NextResponse.json({ bounty: { ...bounty, needs_activation: needsActivation } });
  } catch (err) {
    console.error('GET /api/bounties/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
