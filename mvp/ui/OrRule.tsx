'use client'

import { Box, Flex, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { landingEase } from './enter'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)
const MotionText = motion(Text)

/** Landing-style “or” rule — not a raw hr. */
export function OrRule({ effectsEnabled }: { effectsEnabled: boolean }) {
    const line = (origin: 'left' | 'right') =>
        effectsEnabled
            ? {
                  initial: { scaleX: 0, opacity: 0 },
                  animate: { scaleX: 1, opacity: 1 },
                  transition: { duration: 0.8, delay: 0.12, ease: landingEase },
                  style: { transformOrigin: origin === 'left' ? 'right center' : 'left center' },
              }
            : { initial: false as const }

    return (
        <MotionFlex
            w="full"
            align="center"
            gap={4}
            role="separator"
            aria-label="or"
            {...(effectsEnabled
                ? {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.7, ease: landingEase },
                  }
                : { initial: false as const })}
        >
            <MotionBox
                flex="1"
                h="2px"
                minW="32px"
                rounded="full"
                bg="gray.300"
                _dark={{ bg: 'gray.600' }}
                {...line('left')}
            />
            <MotionText
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                letterSpacing="0.12em"
                flexShrink={0}
                {...(effectsEnabled
                    ? {
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' as const },
                      }
                    : { initial: false as const })}
            >
                or
            </MotionText>
            <MotionBox
                flex="1"
                h="2px"
                minW="32px"
                rounded="full"
                bg="gray.300"
                _dark={{ bg: 'gray.600' }}
                {...line('right')}
            />
        </MotionFlex>
    )
}
