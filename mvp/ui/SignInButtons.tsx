'use client'

import { Button, Flex } from '@chakra-ui/react'
import type { CSSProperties, ReactNode } from 'react'
import { Roboto } from 'next/font/google'
import { catalogPill, catalogPillHover } from './catalogPill'

/** Google Sans Medium fallback — pill size still matches Browse, not the 40px GIS widget. */
const roboto = Roboto({ weight: '500', subsets: ['latin'], display: 'swap' })

function AppleMark() {
    return (
        <svg
            viewBox="0 0 14 17"
            width="15"
            height="18"
            aria-hidden="true"
            style={{ display: 'block' }}
        >
            <path
                fill="currentColor"
                d="M10.87 8.63c.02 2.14 1.88 2.85 1.9 2.86-.02.05-.3 1.02-.98 2.02-.59.86-1.2 1.72-2.16 1.74-.95.02-1.25-.56-2.34-.56-1.09 0-1.42.54-2.32.58-.93.04-1.64-.93-2.24-1.79C1.5 11.7.37 8.4 1.6 6.16c.61-1.11 1.7-1.81 2.89-1.83.9-.02 1.75.61 2.34.61.58 0 1.67-.75 2.81-.64.48.02 1.82.19 2.68 1.46-.07.04-1.6.93-1.45 2.87zM8.9 2.92c.49-.59.82-1.41.73-2.23-.7.03-1.56.47-2.06 1.06-.45.52-.85 1.37-.74 2.17.79.06 1.59-.4 2.07-1z"
            />
        </svg>
    )
}

/** Same 24×24 cell on both pills so the marks share a left inset and sit on the label midline. */
function Mark({ children }: { children: ReactNode }) {
    return (
        <Flex w="6" h="6" align="center" justify="center" flexShrink={0} aria-hidden>
            {children}
        </Flex>
    )
}

const fill: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '100%',
}

export function SignInButtons({
    googleHref,
    appleHref,
}: {
    googleHref: string
    appleHref: string
}) {
    return (
        <Flex direction="column" gap="3" w="full">
            <Button
                asChild
                {...catalogPill}
                className={roboto.className}
                justifyContent="flex-start"
                bg="#FFFFFF"
                color="#1F1F1F"
                borderColor="#747775"
                _hover={catalogPillHover}
                _dark={{ bg: '#131314', color: '#E3E3E3', borderColor: '#8E918F' }}
            >
                <a href={googleHref} style={fill}>
                    <Flex align="center" gap="3">
                        <Mark>
                            {/* Official 4-color G — img so dark color-scheme cannot recolor the mark. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/gsi/google.svg"
                                alt=""
                                width={24}
                                height={24}
                                draggable={false}
                                style={{ display: 'block', width: 24, height: 24, colorScheme: 'only light' }}
                            />
                        </Mark>
                        Sign in with Google
                    </Flex>
                </a>
            </Button>
            <Button
                asChild
                {...catalogPill}
                justifyContent="flex-start"
                bg="#000000"
                color="#FFFFFF"
                borderColor="#000000"
                fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
                _hover={catalogPillHover}
                _dark={{ bg: '#FFFFFF', color: '#000000', borderColor: '#FFFFFF' }}
            >
                <a href={appleHref} style={fill}>
                    <Flex align="center" gap="3">
                        <Mark>
                            <AppleMark />
                        </Mark>
                        Sign in with Apple
                    </Flex>
                </a>
            </Button>
        </Flex>
    )
}
