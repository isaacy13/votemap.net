'use client'

import { Text, Stack, Button } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'

const MotionText = motion(Text)
const MotionStack = motion(Stack)

export const HeroContent = () => {
    return (
        <>
            <MotionText
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
                mt={{ base: -2, md: -4, lg: -8 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                democratize everything
            </MotionText>

            <MotionText
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
                maxW="3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
                vote for the future you want to see
            </MotionText>

            <MotionStack
                direction={{ base: 'column', md: 'row' }}
                gap={6}
                mt={8}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            >
                <Button
                    asChild
                    size="2xl"
                    h="16"
                    px="10"
                    fontSize="xl"
                    colorPalette="gray"
                    variant="surface"
                    rounded="full"
                    _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                    transition="all 0.2s"
                >
                    <a href="https://github.com/isaacy13/votemap.net" target="_blank" rel="noopener noreferrer">
                        <FaGithub /> Build Now
                    </a>
                </Button>
            </MotionStack>
        </>
    )
}
