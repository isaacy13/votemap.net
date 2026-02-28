'use client'

import { Box, HStack, Text } from '@chakra-ui/react'
import { microToUsdc } from '@/lib/solana'

interface FundingBarProps {
  funded: number
  target: number
  showLabels?: boolean
}

export function FundingBar({ funded, target, showLabels = true }: FundingBarProps) {
  const pct = target > 0 ? Math.min(100, (funded / target) * 100) : 0
  const fundedUsdc = microToUsdc(funded)
  const targetUsdc = microToUsdc(target)

  return (
    <Box w="full">
      {showLabels && (
        <HStack justify="space-between" mb={1.5}>
          <Text fontSize="xs" fontWeight="semibold" color="brand.blue">
            ${fundedUsdc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USDC
          </Text>
          <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
            ${targetUsdc.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} goal
          </Text>
        </HStack>
      )}
      <Box
        bg="gray.100"
        _dark={{ bg: 'gray.800' }}
        rounded="full"
        h="6px"
        w="full"
        overflow="hidden"
      >
        <Box
          bgGradient="to-r"
          gradientFrom="brand.blue"
          gradientTo="brand.purple"
          rounded="full"
          h="full"
          w={`${pct}%`}
          transition="width 0.5s ease"
          minW={pct > 0 ? '6px' : '0'}
        />
      </Box>
    </Box>
  )
}
