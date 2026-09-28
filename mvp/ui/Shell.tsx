'use client'

import { Box, Container, Flex, Link, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { Footer } from '@/components/landing/Footer'
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
}: {
    children: ReactNode
    effectsEnabled: boolean
    toggleEffects: () => void
    handle?: string | null
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
                    <Link
                        href="/mvp"
                        _hover={{ opacity: 0.8 }}
                        onClick={(e) => {
                            e.preventDefault()
                            setView({ view: null, i: null })
                        }}
                    >
                        <Wordmark />
                    </Link>
                    {handle ? (
                        <Link
                            href="/mvp?view=me"
                            fontWeight="medium"
                            fontSize={{ base: 'md', md: 'lg' }}
                            color="gray.600"
                            _dark={{ color: 'gray.300' }}
                            onClick={(e) => {
                                e.preventDefault()
                                setView({ view: 'me', i: null })
                            }}
                        >
                            @{handle}
                        </Link>
                    ) : null}
                </Flex>
                <Box flex="1" w="full" pt={{ base: 8, md: 10 }}>
                    {children}
                </Box>
                <Footer
                    effectsEnabled={effectsEnabled}
                    toggleEffects={toggleEffects}
                    showSocial={false}
                    showGithub
                />
            </Container>
        </Box>
    )
}
