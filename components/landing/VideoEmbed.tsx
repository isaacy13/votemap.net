'use client'

import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

export const VideoEmbed = () => {
    return (
        <MotionBox
            w="full"
            maxW="720px"
            mx="auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
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
