import type {
  Issue,
  AuthResponse,
  LinkXResponse,
  CreateIssueRequest,
  ContributeRequest,
  ResolveRequest,
  PulloutVoteRequest,
  DeliverableRequest,
  HealthResponse,
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
  // Auth
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

  linkX: (code: string, redirectUri: string, token: string) =>
    request<LinkXResponse>('/auth/link-x', {
      method: 'POST',
      body: JSON.stringify({ code, redirectUri }),
      headers: authHeaders(token),
    }),

  // Issues
  getIssues: () =>
    request<{ issues: Issue[] }>('/issues'),

  getIssue: (id: string) =>
    request<Issue>(`/issues/${id}`),

  createIssue: (data: CreateIssueRequest, token: string) =>
    request<{ issue: Issue }>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  // Contributions
  contribute: (issueId: string, data: ContributeRequest, token: string) =>
    request<{ contribution: unknown }>(`/issues/${issueId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  // Resolution
  resolve: (issueId: string, data: ResolveRequest, token: string) =>
    request<{ decision: unknown }>(`/issues/${issueId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  // Pullout
  pulloutVote: (issueId: string, data: PulloutVoteRequest, token: string) =>
    request<{ vote: unknown; pulloutTriggered: boolean }>(`/issues/${issueId}/pullout-vote`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  // Deliverables
  submitDeliverable: (issueId: string, data: DeliverableRequest, token: string) =>
    request<{ deliverable: unknown }>(`/issues/${issueId}/deliverable`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: authHeaders(token),
    }),

  // Health
  health: () =>
    request<HealthResponse>('/health'),
};
