'use client'

import { Flex, Link, Text, IconButton } from '@chakra-ui/react'
import { FaMoon, FaSun, FaMagic } from 'react-icons/fa'
import { useTheme } from 'next-themes'

interface FooterProps {
    effectsEnabled?: boolean
    toggleEffects?: () => void
}

export const Footer = ({ effectsEnabled = true, toggleEffects }: FooterProps) => {
    const { resolvedTheme, setTheme } = useTheme()

    const toggleColorMode = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
    }

    return (
        <Flex
            as="footer"
            direction={{ base: 'column', md: 'row' }}
            justify="center"
            align="center"
            mt="auto"
            py={{ base: 6, md: 12 }}
            gap={{ base: 4, md: 8 }}
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            fontSize="md"
        >
            <Link href="mailto:support@votemap.net" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
                support@votemap.net
            </Link>
            <Text display={{ base: 'none', md: 'block' }}>•</Text>
            <Text>
                Built by{' '}
                <Link href="https://onexengineering.com" target="_blank" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
                    onexengineering
                </Link>
            </Text>
            <Text display={{ base: 'none', md: 'block' }}>•</Text>
            <Link href="https://x.com/isaac_yeang" target="_blank" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
                @isaac_yeang
            </Link>
            <Text display={{ base: 'none', md: 'block' }}>•</Text>
            <Flex gap={2}>
                {toggleEffects && (
                    <IconButton
                        aria-label="Toggle effects"
                        onClick={toggleEffects}
                        variant="ghost"
                        rounded="full"
                        size="sm"
                        color={effectsEnabled ? 'purple.500' : 'gray.500'}
                        _dark={{ color: effectsEnabled ? 'purple.400' : 'gray.400' }}
                        _hover={{ color: 'purple.500', bg: 'transparent' }}
                    >
                        <FaMagic />
                    </IconButton>
                )}
                <IconButton
                    aria-label="Toggle color mode"
                    onClick={toggleColorMode}
                    variant="ghost"
                    rounded="full"
                    size="sm"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    _hover={{ color: 'blue.500', bg: 'transparent' }}
                >
                    {resolvedTheme === 'light' ? <FaMoon /> : <FaSun />}
                </IconButton>
            </Flex>
        </Flex>
    )
}
