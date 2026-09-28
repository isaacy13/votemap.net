'use client'

import { Text, Stack, Button } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { FaGithub } from 'react-icons/fa'

const MotionText = motion(Text)
const MotionStack = motion(Stack)

export const HeroContent = ({
    effectsEnabled = true,
    actions,
}: {
    effectsEnabled?: boolean
    actions?: ReactNode
}) => {
    const enter = (delay: number) =>
        effectsEnabled
            ? {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
              }
            : { initial: false as const }

    return (
        <>
            <MotionText
                as="h2"
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
                mt={{ base: -2, md: -4, lg: -8 }}
                {...enter(0.2)}
            >
                democratize everything
            </MotionText>

            <MotionText
                as="p"
                fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                color="gray.600"
                _dark={{ color: 'gray.300' }}
                maxW="3xl"
                {...enter(0.4)}
            >
                vote for the future you want to see
            </MotionText>

            <MotionStack
                direction={actions ? 'column' : { base: 'column', md: 'row' }}
                gap={6}
                mt={8}
                align="center"
                w={actions ? 'full' : undefined}
                {...enter(0.6)}
            >
                {actions ?? (
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
                )}
            </MotionStack>
        </>
    )
}
