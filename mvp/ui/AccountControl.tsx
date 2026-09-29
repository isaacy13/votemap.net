'use client'

import { Link } from '@chakra-ui/react'
import { setView } from '../session'

/** Quiet avatar-only control — no “Account” label, no header junk. */
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
            href={signedIn ? '/mvp?view=me' : '/mvp?view=signup'}
            aria-label={signedIn ? `Account @${handle}` : 'Account'}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="8"
            h="8"
            rounded="full"
            overflow="hidden"
            flexShrink={0}
            bg={signedIn ? 'gray.200' : 'transparent'}
            color="gray.700"
            borderWidth="1px"
            borderColor="gray.300"
            fontSize="sm"
            fontWeight="bold"
            _dark={{
                bg: signedIn ? 'gray.700' : 'transparent',
                color: 'gray.200',
                borderColor: 'gray.600',
            }}
            _hover={{ opacity: 0.8, textDecoration: 'none' }}
            onClick={(e) => {
                e.preventDefault()
                setView({ view: signedIn ? 'me' : 'signup', i: null })
            }}
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
