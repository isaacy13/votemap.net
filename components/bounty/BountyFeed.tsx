'use client'

import { Box, Button, Grid, HStack, Text, VStack } from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BountyCard, BountyCardSkeleton } from './BountyCard'
import { BountyFilters } from './BountyFilters'
import type { Bounty } from '@/lib/types'

const MotionVStack = motion.create(VStack)

interface BountyFeedProps {
  initialBounties?: Bounty[]
}

export function BountyFeed({ initialBounties = [] }: BountyFeedProps) {
  const [bounties, setBounties] = useState<Bounty[]>(initialBounties)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | undefined>()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')

  const fetchBounties = useCallback(async (opts: { status: string; category: string; cursor?: number; replace?: boolean }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (opts.status)   params.set('status',   opts.status)
      if (opts.category) params.set('category', opts.category)
      if (opts.cursor)   params.set('cursor',   String(opts.cursor))

      const res = await fetch(`/api/bounties?${params}`)
      const data = await res.json()
      if (opts.replace) {
        setBounties(data.bounties ?? [])
      } else {
        setBounties((prev) => [...prev, ...(data.bounties ?? [])])
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBounties({ status, category, replace: true })
  }, [status, category, fetchBounties])

  const isEmpty = !loading && bounties.length === 0

  return (
    <MotionVStack
      gap={6}
      align="stretch"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BountyFilters
        status={status}
        category={category}
        onStatusChange={(v) => setStatus(v)}
        onCategoryChange={(v) => setCategory(v)}
      />

      {isEmpty ? (
        <Box py={16} textAlign="center">
          <Text fontSize="2xl" mb={2}>🗳️</Text>
          <Text fontSize="lg" fontWeight="medium" mb={1}>No bounties yet</Text>
          <Text fontSize="sm" color="gray.500">Be the first to create one.</Text>
        </Box>
      ) : (
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {bounties.map((b, i) => (
            <BountyCard key={b.id} bounty={b} index={i} />
          ))}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <BountyCardSkeleton key={`skel-${i}`} />
          ))}
        </Grid>
      )}

      {nextCursor && !loading && (
        <HStack justify="center" pt={2}>
          <Button
            variant="outline"
            rounded="full"
            onClick={() => fetchBounties({ status, category, cursor: nextCursor })}
          >
            Load more
          </Button>
        </HStack>
      )}
    </MotionVStack>
  )
}
