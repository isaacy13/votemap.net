'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { listIssues, type Issue } from '../chain'
import { apiUrl } from '../config'
import { api } from '../api'
import type { PostSnap } from '../postSnap'
import { formatPostedAt } from '../urls'
import { parsePostUrl } from '../urls'
import { IssueCard } from '../ui/IssueCard'
import { OpenPostFab } from '../ui/OpenPostFab'
import { enter, iosPush } from '../ui/enter'

const MotionText = motion(Text)
const MotionVStack = motion(VStack)

function screenshotIssues(): Issue[] | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem('votemap.screenshotIssues')
        if (!raw) return null
        const rows = JSON.parse(raw) as { id: `0x${string}`; url: string; live: string }[]
        return rows.map((r) => ({
            id: r.id,
            url: r.url,
            parsed: parsePostUrl(r.url),
            total: BigInt(r.live),
            live: BigInt(r.live),
            stakers: [],
            byCountry: [],
        }))
    } catch {
        return null
    }
}

function mergeSnap(issue: Issue, extra?: PostSnap | null): Issue {
    if (!extra) return issue
    const handle = extra.handle
        ? extra.handle.startsWith('@')
            ? extra.handle
            : `@${extra.handle}`
        : extra.handle
    return {
        ...issue,
        snap: {
            ...extra,
            handle: handle ?? extra.handle,
            date: extra.date || formatPostedAt(extra.postedAt),
        },
    }
}

export function Browse({ effectsEnabled }: { effectsEnabled: boolean }) {
    const [issues, setIssues] = useState<Issue[] | null>(null)
    const [err, setErr] = useState('')

    useEffect(() => {
        let gone = false
        const seeded = screenshotIssues()
        if (seeded) {
            Promise.resolve().then(() => {
                if (!gone) setIssues(seeded)
            })
            return () => {
                gone = true
            }
        }
        listIssues()
            .then(async (rows) => {
                if (gone) return
                let snaps: Record<string, PostSnap> = {}
                if (apiUrl()) {
                    try {
                        snaps = await api('/posts/snaps')
                    } catch {
                        snaps = {}
                    }
                }
                if (!gone) setIssues(rows.map((r) => mergeSnap(r, snaps[r.url])))
            })
            .catch((e: Error) => {
                if (gone) return
                setErr(e.message)
                setIssues([])
            })
        return () => {
            gone = true
        }
    }, [])

    const list = issues ?? []
    const loaded = issues !== null
    const empty = loaded && list.length === 0

    return (
        <>
            <AnimatePresence mode="wait">
                <MotionVStack
                    key="catalog"
                    gap={4}
                    align="stretch"
                    w="full"
                    maxW="720px"
                    mx="auto"
                    {...iosPush(effectsEnabled, -1)}
                >
                    <AnimatePresence mode="wait">
                        {empty ? (
                            <MotionText
                                key="empty"
                                textAlign="center"
                                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                                color="gray.500"
                                _dark={{ color: 'gray.400' }}
                                {...enter(effectsEnabled, 0.4)}
                                exit={effectsEnabled ? { opacity: 0, y: -12 } : undefined}
                            >
                                No issues yet
                            </MotionText>
                        ) : loaded ? (
                            <MotionVStack
                                key="pots"
                                gap={4}
                                align="stretch"
                                w="full"
                                role="list"
                                initial={false}
                                exit={effectsEnabled ? { opacity: 0, y: -12 } : undefined}
                            >
                                {list.map((issue, index) => (
                                    <Box key={issue.id} role="listitem">
                                        <IssueCard issue={issue} index={index} effectsEnabled={effectsEnabled} />
                                    </Box>
                                ))}
                            </MotionVStack>
                        ) : null}
                    </AnimatePresence>
                    {err ? (
                        <Text textAlign="center" color="red.500">
                            {err}
                        </Text>
                    ) : null}
                </MotionVStack>
            </AnimatePresence>
            <OpenPostFab effectsEnabled={effectsEnabled} />
        </>
    )
}
