import { beginVoteSession } from './biometrics';
import type { VoteSessionAction } from '@votemap/shared';

export type PhoneGate = {
  sessionId: string;
  deepLink: string;
};

/**
 * Starts a vote session. On native, Face ID confirms inline.
 * On web, returns gate info so UI can show PhoneConfirmModal.
 */
export async function prepareVote(
  token: string,
  action: VoteSessionAction,
  payload: Record<string, unknown>
): Promise<{ voteSessionId: string; phoneGate: PhoneGate | null }> {
  const session = await beginVoteSession(token, action, payload);
  if (session.needsPhoneConfirm) {
    return {
      voteSessionId: session.voteSessionId,
      phoneGate: { sessionId: session.voteSessionId, deepLink: session.deepLink },
    };
  }
  return { voteSessionId: session.voteSessionId, phoneGate: null };
}
