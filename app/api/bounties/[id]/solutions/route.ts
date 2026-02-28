import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { getBounty, createSolution, upsertUser } from '@/lib/db';
import { verifyWalletSignature } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { env } = await getCloudflareContext({ async: true });
    const body = await request.json();
    const { wallet, action, timestamp, signature, title, description, url } = body;

    if (!wallet || !signature || !timestamp || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const valid = await verifyWalletSignature({ wallet, action: action ?? 'submit-solution', timestamp, signature });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const bounty = await getBounty(env.DB, id);
    if (!bounty) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    if (bounty.status === 'resolved' || bounty.status === 'cancelled') {
      return NextResponse.json({ error: 'Bounty is no longer accepting solutions' }, { status: 400 });
    }

    await upsertUser(env.DB, wallet);
    const solutionId = await createSolution(env.DB, {
      bountyId: id,
      submitterWallet: wallet,
      title: title.trim(),
      description: description.trim(),
      url: url?.trim() || undefined,
    });

    return NextResponse.json({ solution: { id: solutionId } }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bounties/[id]/solutions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
