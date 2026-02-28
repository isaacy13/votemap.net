import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { getBounty, recordContribution, upsertUser } from '@/lib/db';
import { verifyWalletSignature } from '@/lib/auth';
import { verifyUsdcTransfer } from '@/lib/solana';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });
    const body = await request.json();
    const { wallet, action, timestamp, signature, txSignature, usdcAmount } = body;

    if (!wallet || !signature || !timestamp || !txSignature || !usdcAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const valid = await verifyWalletSignature({ wallet, action: action ?? 'fund-bounty', timestamp, signature });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const bounty = await getBounty(env.DB, id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    if (bounty.status !== 'open') {
      return NextResponse.json({ error: 'Bounty is not accepting contributions' }, { status: 400 });
    }

    // Verify the on-chain transaction
    const isValid = await verifyUsdcTransfer(txSignature, bounty.escrow_pubkey, usdcAmount);
    if (!isValid) {
      return NextResponse.json({ error: 'Transaction verification failed' }, { status: 400 });
    }

    await upsertUser(env.DB, wallet);
    await recordContribution(env.DB, {
      bountyId: id,
      funderWallet: wallet,
      usdcAmount,
      txSignature,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Handle duplicate tx signature (already recorded)
    if (err instanceof Error && err.message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Transaction already recorded' }, { status: 409 });
    }
    console.error('POST /api/bounties/[id]/fund error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
