'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BigButton } from './BigButton'
import { enter } from './enter'

const MotionText = motion(Text)
const MotionBox = motion(Box)

export function Question({
    title,
    hint,
    children,
    onBack,
    onNext,
    nextLabel = 'Continue',
    nextDisabled,
    effectsEnabled = true,
}: {
    title: string
    hint?: string
    children?: ReactNode
    onBack?: () => void
    onNext?: () => void
    nextLabel?: string
    nextDisabled?: boolean
    effectsEnabled?: boolean
}) {
    return (
        <VStack gap={0} align="center" textAlign="center" w="full" px={2}>
            <MotionText
                as="h2"
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
                maxW="3xl"
                {...enter(effectsEnabled, 0.2)}
            >
                {title}
            </MotionText>
            {hint ? (
                <MotionText
                    as="p"
                    mt={2}
                    fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                    maxW="3xl"
                    {...enter(effectsEnabled, 0.4)}
                >
                    {hint}
                </MotionText>
            ) : null}
            {(children || onNext || onBack) && (
                <MotionBox mt={8} w="full" maxW="lg" {...enter(effectsEnabled, 0.6)}>
                    <VStack gap={4} w="full">
                        {children ? <Box w="full">{children}</Box> : null}
                        {onNext ? (
                            <BigButton onClick={onNext} disabled={nextDisabled}>
                                {nextLabel}
                            </BigButton>
                        ) : null}
                        {onBack ? (
                            <BigButton variant="ghost" onClick={onBack} minW="auto">
                                Back
                            </BigButton>
                        ) : null}
                    </VStack>
                </MotionBox>
            )}
        </VStack>
    )
}
