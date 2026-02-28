import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { listBounties, createBounty, storeEscrowKeypair, upsertUser } from '@/lib/db';
import { generateEscrowKeypair } from '@/lib/escrow';
import { verifyWalletSignature } from '@/lib/auth';
import { newBountyId } from '@/lib/nanoid';
import type { BountyCategory } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);

    const bounties = await listBounties(env.DB, {
      status:   searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      cursor:   searchParams.get('cursor') ? Number(searchParams.get('cursor')) : undefined,
    });

    const hasMore = bounties.length > 24;
    const items = hasMore ? bounties.slice(0, 24) : bounties;
    const nextCursor = hasMore ? items[items.length - 1]?.created_at : undefined;

    return NextResponse.json({ bounties: items, nextCursor });
  } catch (err) {
    console.error('GET /api/bounties error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const body = await request.json();
    const { wallet, action, timestamp, signature, title, description, category, usdcTarget } = body;

    if (!wallet || !signature || !timestamp || !title || !description || !category || !usdcTarget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const valid = await verifyWalletSignature({ wallet, action: action ?? 'create-bounty', timestamp, signature });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (usdcTarget < 1_000_000) { // minimum 1 USDC
      return NextResponse.json({ error: 'Minimum bounty is 1 USDC' }, { status: 400 });
    }

    const encryptionKey = env.ENCRYPTION_KEY;
    if (!encryptionKey) return NextResponse.json({ error: 'Server not configured (ENCRYPTION_KEY missing)' }, { status: 500 });

    await upsertUser(env.DB, wallet);

    const { pubkey: escrowPubkey, encryptedPrivkey } = await generateEscrowKeypair(encryptionKey);
    const id = newBountyId();

    await createBounty(env.DB, {
      id,
      creator_wallet: wallet,
      title: title.trim(),
      description: description.trim(),
      category: category as BountyCategory,
      status: 'open',
      escrow_pubkey: escrowPubkey,
      usdc_target: usdcTarget,
      created_at: Math.floor(Date.now() / 1000),
    });

    await storeEscrowKeypair(env.DB, id, encryptedPrivkey);

    return NextResponse.json({ bounty: { id, escrow_pubkey: escrowPubkey } }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bounties error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
