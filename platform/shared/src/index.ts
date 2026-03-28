// Shared types between frontend and backend
// These mirror the Prisma models for type-safe client-server communication

export type Provider = 'google' | 'apple';
export type XVerifiedType = 'blue' | 'business' | 'government';
export type EntityType = 'politician' | 'government' | 'company' | 'nonprofit' | 'creator' | 'sports_team' | 'small_business';
export type IssueStatus = 'open' | 'claimed' | 'resolved' | 'cancelled' | 'pullout_triggered';
export type ResolutionDecisionType = 'approve' | 'reject';
export type ContributionResolution = 'pending' | 'approved' | 'rejected';
export type EscrowStatus = 'active' | 'released' | 'refunded';

export interface UserPublic {
  id: string;
  displayName: string | null;
  showName: boolean;
  reliabilityScore: number;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  verified: boolean;
  walletAddress: string;
  lastMonthlyUpdate: string | null;
}

export interface Issue {
  id: string;
  entityId: string;
  entity?: Entity;
  title: string;
  description: string;
  successCriteria: string;
  targetDate: string | null;
  status: IssueStatus;
  totalBountyUsdc: string;
  createdAt: string;
  contributions?: Contribution[];
  deliverables?: Deliverable[];
  pulloutVotes?: PulloutVote[];
}

export interface Contribution {
  id: string;
  issueId: string;
  userId: string;
  user?: UserPublic;
  amountUsdc: string;
  txHash: string;
  redeemableAsCredit: boolean;
  resolutionDecision: ContributionResolution | null;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  issueId: string;
  proofText: string;
  proofFiles: string[];
  proofTxHashes: string[];
  submittedAt: string;
}

export interface PulloutVote {
  id: string;
  issueId: string;
  userId: string;
  amountWeight: string;
  createdAt: string;
}

export interface Escrow {
  id: string;
  issueId: string;
  totalUsdc: string;
  yieldEarnedUsdc: string;
  status: EscrowStatus;
}

// API Request/Response types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; displayName: string | null };
}

export interface LinkXResponse {
  accessToken: string;
  xLinked: boolean;
  isIdentityVerified: boolean;
}

export interface CreateIssueRequest {
  entityId: string;
  title: string;
  description: string;
  successCriteria: string;
  targetDate?: string;
}

export interface ContributeRequest {
  amountUsdc: number;
  txHash: string;
}

export interface ResolveRequest {
  contributionId: string;
  decision: ResolutionDecisionType;
}

export interface PulloutVoteRequest {
  amountWeight: number;
}

export interface DeliverableRequest {
  proofText: string;
  proofFiles?: string[];
  proofTxHashes?: string[];
}

export interface PulloutStats {
  userVotePercent: number;
  usdcVotePercent: number;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
}
