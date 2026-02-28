import nacl from 'tweetnacl';
import bs58 from 'bs58';

const AUTH_WINDOW_MS = 5 * 60 * 1000; // 5-minute replay protection window

export function buildAuthMessage(wallet: string, action: string, timestamp: number): string {
  return `votemap.net\nAction: ${action}\nWallet: ${wallet}\nTimestamp: ${timestamp}`;
}

export async function verifyWalletSignature({
  wallet,
  action,
  timestamp,
  signature,
}: {
  wallet: string;
  action: string;
  timestamp: number;
  signature: string;
}): Promise<boolean> {
  // Verify timestamp is within window
  const now = Date.now();
  if (Math.abs(now - timestamp) > AUTH_WINDOW_MS) {
    return false;
  }

  try {
    const message = buildAuthMessage(wallet, action, timestamp);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(wallet);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
