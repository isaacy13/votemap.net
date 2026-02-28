'use client'

import {
  Box, Grid, Heading, HStack, Link, Tabs,
  Text, VStack,
} from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { BountyCard } from '@/components/bounty/BountyCard'
import { PassportBadge } from '@/components/passport/PassportBadge'
import { VerifyPrompt } from '@/components/passport/VerifyPrompt'
import { WalletRequired } from '@/components/wallet/WalletRequired'
import type { UserProfile } from '@/lib/types'

function ProfileContent({ wallet }: { wallet: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [nationality, setNationality] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/users/${wallet}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile ?? null)
        setNationality(data.profile?.passport?.nationality ?? null)
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [wallet])

  if (loading) {
    return (
      <Box py={16} textAlign="center">
        <Text color="gray.400" fontSize="sm">Loading profile…</Text>
      </Box>
    )
  }

  return (
    <VStack gap={8} align="stretch">
      {/* Profile header */}
      <Box p={6} rounded="2xl" border="1px solid" borderColor="card.border" bg="card.bg">
        <HStack gap={4} flexWrap="wrap">
          <Box
            w={12}
            h={12}
            rounded="full"
            bgGradient="to-br"
            gradientFrom="brand.blue"
            gradientTo="brand.purple"
            flexShrink={0}
          />
          <VStack gap={1} align="start" flex={1}>
            <HStack gap={2}>
              <Text fontFamily="mono" fontWeight="600" fontSize="sm">
                {wallet.slice(0, 6)}…{wallet.slice(-6)}
              </Text>
              {nationality
                ? <PassportBadge nationality={nationality} size="sm" showName />
                : <PassportBadge nationality={null} size="sm" />
              }
            </HStack>
            <HStack gap={4} fontSize="sm" color="gray.500">
              <Text>{profile?.created_bounties.length ?? 0} bounties</Text>
              <Text>{profile?.contributions.length ?? 0} contributions</Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Passport verification */}
      {!nationality && (
        <VerifyPrompt onVerified={(nat) => setNationality(nat)} />
      )}

      {/* Tabs */}
      <Tabs.Root defaultValue="bounties" variant="subtle">
        <Tabs.List borderBottom="1px solid" borderColor="card.border" pb={0}>
          <Tabs.Trigger value="bounties" fontSize="sm">My Bounties</Tabs.Trigger>
          <Tabs.Trigger value="contributions" fontSize="sm">Contributions</Tabs.Trigger>
          <Tabs.Trigger value="solutions" fontSize="sm">Solutions</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="bounties" pt={4}>
          {!profile?.created_bounties.length ? (
            <Box py={12} textAlign="center">
              <Text fontSize="sm" color="gray.500">No bounties created yet.</Text>
              <Link href="/create" color="brand.blue" fontSize="sm" mt={2} display="block" _hover={{ textDecoration: 'underline' }}>
                Create your first bounty →
              </Link>
            </Box>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              {profile.created_bounties.map((b, i) => (
                <BountyCard key={b.id} bounty={b} index={i} />
              ))}
            </Grid>
          )}
        </Tabs.Content>

        <Tabs.Content value="contributions" pt={4}>
          {!profile?.contributions.length ? (
            <Box py={12} textAlign="center">
              <Text fontSize="sm" color="gray.500">No contributions yet.</Text>
              <Link href="/bounties" color="brand.blue" fontSize="sm" mt={2} display="block" _hover={{ textDecoration: 'underline' }}>
                Browse bounties →
              </Link>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {profile.contributions.map((c) => (
                <Box key={c.id} p={4} rounded="xl" border="1px solid" borderColor="card.border" bg="card.bg">
                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Link href={`/bounties/${c.bounty_id}`} fontWeight="medium" fontSize="sm" _hover={{ color: 'brand.blue' }}>
                      {c.bounty_title}
                    </Link>
                    <Text fontWeight="700" fontSize="sm" color="brand.blue">
                      ${(c.usdc_amount / 1_000_000).toFixed(2)} USDC
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Tabs.Content>

        <Tabs.Content value="solutions" pt={4}>
          {!profile?.solutions.length ? (
            <Box py={12} textAlign="center">
              <Text fontSize="sm" color="gray.500">No solutions submitted yet.</Text>
            </Box>
          ) : (
            <VStack gap={3} align="stretch">
              {profile.solutions.map((s) => (
                <Box key={s.id} p={4} rounded="xl" border="1px solid" borderColor="card.border" bg="card.bg">
                  <VStack gap={2} align="start">
                    <HStack justify="space-between" w="full" flexWrap="wrap" gap={2}>
                      <Text fontWeight="600" fontSize="sm">{s.title}</Text>
                      <Link href={`/bounties/${s.bounty_id}`} fontSize="xs" color="gray.500" _hover={{ color: 'brand.blue' }}>
                        {s.bounty_title}
                      </Link>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" lineClamp={2}>{s.description}</Text>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  )
}

export default function ProfilePage() {
  const { publicKey } = useWallet()

  return (
    <AppShell>
      <VStack gap={8} align="stretch">
        <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em">
          Profile
        </Heading>
        <WalletRequired message="Connect your wallet to view your profile">
          {publicKey && <ProfileContent wallet={publicKey.toBase58()} />}
        </WalletRequired>
      </VStack>
    </AppShell>
  )
}
