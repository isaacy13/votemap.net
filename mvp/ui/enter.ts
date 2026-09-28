import type { MotionProps } from 'framer-motion'

export function enter(effectsEnabled: boolean, delay = 0): Pick<MotionProps, 'initial' | 'animate' | 'transition'> {
    if (!effectsEnabled) return { initial: false }
    return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay, ease: 'easeOut' },
    }
}
