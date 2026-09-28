'use client'

import { Box, Flex, Stack, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatUsdc } from '../config'
import { listIssues, type Issue } from '../chain'
import { parsePostUrl } from '../urls'
import { setView } from '../session'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { Question } from '../ui/Question'
import { enter } from '../ui/enter'

const MotionStack = motion(Stack)

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

    const pots = issues && issues.length > 0

    return (
        <VStack gap={16} align="stretch" w="full">
            <Question title="democratize everything" effectsEnabled={effectsEnabled}>
                <Flex justify="center" w="full">
                    <BigButton onClick={() => setAsking(true)}>Open a post</BigButton>
                </Flex>
            </Question>
            {pots ? (
                <MotionStack gap={4} maxW="720px" mx="auto" w="full" {...enter(effectsEnabled, 0.6)}>
                    {issues!.map((issue) => (
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
                </MotionStack>
            ) : null}
            {err && !asking ? (
                <Text textAlign="center" color="red.500">
                    {err}
                </Text>
            ) : null}
        </VStack>
    )
}
