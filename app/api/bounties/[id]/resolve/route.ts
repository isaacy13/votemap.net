import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { getBounty, getEscrowKeypair, resolveBounty } from '@/lib/db';
import { verifyWalletSignature } from '@/lib/auth';
import { decryptEscrowKeypair } from '@/lib/escrow';
import { payoutFromEscrow } from '@/lib/usdc';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });
    const body = await request.json();
    const { wallet, action, timestamp, signature, solutionId, winnerWallet } = body;

    if (!wallet || !signature || !timestamp || !solutionId || !winnerWallet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const valid = await verifyWalletSignature({ wallet, action: action ?? 'resolve-bounty', timestamp, signature });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const bounty = await getBounty(env.DB, id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    if (bounty.creator_wallet !== wallet) {
      return NextResponse.json({ error: 'Only the bounty creator can resolve' }, { status: 403 });
    }
    if (bounty.status !== 'open' && bounty.status !== 'in_review') {
      return NextResponse.json({ error: 'Bounty cannot be resolved in its current state' }, { status: 400 });
    }
    if (bounty.usdc_funded === 0) {
      return NextResponse.json({ error: 'No funds to pay out' }, { status: 400 });
    }

    const encryptionKey = env.ENCRYPTION_KEY;
    if (!encryptionKey) return NextResponse.json({ error: 'Server not configured (ENCRYPTION_KEY missing)' }, { status: 500 });

    const encryptedPrivkey = await getEscrowKeypair(env.DB, id);
    if (!encryptedPrivkey) {
      return NextResponse.json({ error: 'Escrow keypair not found' }, { status: 500 });
    }

    const escrowKeypair = await decryptEscrowKeypair(encryptedPrivkey, encryptionKey);
    const txSignature = await payoutFromEscrow(escrowKeypair, winnerWallet, bounty.usdc_funded);

    await resolveBounty(env.DB, {
      bountyId: id,
      solutionId: Number(solutionId),
      winnerWallet,
      payoutTxSig: txSignature,
    });

    return NextResponse.json({ success: true, txSignature });
  } catch (err) {
    console.error('POST /api/bounties/[id]/resolve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
