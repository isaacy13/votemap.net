'use client'

import { Box, Link, Text } from '@chakra-ui/react'
import { ExpandedTweet } from '@/components/landing/ExpandedTweet'
import 'react-tweet/theme.css'
import { formatPostedAt, postedAtMs, type ParsedPost } from '../urls'
import { snapFromUrl } from '../postSnap'

export function PostEmbed({ parsed, url }: { parsed: ParsedPost | null; url: string }) {
    if (parsed?.network === 'x' && parsed.canonical) {
        return (
            <Box w="full" maxW="720px" mx="auto" css={{ '& .react-tweet-theme': { width: '100%', maxWidth: '100%', margin: 0 } }}>
                <ExpandedTweet id={parsed.postId} />
            </Box>
        )
    }
    const snap = snapFromUrl(url, parsed)
    const date = snap.date || formatPostedAt(postedAtMs(parsed, url))
    const label =
        parsed?.network === 'threads'
            ? 'Threads'
            : parsed?.network === 'instagram'
              ? 'Instagram'
              : parsed?.network === 'tiktok'
                ? 'TikTok'
                : 'Post'
    return (
        <Box
            w="full"
            maxW="720px"
            mx="auto"
            p={{ base: 6, md: 10 }}
            rounded="2xl"
            borderWidth="1px"
            borderColor="gray.200"
            _dark={{ borderColor: 'gray.700' }}
            textAlign="left"
        >
            <Text fontSize="sm" color="gray.500" mb={2}>
                {label}
                {snap.handle ? ` · ${snap.handle}` : ''}
                {date ? ` · ${date}` : ''}
            </Text>
            {snap.text ? (
                <Text mb={3} whiteSpace="pre-wrap" fontSize={{ base: 'md', md: 'lg' }}>
                    {snap.text}
                </Text>
            ) : null}
            <Link href={url} target="_blank" rel="noopener noreferrer" fontSize={{ base: 'lg', md: '2xl' }} fontWeight="medium" wordBreak="break-all">
                {url}
            </Link>
        </Box>
    )
}
