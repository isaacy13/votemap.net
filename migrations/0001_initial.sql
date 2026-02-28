CREATE TABLE IF NOT EXISTS users (
  wallet_address TEXT PRIMARY KEY,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS passport_verifications (
  wallet_address  TEXT PRIMARY KEY REFERENCES users(wallet_address),
  nationality     TEXT NOT NULL,        -- ISO 3-letter e.g. "AUS"
  user_identifier TEXT NOT NULL UNIQUE, -- Self.xyz identifier
  verified_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS bounties (
  id             TEXT PRIMARY KEY,      -- nanoid: "bnt_abc123"
  creator_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'general',
  status         TEXT NOT NULL DEFAULT 'open'
                 CHECK(status IN ('open','in_review','resolved','cancelled')),
  escrow_pubkey  TEXT NOT NULL UNIQUE,
  usdc_target    INTEGER NOT NULL,      -- 6-decimal micro-units (1 USDC = 1_000_000)
  usdc_funded    INTEGER NOT NULL DEFAULT 0,
  winner_wallet  TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_bounties_status  ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON bounties(creator_wallet);

-- Escrow private keys stored separately, encrypted at rest with ENCRYPTION_KEY
CREATE TABLE IF NOT EXISTS escrow_keypairs (
  bounty_id             TEXT PRIMARY KEY REFERENCES bounties(id),
  encrypted_private_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contributions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  bounty_id     TEXT NOT NULL REFERENCES bounties(id),
  funder_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  usdc_amount   INTEGER NOT NULL,
  tx_signature  TEXT NOT NULL UNIQUE,   -- prevents double-recording
  funded_at     INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_contributions_bounty ON contributions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_contributions_funder ON contributions(funder_wallet);

CREATE TABLE IF NOT EXISTS solutions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  bounty_id        TEXT NOT NULL REFERENCES bounties(id),
  submitter_wallet TEXT NOT NULL REFERENCES users(wallet_address),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  url              TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK(status IN ('pending','approved','rejected')),
  submitted_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  reviewed_at      INTEGER
);
CREATE INDEX IF NOT EXISTS idx_solutions_bounty ON solutions(bounty_id);
