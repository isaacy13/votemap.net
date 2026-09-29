'use client'

import { Boot, useProduct } from './product'
import { Shell } from './ui/Shell'
import { Question } from './ui/Question'
import { missingEnv } from './config'
import type { ReactNode } from 'react'

export function ProductFrame({
    children,
    backHref,
    foldFooter = false,
    needChain = false,
}: {
    children: ReactNode
    backHref?: string
    foldFooter?: boolean
    needChain?: boolean
}) {
    const { ready, user, effectsEnabled, toggleEffects } = useProduct()
    if (!ready) return <Boot />
    const missing = needChain ? missingEnv() : null
    return (
        <Shell
            handle={user?.handle}
            effectsEnabled={effectsEnabled}
            toggleEffects={toggleEffects}
            backHref={backHref}
            foldFooter={foldFooter}
        >
            {missing ? <Question title="Set the chain env." hint={missing} effectsEnabled={effectsEnabled} /> : children}
        </Shell>
    )
}
