'use client'

import { Box, Badge, HStack, Link, Text, VStack } from '@chakra-ui/react'
import NextLink from 'next/link'
import { motion } from 'framer-motion'
import { FundingBar } from './FundingBar'
import { PassportBadge } from '@/components/passport/PassportBadge'
import type { Bounty } from '@/lib/types'
import { BOUNTY_CATEGORIES } from '@/lib/constants'

const MotionBox = motion.create(Box)

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

interface BountyCardProps {
  bounty: Bounty
  index?: number
}

export function BountyCard({ bounty, index = 0 }: BountyCardProps) {
  const categoryLabel = BOUNTY_CATEGORIES.find((c) => c.value === bounty.category)?.label ?? bounty.category

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link
        as={NextLink}
        href={`/bounties/${bounty.id}`}
        _hover={{ textDecoration: 'none' }}
        display="block"
      >
        <Box
          p={5}
          rounded="xl"
          border="1px solid"
          borderColor="card.border"
          bg="card.bg"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'md',
            borderColor: 'brand.purple',
          }}
          transition="all 0.2s"
          h="full"
          display="flex"
          flexDirection="column"
          gap={3}
        >
          {/* Status + Category badges */}
          <HStack gap={2} flexWrap="wrap">
            <Badge
              colorPalette={STATUS_COLORS[bounty.status] ?? 'gray'}
              variant="subtle"
              size="sm"
              rounded="full"
            >
              {STATUS_LABELS[bounty.status] ?? bounty.status}
            </Badge>
            <Badge variant="outline" colorPalette="gray" size="sm" rounded="full">
              {categoryLabel}
            </Badge>
          </HStack>

          {/* Title */}
          <Text
            fontWeight="700"
            fontSize="md"
            lineClamp={2}
            letterSpacing="-0.01em"
          >
            {bounty.title}
          </Text>

          {/* Description */}
          <Text
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            lineClamp={3}
            flex={1}
          >
            {bounty.description}
          </Text>

          {/* Funding progress */}
          <FundingBar funded={bounty.usdc_funded} target={bounty.usdc_target} />

          {/* Creator */}
          <HStack gap={2} mt={1}>
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.500' }}>
              by {bounty.creator_wallet.slice(0, 4)}…{bounty.creator_wallet.slice(-4)}
            </Text>
            <PassportBadge nationality={bounty.creator_nationality} size="xs" />
          </HStack>
        </Box>
      </Link>
    </MotionBox>
  )
}

export function BountyCardSkeleton() {
  return (
    <Box
      p={5}
      rounded="xl"
      border="1px solid"
      borderColor="card.border"
      bg="card.bg"
      h="220px"
    >
      <VStack gap={3} align="start">
        <Box h="20px" w="80px" bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="full" />
        <Box h="24px" w="full" bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="md" />
        <Box h="16px" w="90%" bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="md" />
        <Box h="16px" w="70%" bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="md" />
        <Box h="6px" w="full" bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="full" mt="auto" />
      </VStack>
    </Box>
  )
}
