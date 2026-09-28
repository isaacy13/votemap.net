'use client'

import { Box, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatUsdc } from '../config'
import type { Issue } from '../chain'
import { setView } from '../session'
import { enter } from './enter'

const MotionBox = motion(Box)

/** Mount children only when near the viewport so a long catalog cannot boot every card at once. */
export function LazyMount({ children, minH = '132px' }: { children: ReactNode; minH?: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [shown, setShown] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setShown(true)
            },
            { rootMargin: '280px 0px', threshold: 0.01 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    return (
        <Box ref={ref} minH={shown ? undefined : minH} css={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 132px' }}>
            {shown ? children : null}
        </Box>
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
    const delay = 0.35 + Math.min(index, 6) * 0.08

    return (
        <LazyMount>
            <MotionBox
                as="button"
                w="full"
                textAlign="left"
                p={{ base: 5, md: 8 }}
                rounded="2xl"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
                _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
                cursor="pointer"
                onClick={() => setView({ view: 'issue', i: issue.url })}
                _hover={effectsEnabled ? { transform: 'translateY(-3px)', shadow: 'lg' } : undefined}
                css={{ transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
                {...enter(effectsEnabled, delay)}
            >
                <Text fontSize="sm" color="gray.500" mb={1}>
                    {issue.parsed?.network === 'threads' ? 'Threads' : 'X'}
                </Text>
                <Text fontWeight="medium" wordBreak="break-all">
                    {issue.url}
                </Text>
                <Text mt={3} fontSize="2xl" fontWeight="bold">
                    {formatUsdc(issue.live)} USDC
                </Text>
            </MotionBox>
        </LazyMount>
    )
}
