'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BigButton } from './BigButton'
import styles from './fab.module.css'

export function ThumbAction({
    children,
    onClick,
    disabled,
    effectsEnabled,
}: {
    children: ReactNode
    onClick: () => void
    disabled?: boolean
    effectsEnabled: boolean
}) {
    return (
        <div className={styles.thumb}>
            <motion.div
                className={styles.thumbInner}
                layoutId={effectsEnabled ? 'open-post' : undefined}
                initial={effectsEnabled ? { opacity: 0, y: 28 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
                <BigButton w="full" onClick={onClick} disabled={disabled}>
                    {children}
                </BigButton>
            </motion.div>
        </div>
    )
}
