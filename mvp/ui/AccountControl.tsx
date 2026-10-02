'use client'

import { Link } from '@chakra-ui/react'

/** Quiet avatar-only control — no “Account” label, no person-chip. */
export function AccountControl({
    handle,
    photoUrl,
}: {
    handle?: string | null
    photoUrl?: string | null
}) {
    const signedIn = Boolean(handle)
    const initial = (handle || '').replace(/^@/, '').slice(0, 1).toUpperCase()

    return (
        <Link
            href={signedIn ? '/me' : '/signup'}
            aria-label={signedIn ? `Account @${handle}` : 'Account'}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="8"
            h="8"
            rounded="full"
            overflow="hidden"
            flexShrink={0}
            borderWidth="2px"
            fontSize="sm"
            fontWeight="bold"
            bg={signedIn ? 'gray.200' : 'white'}
            color="gray.900"
            borderColor="gray.900"
            boxShadow="0 0 0 1px #111"
            _dark={{
                bg: signedIn ? 'gray.200' : 'gray.800',
                color: signedIn ? 'gray.900' : 'white',
                borderColor: 'white',
                boxShadow: '0 0 0 1px #fff',
            }}
            _hover={{ opacity: 0.85, textDecoration: 'none' }}
        >
            {signedIn && photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" width={32} height={32} draggable={false} style={{ width: 32, height: 32, objectFit: 'cover' }} />
            ) : signedIn ? (
                initial
            ) : null}
        </Link>
    )
}
