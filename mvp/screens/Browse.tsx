'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { liveForCanonical, type Issue } from '../chain'
import { apiUrl, contractAddress } from '../config'
import { api } from '../api'
import { potHash } from '../issueId'
import type { PostSnap } from '../postSnap'
import { formatPostedAt } from '../urls'
import { parsePostUrl } from '../urls'
import { IssueCard } from '../ui/IssueCard'
import { OpenPostFab } from '../ui/OpenPostFab'
import { enter, iosPush } from '../ui/enter'
import type { Hex } from 'viem'

const MotionText = motion(Text)
const MotionVStack = motion(VStack)

type IndexCard = {
    canonical: string
    issueId?: string
    network: string
    handle: string | null
    text?: string
    name?: string
    postedAt: number | null
    mediaUrl?: string
    avatarUrl?: string
}

function screenshotIssues(): Issue[] | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem('votemap.screenshotIssues')
        if (!raw) return null
        const rows = JSON.parse(raw) as { id: `0x${string}`; url: string; live: string; snap?: PostSnap }[]
        return rows.map((r) => ({
            id: r.id,
            url: r.url,
            parsed: parsePostUrl(r.url),
            total: BigInt(r.live),
            live: BigInt(r.live),
            stakers: [],
            byCountry: [],
            snap: r.snap,
        }))
    } catch {
        return null
    }
}

function cardFromIndex(row: IndexCard, live: bigint, id: Hex): Issue {
    const handle = row.handle ? (row.handle.startsWith('@') ? row.handle : `@${row.handle}`) : null
    return {
        id,
        url: row.canonical,
        parsed: parsePostUrl(row.canonical),
        total: live,
        live,
        stakers: [],
        byCountry: [],
        snap: {
            network: row.network,
            handle,
            text: row.text,
            name: row.name,
            postedAt: row.postedAt,
            date: formatPostedAt(row.postedAt),
            mediaUrl: row.mediaUrl,
            avatarUrl: row.avatarUrl,
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
        if (!apiUrl()) {
            Promise.resolve().then(() => {
                if (!gone) setIssues([])
            })
            return () => {
                gone = true
            }
        }
        api<{ rows: IndexCard[] }>('/posts/index?limit=50')
            .then(async (page) => {
                if (gone) return
                const rows = page.rows || []
                const out: Issue[] = []
                for (const row of rows) {
                    const fallback = (row.issueId || potHash(row.canonical)) as Hex
                    let live = BigInt(0)
                    let id = fallback
                    if (contractAddress()) {
                        const chain = await liveForCanonical(row.canonical)
                        if (chain) {
                            live = chain.live
                            id = chain.id
                        }
                    }
                    out.push(cardFromIndex(row, live, id))
                }
                if (!gone) setIssues(out)
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
