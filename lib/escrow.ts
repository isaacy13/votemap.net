// Server-side only: escrow keypair management
// MVP: custodial server-managed keypairs. Phase 2: Anchor program.
import { Keypair } from '@solana/web3.js';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

function toBuffer(u8: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(u8) as Uint8Array<ArrayBuffer>;
}

async function deriveKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = toBuffer(hexToBytes(rawKey.padEnd(64, '0').slice(0, 64)));
  return crypto.subtle.importKey('raw', keyBytes, { name: ALGORITHM, length: KEY_LENGTH }, false, ['encrypt', 'decrypt']);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateEscrowKeypair(encryptionKey: string): Promise<{ pubkey: string; encryptedPrivkey: string }> {
  const keypair = Keypair.generate();
  const pubkey = keypair.publicKey.toBase58();
  const privateKeyBytes = toBuffer(keypair.secretKey); // 64 bytes

  const cryptoKey = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH)) as Uint8Array<ArrayBuffer>;
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, cryptoKey, privateKeyBytes);

  const combined = new Uint8Array(IV_LENGTH + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), IV_LENGTH);

  return { pubkey, encryptedPrivkey: bytesToHex(combined) };
}

export async function decryptEscrowKeypair(encryptedPrivkey: string, encryptionKey: string): Promise<Keypair> {
  const combined = hexToBytes(encryptedPrivkey);
  const iv = toBuffer(combined.slice(0, IV_LENGTH));
  const data = toBuffer(combined.slice(IV_LENGTH));

  const cryptoKey = await deriveKey(encryptionKey);
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, cryptoKey, data);

  return Keypair.fromSecretKey(new Uint8Array(decrypted));
}
