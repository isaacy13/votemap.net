'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BigButton } from './BigButton'

const Motion = motion(VStack)

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
        <Motion
            align="center"
            gap={0}
            textAlign="center"
            px={2}
            initial={effectsEnabled ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <Text
                as="h2"
                fontSize={{ base: '4xl', md: '6xl' }}
                fontWeight="bold"
                letterSpacing="-0.04em"
                lineHeight="1.05"
                color="gray.800"
                _dark={{ color: 'white' }}
                maxW="3xl"
            >
                {title}
            </Text>
            {hint ? (
                <Text mt={3} fontSize={{ base: 'lg', md: '2xl' }} color="gray.600" _dark={{ color: 'gray.300' }} maxW="xl">
                    {hint}
                </Text>
            ) : null}
            {(children || onNext || onBack) && (
                <VStack mt={8} gap={4} w="full" maxW="lg">
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
            )}
        </Motion>
    )
}
