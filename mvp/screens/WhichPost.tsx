'use client'

import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '../api'
import { apiUrl } from '../config'
import { enter } from '../ui/enter'
import { BigInput } from '../ui/BigInput'
import { ThumbAction } from '../ui/ThumbAction'
import { isKeyedPost, isTikTokShort, issuePath, parsePostUrl } from '../urls'

const MotionText = motion(Text)
const MotionBox = motion(Box)

const NETWORKS = ['X', 'Instagram', 'TikTok', 'Threads'] as const

export function WhichPost({ effectsEnabled }: { effectsEnabled: boolean }) {
    const router = useRouter()
    const [url, setUrl] = useState('')
    const [err, setErr] = useState('')
    const [busy, setBusy] = useState(false)

    async function open() {
        setErr('')
        const parsed = parsePostUrl(url)
        if (!parsed) {
            setErr('Paste an X, Instagram, TikTok, or Threads post.')
            return
        }
        setBusy(true)
        try {
            if (isTikTokShort(parsed)) {
                const base = apiUrl()
                if (!base) {
                    setErr('Short TikTok links need the account API.')
                    return
                }
                const out = await api<{ canonical: string }>(`/posts/canonical?url=${encodeURIComponent(url)}`)
                router.push(issuePath(out.canonical))
                return
            }
            if (!isKeyedPost(parsed)) {
                setErr('Paste an X, Instagram, TikTok, or Threads post.')
                return
            }
            router.push(issuePath(parsed.canonical))
        } catch (e) {
            setErr(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not open that post.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <VStack gap={0} align="center" textAlign="center" w="full" px={2} data-shot="which-post">
            <MotionText
                as="h2"
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
                maxW="3xl"
                {...enter(effectsEnabled, 0.15)}
            >
                Which post?
            </MotionText>
            <MotionBox mt={8} w="full" maxW="lg" {...enter(effectsEnabled, 0.35)}>
                <BigInput
                    placeholder="https://x.com/…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    inputMode="url"
                />
                <Flex wrap="wrap" justify="center" gap={2} mt={4} aria-label="Networks">
                    {NETWORKS.map((n) => (
                        <Text
                            key={n}
                            as="span"
                            px={3}
                            py={1}
                            rounded="full"
                            fontSize="sm"
                            fontWeight="medium"
                            borderWidth="1px"
                            borderColor="gray.200"
                            color="gray.700"
                            _dark={{ borderColor: 'gray.600', color: 'gray.200' }}
                        >
                            {n}
                        </Text>
                    ))}
                </Flex>
                <Text mt={3} fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
                    Any Instagram URL — posts and Reels.
                </Text>
                {err ? (
                    <Text color="red.500" mt={3}>
                        {err}
                    </Text>
                ) : null}
            </MotionBox>
            <ThumbAction onClick={() => void open()} disabled={busy} effectsEnabled={effectsEnabled}>
                Open
            </ThumbAction>
        </VStack>
    )
}
