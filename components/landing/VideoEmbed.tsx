'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

export const VideoEmbed = ({ effectsEnabled = true }: { effectsEnabled?: boolean }) => {
    return (
        <MotionBox
            w="full"
            maxW="720px"
            mx="auto"
            initial={effectsEnabled ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={effectsEnabled ? { duration: 0.8, delay: 0.8, ease: 'easeOut' } : { duration: 0 }}
        >
            <Box
                position="relative"
                w="full"
                overflow="hidden"
                rounded="2xl"
                shadow="2xl"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
                css={{
                    aspectRatio: '16 / 9',
                }}
            >
                <iframe
                    src="https://www.youtube-nocookie.com/embed/FsibeD8Ygfk"
                    title="votemap introduction video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                />
            </Box>
        </MotionBox>
    )
}
