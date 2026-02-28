import { Badge, Box, Grid, Heading, HStack, Link, Text, VStack } from '@chakra-ui/react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { FundingPanel } from '@/components/bounty/FundingPanel'
import { SolutionCard } from '@/components/bounty/SolutionCard'
import { BountyActions } from '@/components/bounty/BountyActions'
import { PassportBadge } from '@/components/passport/PassportBadge'
import type { BountyDetail } from '@/lib/types'
import { BOUNTY_CATEGORIES } from '@/lib/constants'
import { format } from 'date-fns'

async function getBounty(id: string): Promise<BountyDetail | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/bounties/${id}`, {
      next: { revalidate: 10 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.bounty ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const bounty = await getBounty(id)
  if (!bounty) return {}
  return {
    title: `${bounty.title} — votemap`,
    description: bounty.description.slice(0, 160),
  }
}

const STATUS_COLORS: Record<string, string> = {
  open:       'green',
  in_review:  'orange',
  resolved:   'purple',
  cancelled:  'red',
}

const STATUS_LABELS: Record<string, string> = {
  open:       'Open',
  in_review:  'In Review',
  resolved:   'Resolved',
  cancelled:  'Cancelled',
}

export default async function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bounty = await getBounty(id)

  if (!bounty) notFound()

  const categoryLabel = BOUNTY_CATEGORIES.find((c) => c.value === bounty.category)?.label ?? bounty.category
  const createdDate = format(new Date(bounty.created_at * 1000), 'MMM d, yyyy')

  return (
    <AppShell>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 320px' }} gap={8} alignItems="start">
        {/* Left: main content */}
        <VStack gap={6} align="stretch">
          {/* Breadcrumb */}
          <HStack fontSize="sm" color="gray.500">
            <Link href="/bounties" _hover={{ color: 'brand.blue' }}>Bounties</Link>
            <Text>›</Text>
            <Text lineClamp={1}>{bounty.title}</Text>
          </HStack>

          {/* Badges */}
          <HStack gap={2} flexWrap="wrap">
            <Badge colorPalette={STATUS_COLORS[bounty.status] ?? 'gray'} rounded="full" size="md" variant="subtle">
              {STATUS_LABELS[bounty.status] ?? bounty.status}
            </Badge>
            <Badge colorPalette="gray" rounded="full" size="md" variant="outline">
              {categoryLabel}
            </Badge>
          </HStack>

          {/* Title */}
          <Heading
            size={{ base: '2xl', md: '3xl' }}
            fontWeight="800"
            letterSpacing="-0.04em"
            lineHeight="1.1"
          >
            {bounty.title}
          </Heading>

          {/* Creator + date */}
          <HStack gap={3} fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            <HStack gap={1.5}>
              <Text>by</Text>
              <Text fontFamily="mono">
                {bounty.creator_wallet.slice(0, 4)}…{bounty.creator_wallet.slice(-4)}
              </Text>
              <PassportBadge nationality={bounty.creator_nationality} size="xs" />
            </HStack>
            <Text>·</Text>
            <Text>{createdDate}</Text>
          </HStack>

          {/* Description */}
          <Box
            fontSize="md"
            color="gray.700"
            _dark={{ color: 'gray.300' }}
            lineHeight="1.75"
            whiteSpace="pre-wrap"
          >
            {bounty.description}
          </Box>

          {/* Solutions section */}
          <Box pt={4} borderTop="1px solid" borderColor="card.border">
            <HStack justify="space-between" mb={4}>
              <Heading size="md" fontWeight="700">
                Solutions ({bounty.solutions.length})
              </Heading>
              <BountyActions bountyId={bounty.id} status={bounty.status} />
            </HStack>

            {bounty.solutions.length === 0 ? (
              <Box py={8} textAlign="center">
                <Text fontSize="sm" color="gray.500">
                  No solutions submitted yet. Be the first to solve this!
                </Text>
              </Box>
            ) : (
              <VStack gap={3} align="stretch">
                {bounty.solutions.map((s) => (
                  <SolutionCard
                    key={s.id}
                    solution={s}
                    bountyId={bounty.id}
                    creatorWallet={bounty.creator_wallet}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </VStack>

        {/* Right: funding panel (sticky on desktop) */}
        <Box position={{ lg: 'sticky' }} top={{ lg: '80px' }}>
          <FundingPanel bounty={bounty} />
        </Box>
      </Grid>
    </AppShell>
  )
}

