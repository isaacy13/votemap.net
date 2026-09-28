'use client'

import { Box, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatUsdc } from '../config'
import type { Issue } from '../chain'
import { setView } from '../session'
import { postPreview } from '../urls'
import { listEnter } from './enter'

const MotionBox = motion(Box)

/**
 * Window a card: mount near the viewport, unmount when far away.
 * First few rows are eager so above-the-fold enter motion is not waiting on IO.
 */
export function Windowed({
    children,
    eager = false,
    minH = 148,
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
                const h = el.getBoundingClientRect().height
                if (h > 8) setPh(h)
                setShown(false)
            },
            { rootMargin: '480px 0px', threshold: 0 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

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

export function IssueCard({
    issue,
    index,
    effectsEnabled,
}: {
    issue: Issue
    index: number
    effectsEnabled: boolean
}) {
    const preview = postPreview(issue.url, issue.parsed)
    const title = preview.handle ?? (preview.network === 'X' ? 'X post' : preview.network)
    const amount = `${formatUsdc(issue.live)} USDC`

    return (
        <Windowed eager={index < 6}>
            <MotionBox
                as="button"
                w="full"
                textAlign="left"
                p={{ base: 6, md: 8 }}
                rounded="2xl"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
                overflow="hidden"
                _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
                cursor="pointer"
                aria-label={`${title}, ${amount}`}
                onClick={() => setView({ view: 'issue', i: issue.url })}
                {...listEnter(effectsEnabled, index)}
                whileHover={effectsEnabled ? { y: -3, transition: { duration: 0.25 } } : undefined}
                whileTap={effectsEnabled ? { scale: 0.995 } : undefined}
                css={{
                    transition: effectsEnabled ? 'box-shadow 0.3s ease, border-color 0.3s ease' : undefined,
                    '&:hover': effectsEnabled
                        ? { boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.18)' }
                        : undefined,
                    '.dark &:hover': effectsEnabled
                        ? { boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.55)' }
                        : undefined,
                }}
            >
                <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }} mb={3}>
                    {preview.network}
                </Text>
                <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="medium" truncate>
                    {title}
                </Text>
                <Text mt={3} fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold" letterSpacing="-0.04em">
                    {amount}
                </Text>
            </MotionBox>
        </Windowed>
    )
}
