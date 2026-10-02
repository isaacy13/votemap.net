'use client'

import { Box, Flex, Link, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { api, ApiError } from '../api'
import { apiUrl } from '../config'
import type { PublicCard } from '../profile'
import { enter } from '../ui/enter'

const MotionText = motion(Text)
const MotionBox = motion(Box)

function screenshotProfile(): PublicCard | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem('votemap.screenshotProfile')
        if (!raw) return null
        const row = JSON.parse(raw) as PublicCard
        if (!row?.handle || !Array.isArray(row.links)) return null
        return row
    } catch {
        return null
    }
}

export function PublicProfile({ handle, effectsEnabled }: { handle: string; effectsEnabled: boolean }) {
    const [card, setCard] = useState<PublicCard | null | undefined>(undefined)
    const [err, setErr] = useState('')

    useEffect(() => {
        let gone = false
        const seeded = screenshotProfile()
        if (seeded && seeded.handle === handle) {
            Promise.resolve().then(() => {
                if (!gone) setCard(seeded)
            })
            return () => {
                gone = true
            }
        }
        if (!apiUrl()) {
            Promise.resolve().then(() => {
                if (!gone) setCard(null)
            })
            return () => {
                gone = true
            }
        }
        api<PublicCard>(`/u/${encodeURIComponent(handle)}`)
            .then((row) => {
                if (!gone) setCard(row)
            })
            .catch((e: Error) => {
                if (gone) return
                setErr(e instanceof ApiError && e.status === 404 ? '' : e.message)
                setCard(null)
            })
        return () => {
            gone = true
        }
    }, [handle])

    if (card === undefined) return null

    if (!card) {
        return (
            <MotionText
                textAlign="center"
                fontSize={{ base: 'xl', md: '2xl' }}
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                {...enter(effectsEnabled, 0.2)}
            >
                {err || 'No such profile'}
            </MotionText>
        )
    }

    return (
        <VStack gap={8} align="stretch" w="full" maxW="420px" mx="auto">
            <MotionText
                as="h2"
                fontSize={{ base: '4xl', md: '5xl' }}
                fontWeight="bold"
                letterSpacing="-0.04em"
                textAlign="center"
                {...enter(effectsEnabled, 0.15)}
            >
                @{card.handle}
            </MotionText>
            {card.links.length === 0 ? (
                <MotionText
                    textAlign="center"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    {...enter(effectsEnabled, 0.3)}
                >
                    No links yet
                </MotionText>
            ) : (
                <VStack gap={3} align="stretch">
                    {card.links.map((link, i) => (
                        <MotionBox key={`${link.url}-${i}`} {...enter(effectsEnabled, 0.25 + Math.min(i, 6) * 0.08)}>
                            <Link
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                display="block"
                                w="full"
                                px={5}
                                py={4}
                                rounded="2xl"
                                borderWidth="1px"
                                borderColor="gray.200"
                                bg="white"
                                textDecoration="none"
                                _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
                                _hover={{ borderColor: 'gray.400', textDecoration: 'none', _dark: { borderColor: 'gray.500' } }}
                            >
                                <Flex align="center" justify="center" gap={2}>
                                    <Text fontWeight="medium" fontSize={{ base: 'md', md: 'lg' }} truncate>
                                        {link.label}
                                    </Text>
                                    {link.verified ? (
                                        <Flex
                                            as="span"
                                            align="center"
                                            gap={1}
                                            color="blue.500"
                                            _dark={{ color: 'blue.300' }}
                                            flexShrink={0}
                                            title="Verified bio bind"
                                        >
                                            <FaCheckCircle size={14} />
                                            <Text as="span" fontSize="xs" fontWeight="semibold">
                                                verified
                                            </Text>
                                        </Flex>
                                    ) : null}
                                </Flex>
                            </Link>
                        </MotionBox>
                    ))}
                </VStack>
            )}
        </VStack>
    )
}
