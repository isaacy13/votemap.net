'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import styles from './sign-in-buttons.module.css'

const emptySubscribe = () => () => {}

/** Official 4-color G on a white tile — required for GIS light and outline_dark. */
function GoogleG() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="48" height="48" fill="#FFFFFF" />
            <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
        </svg>
    )
}

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
                <span className={styles.icon}>
                    <GoogleG />
                </span>
                <span className={styles.contents}>Sign in with Google</span>
            </a>
            <a className={`${styles.apple} ${dark ? styles.appleDark : ''}`} href={appleHref}>
                <AppleMark />
                Sign in with Apple
            </a>
        </div>
    )
}
