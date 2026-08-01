import type {
  Outcome,
  Entity,
  AuthResponse,
  CreateOutcomeRequest,
  CreateEntityRequest,
  UpdateEntityRequest,
  CreateStakeRequest,
  CreateDonationRequest,
  ResolveStakeRequest,
  DeliverableRequest,
  CreateVoteSessionRequest,
  VoteSession,
  LedgerEntry,
  ZkPassportVerifyRequest,
  HealthResponse,
  UserPublic,
} from '@votemap/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error: string }).error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  health: () => request<HealthResponse>('/health'),

  loginGoogle: (idToken: string) =>
    request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  loginApple: (idToken: string, nonce?: string) =>
    request<AuthResponse>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ idToken, nonce }),
    }),

  devLogin: (displayName?: string) =>
    request<AuthResponse>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),

  me: (token: string) =>
    request<UserPublic & { email?: string; verificationProvider?: string }>('/auth/me', {
      headers: authHeaders(token),
    }),

  verifyZkPassport: (data: ZkPassportVerifyRequest, token: string) =>
    request<{ accessToken: string; isIdentityVerified: boolean; provider: string }>(
      '/auth/zkpassport/verify',
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: authHeaders(token),
      }
    ),

  createVoteSession: (data: CreateVoteSessionRequest, token: string) =>
    request<{ session: VoteSession; deepLink: string; expiresInSec: number }>('/vote-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  getVoteSession: (id: string, token: string) =>
    request<{ session: VoteSession }>(`/vote-sessions/${id}`, {
      headers: authHeaders(token),
    }),

  confirmVoteSession: (id: string, token: string) =>
    request<{ session: VoteSession }>(`/vote-sessions/${id}/confirm`, {
      method: 'POST',
      headers: authHeaders(token),
    }),

  getOutcomes: () => request<{ outcomes: Outcome[] }>('/outcomes'),

  getOutcome: (id: string) => request<Outcome>(`/outcomes/${id}`),

  createOutcome: (data: CreateOutcomeRequest, token: string) =>
    request<{ outcome: Outcome }>('/outcomes', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  createStake: (outcomeId: string, data: CreateStakeRequest, token: string) =>
    request<{ stake: unknown }>(`/outcomes/${outcomeId}/stakes`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  submitDeliverable: (outcomeId: string, data: DeliverableRequest, token: string) =>
    request<{ deliverable: unknown }>(`/outcomes/${outcomeId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  resolveStake: (outcomeId: string, data: ResolveStakeRequest, token: string) =>
    request<{ decision: unknown }>(`/outcomes/${outcomeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  getEntities: () => request<{ entities: Entity[] }>('/entities'),

  getEntity: (idOrSlug: string) => request<{ entity: Entity & { donationTotalUsdc?: string } }>(`/entities/${idOrSlug}`),

  createEntity: (data: CreateEntityRequest, token: string) =>
    request<{ entity: Entity }>('/entities', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  updateEntity: (id: string, data: UpdateEntityRequest, token: string) =>
    request<{ entity: Entity }>(`/entities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  donate: (entityId: string, data: CreateDonationRequest, token: string) =>
    request<{ donation: unknown }>(`/entities/${entityId}/donations`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  getLedger: (limit = 50) =>
    request<{ entries: LedgerEntry[]; nextCursor: string | null }>(`/ledger?limit=${limit}`),
};
