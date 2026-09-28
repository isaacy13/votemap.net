'use client'

import { Box, Container, Flex, Link, Stack, Text, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Footer } from '@/components/landing/Footer'
import { VotemapHeading } from '@/components/landing/VotemapHeading'
import { setView } from '../session'

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
    showBrandMark = true,
}: {
    children: ReactNode
    effectsEnabled: boolean
    toggleEffects: () => void
    handle?: string | null
    showBrandMark?: boolean
}) {
    return (
        <Box as="main" minH="100svh" display="flex" flexDir="column">
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
                    <Link href="/" _hover={{ opacity: 0.8 }}>
                        <Wordmark />
                    </Link>
                    <Flex gap={{ base: 4, md: 8 }} fontSize={{ base: 'md', md: 'lg' }} color="gray.600" _dark={{ color: 'gray.300' }}>
                        <Link href="/mvp" fontWeight="medium" onClick={(e) => { e.preventDefault(); setView({ view: 'browse', i: null }) }}>
                            browse
                        </Link>
                        <Link
                            href="/mvp?view=signup"
                            fontWeight="medium"
                            onClick={(e) => {
                                e.preventDefault()
                                setView({ view: handle ? 'me' : 'signup', i: null })
                            }}
                        >
                            {handle ? `@${handle}` : 'you'}
                        </Link>
                    </Flex>
                </Flex>
                <VStack
                    flex="1"
                    justify="center"
                    align="center"
                    textAlign="center"
                    w="full"
                    gap={0}
                    py={{ base: 6, md: 8 }}
                >
                    {showBrandMark ? (
                        <Stack gap={0} align="center" w="full">
                            <VotemapHeading effectsEnabled={effectsEnabled} />
                            <Box mt={{ base: -2, md: -4, lg: -8 }} w="full">
                                {children}
                            </Box>
                        </Stack>
                    ) : (
                        <Box w="full">{children}</Box>
                    )}
                </VStack>
                <Footer effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} />
            </Container>
        </Box>
    )
}
