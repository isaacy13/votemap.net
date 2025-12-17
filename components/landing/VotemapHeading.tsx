'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const VotemapHeading = ({ effectsEnabled = true }: { effectsEnabled?: boolean }) => {
    const { resolvedTheme } = useTheme()
    const [hasAnimated, setHasAnimated] = useState(false)
    const [sparks, setSparks] = useState<Array<{
        id: number
        x: number
        y: number
        tx: number
        ty: number
        delay: number
        scale: number
        duration: number
        color: string
    }>>([])

    useEffect(() => {
        const timer = setTimeout(() => setHasAnimated(true), 6500)

        let idCounter = 0
        const generateSparks = (count: number, xBase: number, xSpread: number, color: string, delayMax: number) =>
            Array.from({ length: count }).map(() => {
                const angle = Math.random() * Math.PI * 2
                const distance = 40 + Math.random() * 60
                return {
                    id: idCounter++,
                    x: xBase + (Math.random() - 0.5) * xSpread,
                    y: 90 + (Math.random() - 0.5) * 60,
                    tx: Math.cos(angle) * distance,
                    ty: Math.sin(angle) * distance,
                    delay: Math.random() * delayMax,
                    scale: Math.random() * 2 + 1,
                    duration: 2 + Math.random() * 2,
                    color
                }
            })

        setSparks([
            ...generateSparks(15, 250, 200, '#3b82f6', 25), // Blue (Left)
            ...generateSparks(40, 450, 300, '#8b5cf6', 20), // Purple (Middle)
            ...generateSparks(15, 650, 200, '#ef4444', 25), // Red (Right)
        ])

        return () => clearTimeout(timer)
    }, [])

    return (
        <Box h={{ base: '100px', md: '180px', lg: '220px' }} w="full" maxW="1200px" position="relative">
            <motion.svg
                width="100%"
                height="100%"
                viewBox="0 0 900 180"
                style={{ overflow: 'visible' }}
            >
                {effectsEnabled && sparks.map((spark) => (
                    <motion.circle
                        key={spark.id}
                        r={spark.scale}
                        fill={spark.color}
                        initial={{ opacity: 0, cx: spark.x, cy: spark.y }}
                        animate={{
                            opacity: [0, 0.6, 0],
                            cx: [spark.x, spark.x + spark.tx],
                            cy: [spark.y, spark.y + spark.ty],
                        }}
                        transition={{
                            duration: spark.duration,
                            repeat: Infinity,
                            delay: 6 + spark.delay,
                            ease: "easeOut"
                        }}
                        style={{ filter: 'blur(1px)' }}
                    />
                ))}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <motion.stop
                            initial={{ offset: "50%" }}
                            animate={{ offset: ["30%", "70%", "30%"] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            stopColor="#8b5cf6"
                        />
                        <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                </defs>
                {effectsEnabled && (
                    <motion.text
                        x="50%"
                        y="50%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        style={{
                            fontFamily: 'var(--font-geist-sans)',
                            fontWeight: 800,
                            fontSize: '140px',
                            letterSpacing: '-0.05em',
                            filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.4))'
                        }}
                        fill="url(#gradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 6, duration: 2 }}
                    >
                        votemap
                    </motion.text>
                )}
                <motion.text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    style={{
                        fontFamily: 'var(--font-geist-sans)',
                        fontWeight: 800,
                        fontSize: '140px',
                        letterSpacing: '-0.05em',
                    }}
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    initial={{
                        strokeDasharray: 3000,
                        strokeDashoffset: 3000,
                        opacity: 0,
                        strokeOpacity: 0.8,
                        fillOpacity: 0
                    }}
                    animate={{
                        strokeDashoffset: 0,
                        opacity: 1,
                        strokeOpacity: effectsEnabled ? (resolvedTheme === 'dark' ? 0.3 : 0.2) : 0.8,
                        fillOpacity: 0
                    }}
                    transition={{
                        strokeDashoffset: { duration: 6, ease: "easeInOut" },
                        strokeOpacity: { delay: hasAnimated ? 0 : 5, duration: 1.5 },
                        opacity: { duration: 0.5 }
                    }}
                >
                    votemap
                </motion.text>
            </motion.svg>
        </Box>
    )
}
