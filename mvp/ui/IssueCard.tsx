'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatUsdc } from '../config'
import type { Issue } from '../chain'
import { formatPostedAt, issuePath, networkLabel } from '../urls'
import { useRouter } from 'next/navigation'
import { listEnter } from './enter'

const MotionBox = motion(Box)

/**
 * Window a card: mount near the viewport, unmount when far away.
 * First few rows are eager so above-the-fold enter motion is not waiting on IO.
 */
export function Windowed({
    children,
    eager = false,
    minH = 176,
}: {
    children: ReactNode
    eager?: boolean
    minH?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [shown, setShown] = useState(eager)
    const [ph, setPh] = useState(minH)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true)
                    return
                }
                if (eager) return
                const h = el.getBoundingClientRect().height
                if (h > 8) setPh(h)
                setShown(false)
            },
            { rootMargin: '480px 0px', threshold: 0 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [eager])

    return (
        <Box
            ref={ref}
            minH={shown ? undefined : `${ph}px`}
            css={{
                contentVisibility: 'auto',
                containIntrinsicSize: `auto ${ph}px`,
            }}
        >
            {shown ? children : null}
        </Box>
    )
}

function IssueCardBody({
    issue,
    index,
    effectsEnabled,
}: {
    issue: Issue
    index: number
    effectsEnabled: boolean
}) {
    const router = useRouter()
    const snap = issue.snap
    const network = snap?.network || networkLabel(issue.parsed?.network)
    const handle = snap?.handle || null
    const date = snap?.date || formatPostedAt(snap?.postedAt)
    const who = handle || network
    const initial = (handle || who).replace(/^@/, '').slice(0, 1).toUpperCase()
    const amount = `${formatUsdc(issue.live)} USDC`
    const aria = [network, who, date, snap?.text, amount].filter(Boolean).join(', ')

    return (
        <MotionBox
            as="button"
            w="full"
            textAlign="left"
            p={{ base: 5, md: 6 }}
            rounded="2xl"
            borderWidth="1px"
            borderColor="gray.200"
            bg="white"
            overflow="hidden"
            _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
            cursor="pointer"
            aria-label={aria}
            onClick={() => router.push(issuePath(issue.url))}
            {...listEnter(effectsEnabled, index)}
            whileHover={effectsEnabled ? { y: -3, transition: { duration: 0.25 } } : undefined}
            whileTap={effectsEnabled ? { scale: 0.995 } : undefined}
            css={{
                transition: effectsEnabled ? 'box-shadow 0.3s ease, border-color 0.3s ease' : undefined,
                '&:hover': effectsEnabled ? { boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.18)' } : undefined,
                '.dark &:hover': effectsEnabled ? { boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.55)' } : undefined,
            }}
        >
            <Flex gap={3} align="flex-start">
                <Flex
                    w="9"
                    h="9"
                    rounded="full"
                    overflow="hidden"
                    align="center"
                    justify="center"
                    bg="gray.100"
                    color="gray.700"
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                    _dark={{ bg: 'gray.800', color: 'gray.200' }}
                >
                    {snap?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={snap.avatarUrl} alt="" width={36} height={36} draggable={false} />
                    ) : (
                        initial
                    )}
                </Flex>
                <Box flex="1" minW={0}>
                    <Flex justify="space-between" align="baseline" gap={3} mb={0.5}>
                        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} truncate>
                            {network}
                            {date ? ` · ${date}` : ''}
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" flexShrink={0} letterSpacing="-0.02em">
                            {amount}
                        </Text>
                    </Flex>
                    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="medium" truncate>
                        {who}
                    </Text>
                    {snap?.text ? (
                        <Text
                            mt={2}
                            fontSize={{ base: 'sm', md: 'md' }}
                            color="gray.800"
                            _dark={{ color: 'gray.100' }}
                            whiteSpace="pre-wrap"
                            lineClamp={{ base: 5, md: 4 }}
                        >
                            {snap.text.replace(/\n{2,}/g, '\n')}
                        </Text>
                    ) : null}
                </Box>
                {snap?.mediaUrl ? (
                    <Box
                        w="72px"
                        h="72px"
                        rounded="lg"
                        overflow="hidden"
                        flexShrink={0}
                        bg="gray.100"
                        _dark={{ bg: 'gray.800' }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={snap.mediaUrl}
                            alt=""
                            width={72}
                            height={72}
                            draggable={false}
                            style={{ width: '72px', height: '72px', objectFit: 'cover' }}
                        />
                    </Box>
                ) : null}
            </Flex>
        </MotionBox>
    )
}

export function IssueCard({
    issue,
    index,
    effectsEnabled,
}: {
    issue: Issue
    index: number
    effectsEnabled: boolean
}) {
    return (
        <Windowed eager={index < 6}>
            <IssueCardBody issue={issue} index={index} effectsEnabled={effectsEnabled} />
        </Windowed>
    )
}
