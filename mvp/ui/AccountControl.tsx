'use client'

import { Flex, Link, Text } from '@chakra-ui/react'
import { FaUser } from 'react-icons/fa'
import { setView } from '../session'

/** One quiet account control — avatar when signed in, not a header nav pile. */
export function AccountControl({
    handle,
    signedOutLabel = false,
}: {
    handle?: string | null
    /** Inner signed-out: a small Account link. Home signed-out uses GIS/Apple instead. */
    signedOutLabel?: boolean
}) {
    const signedIn = Boolean(handle)
    if (!signedIn && !signedOutLabel) return null

    const initial = (handle || 'A').replace(/^@/, '').slice(0, 1).toUpperCase()

    return (
        <Link
            href={signedIn ? '/mvp?view=me' : '/mvp?view=signup'}
            aria-label={signedIn ? `Account @${handle}` : 'Account'}
            display="inline-flex"
            alignItems="center"
            gap={2}
            rounded="full"
            pr={signedIn ? { base: 1, md: 3 } : 3}
            pl={1}
            py={1}
            color="gray.600"
            _dark={{ color: 'gray.300' }}
            _hover={{ opacity: 0.8, textDecoration: 'none' }}
            onClick={(e) => {
                e.preventDefault()
                setView({ view: signedIn ? 'me' : 'signup', i: null })
            }}
        >
            <Flex
                w="8"
                h="8"
                rounded="full"
                align="center"
                justify="center"
                bg="gray.200"
                color="gray.700"
                fontSize="sm"
                fontWeight="bold"
                flexShrink={0}
                _dark={{ bg: 'gray.700', color: 'gray.200' }}
            >
                {signedIn ? initial : <FaUser size={12} />}
            </Flex>
            {signedIn ? (
                <Text fontSize="sm" fontWeight="medium" display={{ base: 'none', md: 'block' }}>
                    @{handle}
                </Text>
            ) : (
                <Text fontSize="sm" fontWeight="medium">
                    Account
                </Text>
            )}
        </Link>
    )
}
