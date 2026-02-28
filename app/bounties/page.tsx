import { Heading, HStack, Text, VStack } from '@chakra-ui/react'
import NextLink from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { BountyFeed } from '@/components/bounty/BountyFeed'
import { GradientText } from '@/components/layout/GradientText'
import type { Bounty } from '@/lib/types'

async function getInitialBounties(): Promise<Bounty[]> {
  try {
    // On server: fetch from our own API route via internal URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/bounties?status=open`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.bounties ?? []
  } catch {
    return []
  }
}

export default async function BountiesPage() {
  const initialBounties = await getInitialBounties()

  return (
    <AppShell>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="end" flexWrap="wrap" gap={4}>
          <VStack gap={1} align="start">
            <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em">
              Bounties
            </Heading>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
              Crowdsourced bounties for real-world problems. Fund what matters.
            </Text>
          </VStack>
          <NextLink
            href="/create"
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              background: '#3b82f6',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              display: 'inline-block',
            }}
          >
            + Create Bounty
          </NextLink>
        </HStack>

        <BountyFeed initialBounties={initialBounties} />
      </VStack>
    </AppShell>
  )
}
