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

    return (
        <VStack gap={0} align="stretch">
            <VStack gap={0} textAlign="center">
                <Text fontSize={{ base: '4xl', md: '6xl' }} fontWeight="bold" letterSpacing="-0.04em" color="gray.800" _dark={{ color: 'white' }}>
                    stake on a post
                </Text>
                <Box mt={8}>
                    <BigButton onClick={() => setAsking(true)}>Stake on a post</BigButton>
                </Box>
            </VStack>
            {issues && issues.length > 0 ? (
                <Stack gap={4} maxW="720px" mx="auto" w="full" mt={16}>
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
                                {formatUsdc(issue.live)} USDC
                            </Text>
                        </Box>
                    ))}
                </Stack>
            ) : (
                <Text mt={8} textAlign="center" color="gray.500">
                    No pots yet.
                </Text>
            )}
            {err && !asking ? (
                <Text mt={4} textAlign="center" color="red.500">
                    {err}
                </Text>
            ) : null}
        </VStack>
    )
}
