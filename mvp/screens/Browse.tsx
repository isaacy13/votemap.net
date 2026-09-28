'use client'

import { Flex, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { listIssues, type Issue } from '../chain'
import { parsePostUrl } from '../urls'
import { setView } from '../session'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { IssueCard } from '../ui/IssueCard'
import { Question } from '../ui/Question'
import { enter } from '../ui/enter'

const MotionText = motion(Text)
const MotionFlex = motion(Flex)

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

    if (asking) {
        return (
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
                {err ? <Text color="red.500" mt={3}>{err}</Text> : null}
            </Question>
        )
    }

    const list = issues ?? []
    const loaded = issues !== null
    const empty = loaded && list.length === 0

    return (
        <VStack gap={10} align="stretch" w="full" maxW="720px" mx="auto">
            <MotionFlex justify="center" w="full" {...enter(effectsEnabled, 0.15)}>
                <BigButton onClick={() => setAsking(true)}>Open a post</BigButton>
            </MotionFlex>
            {empty ? (
                <MotionText
                    textAlign="center"
                    fontSize={{ base: 'xl', md: '2xl' }}
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    {...enter(effectsEnabled, 0.35)}
                >
                    No issues yet
                </MotionText>
            ) : (
                <VStack gap={4} align="stretch" w="full">
                    {list.map((issue, index) => (
                        <IssueCard key={issue.id} issue={issue} index={index} effectsEnabled={effectsEnabled} />
                    ))}
                </VStack>
            )}
            {err && !asking ? (
                <Text textAlign="center" color="red.500">
                    {err}
                </Text>
            ) : null}
        </VStack>
    )
}
