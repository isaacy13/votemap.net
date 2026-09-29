'use client'

import { Roboto } from 'next/font/google'
import type { MouseEventHandler, ReactNode } from 'react'
import styles from './pill.module.css'

const roboto = Roboto({ weight: '500', subsets: ['latin'], display: 'swap' })

function AppleMark() {
    return (
        <svg viewBox="0 0 14 17" aria-hidden="true">
            <path d="M10.87 8.63c.02 2.14 1.88 2.85 1.9 2.86-.02.05-.3 1.02-.98 2.02-.59.86-1.2 1.72-2.16 1.74-.95.02-1.25-.56-2.34-.56-1.09 0-1.42.54-2.32.58-.93.04-1.64-.93-2.24-1.79C1.5 11.7.37 8.4 1.6 6.16c.61-1.11 1.7-1.81 2.89-1.83.9-.02 1.75.61 2.34.61.58 0 1.67-.75 2.81-.64.48.02 1.82.19 2.68 1.46-.07.04-1.6.93-1.45 2.87zM8.9 2.92c.49-.59.82-1.41.73-2.23-.7.03-1.56.47-2.06 1.06-.45.52-.85 1.37-.74 2.17.79.06 1.59-.4 2.07-1z" />
        </svg>
    )
}

function Mark({ children }: { children: ReactNode }) {
    return <span className={styles.mark}>{children}</span>
}

/** Native 48×9999 pill — same class on Google, Apple, and Browse. */
export function Pill({
    href,
    className,
    children,
    onClick,
}: {
    href?: string
    className: string
    children: ReactNode
    onClick?: MouseEventHandler<HTMLButtonElement>
}) {
    const cls = `${styles.pill} ${className}`
    if (href) {
        return (
            <a href={href} className={cls}>
                {children}
            </a>
        )
    }
    return (
        <button type="button" className={cls} onClick={onClick}>
            {children}
        </button>
    )
}

export function SignInButtons({
    googleHref,
    appleHref,
}: {
    googleHref: string
    appleHref: string
}) {
    return (
        <div className={styles.stack}>
            <Pill href={googleHref} className={`${styles.google} ${roboto.className}`}>
                <span className={styles.row} data-pill-row>
                    <Mark>
                        {/* Official 4-color G — img so dark color-scheme cannot recolor the mark. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/gsi/google.svg" alt="" width={24} height={24} draggable={false} />
                    </Mark>
                    Sign in with Google
                </span>
            </Pill>
            <Pill href={appleHref} className={styles.apple}>
                <span className={styles.row} data-pill-row>
                    <Mark>
                        <AppleMark />
                    </Mark>
                    Sign in with Apple
                </span>
            </Pill>
        </div>
    )
}

export function BrowsePill({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
    return (
        <Pill href={href} className={styles.browse} onClick={onClick}>
            {children}
        </Pill>
    )
}
