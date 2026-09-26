'use client'

import { Box, Stack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { formatUsdc } from '../config'
import { listIssues, type Issue } from '../chain'
import { parsePostUrl } from '../urls'
import { setView } from '../session'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { Question } from '../ui/Question'

export function Browse({ effectsEnabled }: { effectsEnabled: boolean }) {
    const [issues, setIssues] = useState<Issue[] | null>(null)
    const [err, setErr] = useState('')
    const [url, setUrl] = useState('')
    const [asking, setAsking] = useState(false)

    useEffect(() => {
        listIssues()
            .then(setIssues)
            .catch((e: Error) => setErr(e.message))
    }, [])

    function openUrl() {
        const parsed = parsePostUrl(url)
        if (!parsed) {
            setErr('Paste an x.com or Threads post URL.')
            return
        }
        setView({ view: 'issue', i: parsed.canonical })
    }

    if (asking) {
        return (
            <Question
                title="Which post?"
                hint="x.com or Threads. Nothing else."
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

    return (
        <VStack gap={12} align="stretch">
            <VStack gap={4} textAlign="center">
                <Text fontSize={{ base: '4xl', md: '6xl' }} fontWeight="bold" letterSpacing="-0.04em" color="gray.800" _dark={{ color: 'white' }}>
                    stake on a post
                </Text>
                <Text fontSize={{ base: 'lg', md: '2xl' }} color="gray.600" _dark={{ color: 'gray.300' }} maxW="2xl">
                    Live bounty is unexpired USDC, rolled up by the country snapped on each line. Web is readonly — stake from the phone app.
                </Text>
                <BigButton onClick={() => setAsking(true)}>Open a post</BigButton>
            </VStack>
            {issues && issues.length > 0 ? (
                <Stack gap={4} maxW="720px" mx="auto" w="full">
                    {issues.map((issue) => (
                        <Box
                            key={issue.id}
                            as="button"
                            textAlign="left"
                            p={{ base: 5, md: 8 }}
                            rounded="2xl"
                            borderWidth="1px"
                            borderColor="gray.200"
                            _dark={{ borderColor: 'gray.700' }}
                            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                            transition="all 0.2s"
                            onClick={() => setView({ view: 'issue', i: issue.url })}
                        >
                            <Text fontSize="sm" color="gray.500" mb={1}>
                                {issue.parsed?.network === 'threads' ? 'Threads' : 'X'}
                            </Text>
                            <Text fontWeight="medium" wordBreak="break-all">
                                {issue.url}
                            </Text>
                            <Text mt={3} fontSize="2xl" fontWeight="bold">
                                {formatUsdc(issue.live)} USDC live
                            </Text>
                        </Box>
                    ))}
                </Stack>
            ) : (
                <Text textAlign="center" color="gray.500">
                    No pots yet. First stake on a URL creates it.
                </Text>
            )}
        </VStack>
    )
}
