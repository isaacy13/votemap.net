export type BountyStatus = 'open' | 'in_review' | 'resolved' | 'cancelled';
export type SolutionStatus = 'pending' | 'approved' | 'rejected';
export type BountyCategory = 'politics' | 'local' | 'business' | 'nonprofit' | 'tech' | 'general';

export interface User {
  wallet_address: string;
  created_at: number;
}

export interface PassportVerification {
  wallet_address: string;
  nationality: string;
  user_identifier: string;
  verified_at: number;
}

export interface Bounty {
  id: string;
  creator_wallet: string;
  title: string;
  description: string;
  category: BountyCategory;
  status: BountyStatus;
  escrow_pubkey: string;
  usdc_target: number;
  usdc_funded: number;
  winner_wallet: string | null;
  created_at: number;
  updated_at: number;
  resolved_at: number | null;
  // Joined fields
  creator_nationality?: string;
  needs_activation?: boolean;
}

export interface Contribution {
  id: number;
  bounty_id: string;
  funder_wallet: string;
  usdc_amount: number;
  tx_signature: string;
  funded_at: number;
  // Joined fields
  funder_nationality?: string;
}

export interface Solution {
  id: number;
  bounty_id: string;
  submitter_wallet: string;
  title: string;
  description: string;
  url: string | null;
  status: SolutionStatus;
  submitted_at: number;
  reviewed_at: number | null;
  // Joined fields
  submitter_nationality?: string;
}

export interface BountyDetail extends Bounty {
  contributions: Contribution[];
  solutions: Solution[];
}

export interface UserProfile {
  wallet_address: string;
  created_at: number;
  passport: PassportVerification | null;
  created_bounties: Bounty[];
  contributions: (Contribution & { bounty_title: string })[];
  solutions: (Solution & { bounty_title: string })[];
}
