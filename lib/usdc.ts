// Server-side USDC payout (escrow → winner)
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import type { Keypair } from '@solana/web3.js';
import { getUsdcMint } from './solana';

function getConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  return new Connection(url, 'confirmed');
}

/**
 * Transfer USDC from the escrow keypair to a recipient wallet.
 * Returns the transaction signature.
 * Note: uses @solana/web3.js v1 (server-side only, not in Worker bundle edge runtime).
 * This function should only be called from Next.js Route Handlers with nodejs runtime.
 */
export async function payoutFromEscrow(
  escrowKeypair: Keypair,
  recipientWallet: string,
  amountMicro: number
): Promise<string> {
  const connection = getConnection();
  const usdcMintAddress = getUsdcMint();
  const mint = new PublicKey(usdcMintAddress);
  const recipient = new PublicKey(recipientWallet);

  // Get or create the escrow's USDC token account
  const escrowTokenAccount = await getAssociatedTokenAddress(mint, escrowKeypair.publicKey);

  // Get or create the recipient's USDC associated token account
  // This may create the account and charge rent from escrow SOL balance
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    escrowKeypair, // fee payer
    mint,
    recipient
  );

  const transaction = new Transaction().add(
    createTransferInstruction(
      escrowTokenAccount,
      recipientTokenAccount.address,
      escrowKeypair.publicKey,
      amountMicro,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair]);
  return signature;
}
