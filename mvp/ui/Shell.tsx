'use client'

import { Box, Container, Flex, IconButton, Link, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { FaChevronLeft } from 'react-icons/fa'
import { Footer } from '@/components/landing/Footer'
import { AccountControl } from './AccountControl'

export function Wordmark() {
    return (
        <Text
            as="span"
            fontWeight="800"
            fontSize={{ base: '2xl', md: '3xl' }}
            letterSpacing="-0.05em"
            lineHeight="1"
            style={{
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}
        >
            votemap
        </Text>
    )
}

export function Shell({
    children,
    effectsEnabled,
    toggleEffects,
    handle,
    backHref,
    foldFooter = false,
}: {
    children: ReactNode
    effectsEnabled: boolean
    toggleEffects: () => void
    handle?: string | null
    backHref?: string
    foldFooter?: boolean
}) {
    const router = useRouter()

    const chrome = (
        <Container maxW="container.xl" p={4} flex="1" display="flex" flexDir="column" position="relative" zIndex={1}>
            <Box
                as="h1"
                position="absolute"
                w="1px"
                h="1px"
                p={0}
                m="-1px"
                overflow="hidden"
                clip="rect(0, 0, 0, 0)"
                whiteSpace="nowrap"
                borderWidth={0}
            >
                votemap
            </Box>
            <Flex justify="space-between" align="center" gap={4} flexShrink={0}>
                <Flex align="center" gap={1} minW={0}>
                    {backHref ? (
                        <IconButton
                            aria-label="Back"
                            onClick={() => router.push(backHref)}
                            variant="ghost"
                            rounded="full"
                            size="sm"
                            color="gray.700"
                            _dark={{ color: 'gray.100' }}
                            _hover={{ bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.100' } }}
                        >
                            <FaChevronLeft />
                        </IconButton>
                    ) : null}
                    <Link href="/" _hover={{ opacity: 0.8 }}>
                        <Wordmark />
                    </Link>
                </Flex>
                <AccountControl handle={handle} />
            </Flex>
            <Box flex="1" w="full" pt={{ base: 8, md: 10 }} pb={foldFooter ? { base: 28, md: 32 } : 0}>
                {children}
            </Box>
            {foldFooter ? null : (
                <Footer effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} showSocial={false} showGithub />
            )}
        </Container>
    )

    if (foldFooter) {
        return (
            <Box as="main" display="flex" flexDir="column">
                <Box minH="100svh" display="flex" flexDir="column">
                    {chrome}
                </Box>
                <Container maxW="container.xl" px={4} pb={{ base: 8, md: 10 }}>
                    <Footer effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} showSocial={false} showGithub />
                </Container>
            </Box>
        )
    }

    return (
        <Box as="main" minH="100svh" display="flex" flexDir="column">
            {chrome}
        </Box>
    )
}
