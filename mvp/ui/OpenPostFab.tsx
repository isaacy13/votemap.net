'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import styles from './fab.module.css'

export function OpenPostFab({ effectsEnabled }: { effectsEnabled: boolean }) {
    const router = useRouter()
    return (
        <motion.button
            type="button"
            className={styles.fab}
            aria-label="Open post"
            layoutId={effectsEnabled ? 'open-post' : undefined}
            onClick={() => router.push('/browse/open')}
            initial={effectsEnabled ? { opacity: 0, y: 24, scale: 0.92 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={effectsEnabled ? { y: -4, scale: 1.03 } : undefined}
            whileTap={effectsEnabled ? { scale: 0.96 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
            <svg className={styles.plus} viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M11 5h2v14h-2z" />
                <path fill="currentColor" d="M5 11h14v2H5z" />
            </svg>
            Open post
        </motion.button>
    )
}
