// Server-side only: uses @solana/kit (tree-shakeable, Cloudflare Workers compatible)
import { createSolanaRpc } from '@solana/kit';
import { USDC_MINT_DEVNET, USDC_MINT_MAINNET, USDC_DECIMALS } from './constants';

export function getServerRpc() {
  const url = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  return createSolanaRpc(url);
}

export function getUsdcMint(): string {
  return process.env.SOLANA_NETWORK === 'mainnet' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

export function usdcToMicro(usdc: number): number {
  return Math.round(usdc * Math.pow(10, USDC_DECIMALS));
}

export function microToUsdc(micro: number): number {
  return micro / Math.pow(10, USDC_DECIMALS);
}

export function formatUsdc(micro: number): string {
  const usdc = microToUsdc(micro);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdc);
}

/**
 * Verify a USDC transfer transaction on-chain.
 * Returns true if the tx sent at least `expectedAmountMicro` USDC to `expectedRecipient`.
 */
export async function verifyUsdcTransfer(
  txSignature: string,
  expectedRecipient: string,
  expectedAmountMicro: number
): Promise<boolean> {
  try {
    const rpc = getServerRpc();
    const usdcMint = getUsdcMint();

    // @ts-expect-error – @solana/kit RPC typing
    const tx = await rpc.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
      encoding: 'json',
    }).send();

    if (!tx || tx.meta?.err !== null) return false;

    const preBalances: Array<{ mint: string; owner: string; uiTokenAmount: { amount: string } }> =
      (tx.meta?.preTokenBalances as unknown as Array<{ mint: string; owner: string; uiTokenAmount: { amount: string } }>) ?? [];
    const postBalances: Array<{ mint: string; owner: string; uiTokenAmount: { amount: string } }> =
      (tx.meta?.postTokenBalances as unknown as Array<{ mint: string; owner: string; uiTokenAmount: { amount: string } }>) ?? [];

    // Find the recipient's USDC account in post-balances
    const recipientPost = postBalances.find(
      (b) => b.mint === usdcMint && b.owner === expectedRecipient
    );
    if (!recipientPost) return false;

    const recipientPre = preBalances.find(
      (b) => b.mint === usdcMint && b.owner === expectedRecipient
    );

    const postAmount = BigInt(recipientPost.uiTokenAmount.amount);
    const preAmount = BigInt(recipientPre?.uiTokenAmount.amount ?? '0');
    const received = postAmount - preAmount;

    return received >= BigInt(expectedAmountMicro);
  } catch {
    return false;
  }
}
