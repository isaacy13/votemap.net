'use client'

import { Box, Link, Text } from '@chakra-ui/react'
import { ExpandedTweet } from '@/components/landing/ExpandedTweet'
import 'react-tweet/theme.css'
import type { ParsedPost } from '../urls'

export function PostEmbed({ parsed, url }: { parsed: ParsedPost | null; url: string }) {
    if (parsed?.network === 'x') {
        return (
            <Box w="full" maxW="720px" mx="auto" css={{ '& .react-tweet-theme': { width: '100%', maxWidth: '100%', margin: 0 } }}>
                <ExpandedTweet id={parsed.postId} />
            </Box>
        )
    }
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
                {parsed?.network === 'threads' ? 'Threads' : 'Post'}
            </Text>
            <Link href={url} target="_blank" rel="noopener noreferrer" fontSize={{ base: 'lg', md: '2xl' }} fontWeight="medium" wordBreak="break-all">
                {url}
            </Link>
        </Box>
    )
}
