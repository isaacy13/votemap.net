'use client'

import {
  Badge, Box, Button, HStack, Link, Text, VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import { PassportBadge } from '@/components/passport/PassportBadge'
import type { Solution } from '@/lib/types'
import { buildAuthMessage } from '@/lib/auth'

const STATUS_COLORS: Record<string, string> = {
  pending:  'blue',
  approved: 'green',
  rejected: 'red',
}

interface SolutionCardProps {
  solution: Solution
  bountyId: string
  creatorWallet?: string
  onResolved?: (txSig: string) => void
}

export function SolutionCard({ solution, bountyId, creatorWallet, onResolved }: SolutionCardProps) {
  const { publicKey, signMessage } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCreator = publicKey?.toBase58() === creatorWallet
  const canApprove = isCreator && solution.status === 'pending'

  async function handleApprove() {
    if (!publicKey || !signMessage) return
    setLoading(true)
    setError(null)
    try {
      const wallet = publicKey.toBase58()
      const timestamp = Date.now()
      const message = buildAuthMessage(wallet, 'resolve-bounty', timestamp)
      const sig = await signMessage(new TextEncoder().encode(message))
      const signature = bs58.encode(sig)

      const res = await fetch(`/api/bounties/${bountyId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          action: 'resolve-bounty',
          timestamp,
          signature,
          solutionId: solution.id,
          winnerWallet: solution.submitter_wallet,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to resolve')
      onResolved?.(data.txSignature)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      p={4}
      rounded="xl"
      border="1px solid"
      borderColor={solution.status === 'approved' ? 'green.200' : 'card.border'}
      _dark={{ borderColor: solution.status === 'approved' ? 'green.800' : 'card.border' }}
      bg="card.bg"
    >
      <VStack gap={3} align="start">
        <HStack gap={2} justify="space-between" w="full" flexWrap="wrap">
          <HStack gap={2}>
            <Text fontWeight="600" fontSize="sm">{solution.title}</Text>
            <Badge colorPalette={STATUS_COLORS[solution.status] ?? 'gray'} size="xs" rounded="full" variant="subtle">
              {solution.status}
            </Badge>
          </HStack>
          <HStack gap={2}>
            <Text fontSize="xs" color="gray.500">
              {solution.submitter_wallet.slice(0, 4)}…{solution.submitter_wallet.slice(-4)}
            </Text>
            <PassportBadge nationality={solution.submitter_nationality} size="xs" />
          </HStack>
        </HStack>

        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          {solution.description}
        </Text>

        {solution.url && (
          <Link href={solution.url} target="_blank" rel="noopener noreferrer" fontSize="sm" color="brand.blue" _hover={{ textDecoration: 'underline' }}>
            View proof →
          </Link>
        )}

        {error && (
          <Text fontSize="xs" color="red.500">{error}</Text>
        )}

        {canApprove && (
          <Button
            size="sm"
            colorPalette="green"
            variant="surface"
            loading={loading}
            onClick={handleApprove}
            rounded="full"
          >
            ✓ Approve &amp; Pay Out
          </Button>
        )}
      </VStack>
    </Box>
  )
}
