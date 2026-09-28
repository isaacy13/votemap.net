'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import styles from './sign-in-buttons.module.css'

const emptySubscribe = () => () => {}

function AppleMark() {
    return (
        <svg viewBox="0 0 14 17" aria-hidden="true">
            <path d="M10.87 8.63c.02 2.14 1.88 2.85 1.9 2.86-.02.05-.3 1.02-.98 2.02-.59.86-1.2 1.72-2.16 1.74-.95.02-1.25-.56-2.34-.56-1.09 0-1.42.54-2.32.58-.93.04-1.64-.93-2.24-1.79C1.5 11.7.37 8.4 1.6 6.16c.61-1.11 1.7-1.81 2.89-1.83.9-.02 1.75.61 2.34.61.58 0 1.67-.75 2.81-.64.48.02 1.82.19 2.68 1.46-.07.04-1.6.93-1.45 2.87zM8.9 2.92c.49-.59.82-1.41.73-2.23-.7.03-1.56.47-2.06 1.06-.45.52-.85 1.37-.74 2.17.79.06 1.59-.4 2.07-1z" />
        </svg>
    )
}

export function SignInButtons({
    googleHref,
    appleHref,
}: {
    googleHref: string
    appleHref: string
}) {
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
    const { resolvedTheme } = useTheme()
    const dark = mounted && resolvedTheme === 'dark'

    return (
        <div className={styles.wrap}>
            <a className={`${styles.gsi} ${dark ? styles.gsiDark : ''}`} href={googleHref}>
                <div className={styles.state} />
                <div className={styles.contentWrapper}>
                    <div className={styles.icon}>
                        {/* Official 4-color G as an image so dark `color-scheme` cannot recolor the mark. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/gsi/google.svg" alt="" width={20} height={20} draggable={false} />
                    </div>
                    <span className={styles.contents}>Sign in with Google</span>
                    <span className={styles.contentsHidden}>Sign in with Google</span>
                </div>
            </a>
            <a className={`${styles.apple} ${dark ? styles.appleDark : ''}`} href={appleHref}>
                <AppleMark />
                Sign in with Apple
            </a>
        </div>
    )
}
