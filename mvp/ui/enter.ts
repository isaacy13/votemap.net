import type { MotionProps } from 'framer-motion'

/** Same ease as landing tweet cards. */
export const landingEase = [0.22, 1, 0.36, 1] as const

export function enter(effectsEnabled: boolean, delay = 0): Pick<MotionProps, 'initial' | 'animate' | 'transition'> {
    if (!effectsEnabled) return { initial: false }
    return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay, ease: 'easeOut' },
    }
}

/** Staggered catalog enter — matches landing TweetEmbeds, capped so a long list does not wait. */
export function listEnter(effectsEnabled: boolean, index: number): Pick<MotionProps, 'initial' | 'animate' | 'transition'> {
    if (!effectsEnabled) return { initial: false }
    return {
        initial: { opacity: 0, y: 28, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: {
            duration: 0.7,
            delay: 0.35 + Math.min(index, 5) * 0.18,
            ease: landingEase,
        },
    }
}

/** Catalog ↔ empty ↔ “Which post?” page swap. */
export function swap(effectsEnabled: boolean): Pick<MotionProps, 'initial' | 'animate' | 'exit' | 'transition'> {
    if (!effectsEnabled) return { initial: false }
    return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
        transition: { duration: 0.45, ease: landingEase },
    }
}
