'use client'

import { Box, Button, Text, VStack } from '@chakra-ui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { listIssues, type Issue } from '../chain'
import { parsePostUrl } from '../urls'
import { setView } from '../session'
import { BigInput } from '../ui/BigInput'
import { IssueCard } from '../ui/IssueCard'
import { Question } from '../ui/Question'
import { enter, swap } from '../ui/enter'

const MotionText = motion(Text)
const MotionBox = motion(Box)
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

function CatalogOpen({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="outline"
            size="lg"
            h="12"
            w="full"
            px="8"
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="medium"
            color="gray.700"
            borderColor="gray.300"
            _dark={{ color: 'gray.200', borderColor: 'gray.600' }}
            rounded="full"
            onClick={onClick}
            _hover={{
                transform: 'translateY(-3px)',
                shadow: 'md',
                color: 'gray.900',
                _dark: { color: 'white' },
            }}
            transition="all 0.2s"
        >
            Open a post
        </Button>
    )
}

export function Browse({ effectsEnabled }: { effectsEnabled: boolean }) {
    const [issues, setIssues] = useState<Issue[] | null>(null)
    const [err, setErr] = useState('')
    const [url, setUrl] = useState('')
    const [asking, setAsking] = useState(false)

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
            .then((rows) => {
                if (!gone) setIssues(rows)
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

    function openUrl() {
        const parsed = parsePostUrl(url)
        if (!parsed) {
            setErr('Paste an X or Threads post.')
            return
        }
        setView({ view: 'issue', i: parsed.canonical })
    }

    const list = issues ?? []
    const loaded = issues !== null
    const empty = loaded && list.length === 0

    return (
        <AnimatePresence mode="wait">
            {asking ? (
                <MotionVStack key="ask" w="full" align="stretch" {...swap(effectsEnabled)}>
                    <Question
                        title="Which post?"
                        onNext={openUrl}
                        onBack={() => setAsking(false)}
                        nextLabel="Open"
                        effectsEnabled={effectsEnabled}
                    >
                        <BigInput
                            placeholder="https://x.com/…/status/…"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        {err ? (
                            <Text color="red.500" mt={3}>
                                {err}
                            </Text>
                        ) : null}
                    </Question>
                </MotionVStack>
            ) : (
                <MotionVStack
                    key="catalog"
                    gap={4}
                    align="stretch"
                    w="full"
                    maxW="720px"
                    mx="auto"
                    {...swap(effectsEnabled)}
                >
                    <MotionBox {...enter(effectsEnabled, 0.2)}>
                        <CatalogOpen onClick={() => setAsking(true)} />
                    </MotionBox>
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
                                        <IssueCard
                                            issue={issue}
                                            index={index}
                                            effectsEnabled={effectsEnabled}
                                        />
                                    </Box>
                                ))}
                            </MotionVStack>
                        ) : null}
                    </AnimatePresence>
                    {err && !asking ? (
                        <Text textAlign="center" color="red.500">
                            {err}
                        </Text>
                    ) : null}
                </MotionVStack>
            )}
        </AnimatePresence>
    )
}
