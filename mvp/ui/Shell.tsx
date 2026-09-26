'use client'

import { Box, Flex, Link, Text } from '@chakra-ui/react'
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
        <Box as="main" minH="100vh" display="flex" flexDir="column">
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
            <Box maxW="container.xl" mx="auto" w="full" px={4} pt={4} position="relative" zIndex={1} flex="1">
                <Flex justify="space-between" align="center" py={2} gap={4}>
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
                <Box py={{ base: 8, md: 12 }}>{children}</Box>
            </Box>
            <Box maxW="container.xl" mx="auto" w="full" px={4}>
                <Footer effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} />
            </Box>
        </Box>
    )
}
