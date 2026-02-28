'use client'

import {
  Box, Button, HStack, Input, Text, VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import {
  PublicKey, Transaction,
} from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import bs58 from 'bs58'
import { FundingBar } from './FundingBar'
import { PassportBadge } from '@/components/passport/PassportBadge'
import { WalletRequired } from '@/components/wallet/WalletRequired'
import type { BountyDetail } from '@/lib/types'
import { USDC_DECIMALS } from '@/lib/constants'
import { buildAuthMessage } from '@/lib/auth'

const USDC_MINT_DEVNET  = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

function getUsdcMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
    ? USDC_MINT_MAINNET
    : USDC_MINT_DEVNET
  return new PublicKey(mint)
}

interface FundingPanelProps {
  bounty: BountyDetail
  onFunded?: () => void
}

export function FundingPanel({ bounty, onFunded }: FundingPanelProps) {
  const { publicKey, sendTransaction, signMessage } = useWallet()
  const { connection } = useConnection()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleFund() {
    if (!publicKey || !sendTransaction || !signMessage) return
    const usdcAmount = parseFloat(amount)
    if (!usdcAmount || usdcAmount <= 0) {
      setError('Enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const mint = getUsdcMint()
      const escrow = new PublicKey(bounty.escrow_pubkey)
      const microAmount = Math.round(usdcAmount * Math.pow(10, USDC_DECIMALS))

      // Get source ATA (user's USDC account)
      const sourceAta = await getAssociatedTokenAddress(mint, publicKey)
      // Get destination ATA (escrow's USDC account)
      const destAta = await getAssociatedTokenAddress(mint, escrow)

      const tx = new Transaction()

      // Create destination ATA if it doesn't exist
      const destAtaInfo = await connection.getAccountInfo(destAta)
      if (!destAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey, destAta, escrow, mint,
            TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }

      tx.add(
        createTransferInstruction(
          sourceAta, destAta, publicKey,
          microAmount, [], TOKEN_PROGRAM_ID
        )
      )

      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey

      const txSig = await sendTransaction(tx, connection)
      await connection.confirmTransaction(txSig, 'confirmed')

      // Now record the contribution via our API
      const wallet = publicKey.toBase58()
      const timestamp = Date.now()
      const message = buildAuthMessage(wallet, 'fund-bounty', timestamp)
      const authSig = await signMessage(new TextEncoder().encode(message))
      const authSignature = bs58.encode(authSig)

      const res = await fetch(`/api/bounties/${bounty.id}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          action: 'fund-bounty',
          timestamp,
          signature: authSignature,
          txSignature: txSig,
          usdcAmount: microAmount,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to record contribution')

      setSuccess(`Funded! ${txSig.slice(0, 8)}…`)
      setAmount('')
      onFunded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={5} rounded="2xl" border="1px solid" borderColor="card.border" bg="card.bg">
      <VStack gap={4} align="stretch">
        <FundingBar funded={bounty.usdc_funded} target={bounty.usdc_target} />

        {bounty.needs_activation && (
          <Box p={3} bg="orange.50" _dark={{ bg: 'orange.900' }} rounded="lg">
            <Text fontSize="xs" color="orange.700" _dark={{ color: 'orange.200' }}>
              ⚠️ Send 0.01 SOL to the escrow address to activate this bounty.
            </Text>
            <Text fontSize="xs" fontFamily="mono" color="gray.600" _dark={{ color: 'gray.400' }} mt={1} wordBreak="break-all">
              {bounty.escrow_pubkey}
            </Text>
          </Box>
        )}

        <WalletRequired message="Connect wallet to contribute">
          <VStack gap={3}>
            <HStack w="full">
              <Input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="USDC amount"
                rounded="full"
                size="sm"
              />
              <Text fontSize="sm" fontWeight="medium" color="gray.500" whiteSpace="nowrap">USDC</Text>
            </HStack>
            {error  && <Text fontSize="xs" color="red.500"  w="full">{error}</Text>}
            {success && <Text fontSize="xs" color="green.500" w="full">{success}</Text>}
            <Button
              w="full"
              colorPalette="blue"
              variant="surface"
              loading={loading}
              disabled={!amount || bounty.status !== 'open'}
              onClick={handleFund}
              rounded="full"
            >
              Fund Bounty
            </Button>
          </VStack>
        </WalletRequired>

        {/* Contributors */}
        {bounty.contributions.length > 0 && (
          <VStack gap={2} align="stretch" pt={2} borderTop="1px solid" borderColor="card.border">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              {bounty.contributions.length} Contributor{bounty.contributions.length !== 1 ? 's' : ''}
            </Text>
            {bounty.contributions.slice(0, 8).map((c) => (
              <HStack key={c.id} justify="space-between">
                <HStack gap={1.5}>
                  <PassportBadge nationality={c.funder_nationality} size="xs" />
                  <Text fontSize="xs" fontFamily="mono" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {c.funder_wallet.slice(0, 4)}…{c.funder_wallet.slice(-4)}
                  </Text>
                </HStack>
                <Text fontSize="xs" fontWeight="medium" color="brand.blue">
                  ${(c.usdc_amount / 1_000_000).toFixed(2)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
