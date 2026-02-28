'use client'

import { Box, Flex, HStack, Link } from '@chakra-ui/react'
import NextLink from 'next/link'
import { useTheme } from 'next-themes'
import { IconButton } from '@chakra-ui/react'
import { FaMoon, FaSun } from 'react-icons/fa'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { NetworkBadge } from '@/components/wallet/NetworkBadge'
import { GradientText } from './GradientText'

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="1px solid"
      borderColor="card.border"
      backdropFilter="blur(12px)"
      bg="nav.bg"
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        px={{ base: 4, md: 6 }}
        h={14}
        align="center"
        justify="space-between"
      >
        {/* Logo */}
        <Link as={NextLink} href="/" _hover={{ textDecoration: 'none', opacity: 0.8 }} transition="opacity 0.2s">
          <GradientText fontSize="xl" letterSpacing="-0.05em">
            votemap
          </GradientText>
        </Link>

        {/* Nav Links */}
        <HStack gap={{ base: 4, md: 6 }} display={{ base: 'none', sm: 'flex' }}>
          <Link
            as={NextLink}
            href="/bounties"
            fontSize="sm"
            fontWeight="medium"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            _hover={{ color: 'gray.900', _dark: { color: 'white' } }}
            transition="color 0.2s"
          >
            Explore
          </Link>
          <Link
            as={NextLink}
            href="/create"
            fontSize="sm"
            fontWeight="medium"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            _hover={{ color: 'gray.900', _dark: { color: 'white' } }}
            transition="color 0.2s"
          >
            + Create
          </Link>
          <Link
            as={NextLink}
            href="/profile"
            fontSize="sm"
            fontWeight="medium"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            _hover={{ color: 'gray.900', _dark: { color: 'white' } }}
            transition="color 0.2s"
          >
            Profile
          </Link>
        </HStack>

        {/* Right side */}
        <HStack gap={2}>
          <NetworkBadge />
          <ConnectWalletButton size="sm" />
          <IconButton
            aria-label="Toggle color mode"
            onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
            variant="ghost"
            rounded="full"
            size="sm"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            _hover={{ color: 'blue.500', bg: 'transparent' }}
          >
            {resolvedTheme === 'light' ? <FaMoon /> : <FaSun />}
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  )
}
