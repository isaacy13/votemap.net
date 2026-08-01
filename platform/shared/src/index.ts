// Shared types between frontend and backend

export type Provider = 'google' | 'apple' | 'dev';
export type EntityType =
  | 'politician'
  | 'government'
  | 'company'
  | 'nonprofit'
  | 'creator'
  | 'sports_team'
  | 'small_business'
  | 'church';
export type OutcomeStatus =
  | 'open'
  | 'delivery_submitted'
  | 'partially_resolved'
  | 'resolved'
  | 'expired';
export type StakeStatus = 'active' | 'released' | 'refunded';
export type ResolutionDecisionType = 'approve' | 'reject';
export type LedgerEntryType =
  | 'stake_lock'
  | 'release'
  | 'refund'
  | 'deadline_refund'
  | 'donation'
  | 'adjust';
export type VoteSessionAction = 'stake' | 'donate' | 'resolve' | 'deliverable';
export type VoteSessionStatus = 'pending' | 'confirmed' | 'consumed' | 'expired';

export interface UserPublic {
  id: string;
  displayName: string | null;
  showName: boolean;
  reliabilityScore: number;
  tier: string;
  isIdentityVerified: boolean;
  ageBand: string | null;
  region: string | null;
  lastVerifiedAt: string | null;
}

export interface EntityLink {
  id: string;
  entityId: string;
  label: string;
  url: string;
  sortOrder: number;
}

export interface Entity {
  id: string;
  name: string;
  slug: string | null;
  type: EntityType;
  verified: boolean;
  walletAddress: string;
  bio: string | null;
  avatarUrl: string | null;
  ownerUserId: string | null;
  lastMonthlyUpdate: string | null;
  links?: EntityLink[];
  outcomes?: Array<{
    id: string;
    title: string;
    status: OutcomeStatus;
    totalBountyUsdc: string;
    createdAt: string;
  }>;
  donationTotalUsdc?: string;
}

export interface Outcome {
  id: string;
  entityId: string | null;
  entity?: Entity | null;
  title: string;
  description: string;
  successCriteria: string;
  status: OutcomeStatus;
  totalBountyUsdc: string;
  defaultSplitJson: string | null;
  createdAt: string;
  stakes?: Stake[];
  deliverables?: Deliverable[];
}

export interface Stake {
  id: string;
  outcomeId: string;
  userId: string;
  user?: UserPublic;
  amountUsdc: string;
  deadlineAt: string;
  status: StakeStatus;
  txHash: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export interface Donation {
  id: string;
  entityId: string;
  userId: string;
  user?: UserPublic;
  amountUsdc: string;
  memo: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  outcomeId: string;
  proofText: string;
  proofFiles: string[];
  proofTxHashes: string[];
  submittedAt: string;
  submittedById: string | null;
}

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amountUsdc: string;
  memo: string | null;
  txHash: string | null;
  userId: string | null;
  entityId: string | null;
  outcomeId: string | null;
  stakeId: string | null;
  donationId: string | null;
  createdAt: string;
}

export interface VoteSession {
  id: string;
  userId: string;
  action: VoteSessionAction;
  payloadHash: string;
  status: VoteSessionStatus;
  expiresAt: string;
  confirmedAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    displayName: string | null;
    isIdentityVerified: boolean;
  };
}

export interface CreateOutcomeRequest {
  entityId?: string;
  title: string;
  description: string;
  successCriteria: string;
  defaultSplitJson?: string;
}

export interface CreateStakeRequest {
  amountUsdc: number;
  deadlineAt: string;
  txHash?: string;
  voteSessionId: string;
}

export interface CreateDonationRequest {
  amountUsdc: number;
  memo?: string;
  txHash?: string;
  voteSessionId: string;
}

export interface ResolveStakeRequest {
  stakeId: string;
  decision: ResolutionDecisionType;
  voteSessionId: string;
}

export interface DeliverableRequest {
  proofText: string;
  proofFiles?: string[];
  proofTxHashes?: string[];
  voteSessionId: string;
}

export interface CreateEntityRequest {
  name: string;
  type: EntityType;
  walletAddress: string;
  slug?: string;
  bio?: string;
  links?: Array<{ label: string; url: string }>;
}

export interface UpdateEntityRequest {
  bio?: string;
  avatarUrl?: string;
  links?: Array<{ label: string; url: string }>;
}

export interface CreateVoteSessionRequest {
  action: VoteSessionAction;
  payloadHash: string;
}

export interface ZkPassportVerifyRequest {
  /** Real ZKPassport proof bundle, or mock payload when ZKPASSPORT_DEV_MODE=true */
  mode?: 'live' | 'mock';
  proofs?: unknown;
  query?: unknown;
  queryResult?: unknown;
  mockNullifier?: string;
  ageBand?: string;
  region?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  zkPassportDevMode?: boolean;
}
