'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const VotemapHeading = () => {
    const { resolvedTheme } = useTheme()
    const [hasAnimated, setHasAnimated] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setHasAnimated(true), 6000)
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
                        strokeOpacity: resolvedTheme === 'dark' ? 0.3 : 0.2,
                        fillOpacity: 0.05
                    }}
                    transition={{
                        strokeDashoffset: { duration: 7, ease: "easeInOut" },
                        strokeOpacity: { delay: hasAnimated ? 0 : 6, duration: 1.5 },
                        fillOpacity: { delay: hasAnimated ? 0 : 6, duration: 1.5 },
                        opacity: { duration: 0.5 }
                    }}
                >
                    votemap
                </motion.text>
            </motion.svg>
        </Box>
    )
}
