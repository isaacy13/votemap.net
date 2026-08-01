import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { api } from './api';
import type { VoteSessionAction } from '@votemap/shared';

/** Canonical payload hash — must match backend `hashPayload` (JSON.stringify + sha256 hex). */
export async function hashPayload(payload: unknown): Promise<string> {
  const data = JSON.stringify(payload);
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

export async function promptBiometrics(reason: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use device passcode',
    disableDeviceFallback: false,
  });
  return result.success;
}

function normalizePayload(action: VoteSessionAction, payload: Record<string, unknown>) {
  switch (action) {
    case 'stake':
      return {
        outcomeId: payload.outcomeId,
        amountUsdc: payload.amountUsdc,
        deadlineAt: payload.deadlineAt,
      };
    case 'donate':
      return {
        entityId: payload.entityId,
        amountUsdc: payload.amountUsdc,
        memo: payload.memo ?? null,
      };
    case 'resolve':
      return {
        outcomeId: payload.outcomeId,
        stakeId: payload.stakeId,
        decision: payload.decision,
      };
    case 'deliverable':
      return {
        outcomeId: payload.outcomeId,
        proofText: payload.proofText,
      };
    default:
      return payload;
  }
}

/**
 * Prepare a vote: create session, Face ID on native (auto-confirm),
 * or return session for web QR / phone confirmation.
 */
export async function beginVoteSession(
  token: string,
  action: VoteSessionAction,
  payload: Record<string, unknown>
): Promise<{ voteSessionId: string; needsPhoneConfirm: boolean; deepLink: string }> {
  const normalized = normalizePayload(action, payload);
  const payloadHash = await hashPayload({ action, ...normalized });
  const { session, deepLink } = await api.createVoteSession({ action, payloadHash }, token);

  if (Platform.OS !== 'web') {
    const ok = await promptBiometrics('Confirm with Face ID to vote on VoteMap');
    if (!ok) {
      throw new Error('Face ID required to vote');
    }
    await api.confirmVoteSession(session.id, token);
    return { voteSessionId: session.id, needsPhoneConfirm: false, deepLink };
  }

  return { voteSessionId: session.id, needsPhoneConfirm: true, deepLink };
}

export async function waitForVoteSessionConfirm(
  token: string,
  sessionId: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
): Promise<void> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const intervalMs = opts?.intervalMs ?? 1500;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { session } = await api.getVoteSession(sessionId, token);
    if (session.status === 'confirmed') return;
    if (session.status === 'expired' || session.status === 'consumed') {
      throw new Error(`Vote session ${session.status}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Timed out waiting for Face ID confirmation on your phone');
}
