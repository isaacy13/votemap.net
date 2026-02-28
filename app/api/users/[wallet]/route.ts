import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const { env } = await getCloudflareContext({ async: true });

    const profile = await getUserProfile(env.DB, wallet);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('GET /api/users/[wallet] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
