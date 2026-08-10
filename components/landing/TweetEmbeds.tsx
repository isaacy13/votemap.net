'use client'

import { Box, Stack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ExpandedTweet } from '@/components/landing/ExpandedTweet'
import 'react-tweet/theme.css'

const MotionBox = motion(Box)

/**
 * Narrative order (chronological story arc):
 * 1. Problem / ambition — billionaires control the game; want in
 * 2. Vision — tech democratized fame & riches, not yet power
 */
const TWEET_IDS = [
    '2024186960454021466',
    '2086102002241540162',
] as const

interface TweetEmbedsProps {
    effectsEnabled?: boolean
}

export const TweetEmbeds = ({ effectsEnabled = true }: TweetEmbedsProps) => {
    return (
        <Stack
            as="section"
            aria-label="From the founder"
            w="full"
            maxW={{ base: '100%', sm: '550px', md: '560px' }}
            mx="auto"
            gap={{ base: 4, md: 5 }}
            px={{ base: 0, sm: 1 }}
            textAlign="start"
        >
            {TWEET_IDS.map((id, index) => (
                <MotionBox
                    key={id}
                    w="full"
                    initial={effectsEnabled ? { opacity: 0, y: 28, scale: 0.98 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                        effectsEnabled
                            ? {
                                  duration: 0.7,
                                  delay: 1.0 + index * 0.18,
                                  ease: [0.22, 1, 0.36, 1],
                              }
                            : { duration: 0 }
                    }
                    whileHover={
                        effectsEnabled
                            ? { y: -3, transition: { duration: 0.25 } }
                            : undefined
                    }
                    css={{
                        // Let our Stack gap own vertical rhythm
                        '& .react-tweet-theme': {
                            '--tweet-container-margin': '0',
                            margin: 0,
                            width: '100%',
                            maxWidth: '100%',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            transition: effectsEnabled
                                ? 'box-shadow 0.3s ease, border-color 0.3s ease'
                                : undefined,
                        },
                        '&:hover .react-tweet-theme': effectsEnabled
                            ? {
                                  boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.18)',
                              }
                            : undefined,
                        // Dark mode hover shadow
                        '.dark &:hover .react-tweet-theme': effectsEnabled
                            ? {
                                  boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.55)',
                              }
                            : undefined,
                    }}
                >
                    <ExpandedTweet id={id} />
                </MotionBox>
            ))}
        </Stack>
    )
}
