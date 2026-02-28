import type { D1Database } from '@cloudflare/workers-types';
import type { Bounty, BountyDetail, Contribution, PassportVerification, Solution, User, UserProfile } from './types';

export async function upsertUser(db: D1Database, walletAddress: string): Promise<void> {
  await db.prepare(
    `INSERT INTO users (wallet_address) VALUES (?) ON CONFLICT(wallet_address) DO NOTHING`
  ).bind(walletAddress).run();
}

export async function getBounty(db: D1Database, id: string): Promise<Bounty | null> {
  const row = await db.prepare(
    `SELECT b.*, p.nationality AS creator_nationality
     FROM bounties b
     LEFT JOIN passport_verifications p ON b.creator_wallet = p.wallet_address
     WHERE b.id = ?`
  ).bind(id).first<Bounty>();
  return row ?? null;
}

export async function listBounties(
  db: D1Database,
  { status, category, cursor, limit = 24 }: {
    status?: string;
    category?: string;
    cursor?: number;
    limit?: number;
  }
): Promise<Bounty[]> {
  const conditions: string[] = [];
  const bindings: (string | number)[] = [];

  if (status) {
    conditions.push('b.status = ?');
    bindings.push(status);
  }
  if (category) {
    conditions.push('b.category = ?');
    bindings.push(category);
  }
  if (cursor) {
    conditions.push('b.created_at < ?');
    bindings.push(cursor);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  bindings.push(limit + 1);

  const { results } = await db.prepare(
    `SELECT b.*, p.nationality AS creator_nationality
     FROM bounties b
     LEFT JOIN passport_verifications p ON b.creator_wallet = p.wallet_address
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ?`
  ).bind(...bindings).all<Bounty>();

  return results;
}

export async function getBountyDetail(db: D1Database, id: string): Promise<BountyDetail | null> {
  const bounty = await getBounty(db, id);
  if (!bounty) return null;

  const [{ results: contributions }, { results: solutions }] = await Promise.all([
    db.prepare(
      `SELECT c.*, p.nationality AS funder_nationality
       FROM contributions c
       LEFT JOIN passport_verifications p ON c.funder_wallet = p.wallet_address
       WHERE c.bounty_id = ?
       ORDER BY c.funded_at DESC`
    ).bind(id).all<Contribution>(),

    db.prepare(
      `SELECT s.*, p.nationality AS submitter_nationality
       FROM solutions s
       LEFT JOIN passport_verifications p ON s.submitter_wallet = p.wallet_address
       WHERE s.bounty_id = ?
       ORDER BY s.submitted_at DESC`
    ).bind(id).all<Solution>(),
  ]);

  return { ...bounty, contributions, solutions };
}

export async function createBounty(
  db: D1Database,
  bounty: Omit<Bounty, 'usdc_funded' | 'winner_wallet' | 'resolved_at' | 'updated_at' | 'creator_nationality' | 'needs_activation'>
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO bounties (id, creator_wallet, title, description, category, escrow_pubkey, usdc_target, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    bounty.id, bounty.creator_wallet, bounty.title, bounty.description,
    bounty.category, bounty.escrow_pubkey, bounty.usdc_target, now, now
  ).run();
}

export async function storeEscrowKeypair(db: D1Database, bountyId: string, encryptedPrivateKey: string): Promise<void> {
  await db.prepare(
    `INSERT INTO escrow_keypairs (bounty_id, encrypted_private_key) VALUES (?, ?)`
  ).bind(bountyId, encryptedPrivateKey).run();
}

export async function getEscrowKeypair(db: D1Database, bountyId: string): Promise<string | null> {
  const row = await db.prepare(
    `SELECT encrypted_private_key FROM escrow_keypairs WHERE bounty_id = ?`
  ).bind(bountyId).first<{ encrypted_private_key: string }>();
  return row?.encrypted_private_key ?? null;
}

export async function recordContribution(
  db: D1Database,
  { bountyId, funderWallet, usdcAmount, txSignature }: {
    bountyId: string;
    funderWallet: string;
    usdcAmount: number;
    txSignature: string;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare(
      `INSERT INTO contributions (bounty_id, funder_wallet, usdc_amount, tx_signature, funded_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(bountyId, funderWallet, usdcAmount, txSignature, now),
    db.prepare(
      `UPDATE bounties SET usdc_funded = usdc_funded + ?, updated_at = ? WHERE id = ?`
    ).bind(usdcAmount, now, bountyId),
  ]);
}

export async function createSolution(
  db: D1Database,
  { bountyId, submitterWallet, title, description, url }: {
    bountyId: string;
    submitterWallet: string;
    title: string;
    description: string;
    url?: string;
  }
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = await db.prepare(
    `INSERT INTO solutions (bounty_id, submitter_wallet, title, description, url, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(bountyId, submitterWallet, title, description, url ?? null, now).first<{ id: number }>();
  return result!.id;
}

export async function resolveBounty(
  db: D1Database,
  { bountyId, solutionId, winnerWallet, payoutTxSig }: {
    bountyId: string;
    solutionId: number;
    winnerWallet: string;
    payoutTxSig: string;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare(
      `UPDATE solutions SET status = 'approved', reviewed_at = ? WHERE id = ? AND bounty_id = ?`
    ).bind(now, solutionId, bountyId),
    db.prepare(
      `UPDATE bounties SET status = 'resolved', winner_wallet = ?, resolved_at = ?, updated_at = ? WHERE id = ?`
    ).bind(winnerWallet, now, now, bountyId),
  ]);
  void payoutTxSig; // stored on-chain, not in DB for now
}

export async function upsertPassportVerification(
  db: D1Database,
  { walletAddress, nationality, userIdentifier }: {
    walletAddress: string;
    nationality: string;
    userIdentifier: string;
  }
): Promise<void> {
  await upsertUser(db, walletAddress);
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `INSERT INTO passport_verifications (wallet_address, nationality, user_identifier, verified_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(wallet_address) DO UPDATE SET
       nationality = excluded.nationality,
       user_identifier = excluded.user_identifier,
       verified_at = excluded.verified_at`
  ).bind(walletAddress, nationality, userIdentifier, now).run();
}

export async function getPassportVerification(db: D1Database, walletAddress: string): Promise<PassportVerification | null> {
  const row = await db.prepare(
    `SELECT * FROM passport_verifications WHERE wallet_address = ?`
  ).bind(walletAddress).first<PassportVerification>();
  return row ?? null;
}

export async function getUserProfile(db: D1Database, walletAddress: string): Promise<UserProfile | null> {
  const user = await db.prepare(
    `SELECT * FROM users WHERE wallet_address = ?`
  ).bind(walletAddress).first<User>();

  if (!user) return null;

  const [passport, { results: createdBounties }, { results: contributions }, { results: solutions }] = await Promise.all([
    getPassportVerification(db, walletAddress),
    db.prepare(
      `SELECT b.*, p.nationality AS creator_nationality FROM bounties b
       LEFT JOIN passport_verifications p ON b.creator_wallet = p.wallet_address
       WHERE b.creator_wallet = ? ORDER BY b.created_at DESC LIMIT 20`
    ).bind(walletAddress).all<Bounty>(),
    db.prepare(
      `SELECT c.*, b.title AS bounty_title FROM contributions c
       JOIN bounties b ON c.bounty_id = b.id
       WHERE c.funder_wallet = ? ORDER BY c.funded_at DESC LIMIT 20`
    ).bind(walletAddress).all<Contribution & { bounty_title: string }>(),
    db.prepare(
      `SELECT s.*, b.title AS bounty_title FROM solutions s
       JOIN bounties b ON s.bounty_id = b.id
       WHERE s.submitter_wallet = ? ORDER BY s.submitted_at DESC LIMIT 20`
    ).bind(walletAddress).all<Solution & { bounty_title: string }>(),
  ]);

  return {
    wallet_address: user.wallet_address,
    created_at: user.created_at,
    passport,
    created_bounties: createdBounties,
    contributions,
    solutions,
  };
}
