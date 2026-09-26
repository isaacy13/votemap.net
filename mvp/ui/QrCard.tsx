'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

export function QrCard({ value, label }: { value: string; label: string }) {
    const [src, setSrc] = useState('')

    useEffect(() => {
        let gone = false
        import('qrcode').then((qr) =>
            qr.toDataURL(value, { width: 360, margin: 1, color: { dark: '#111827', light: '#ffffff' } }).then((url) => {
                if (!gone) setSrc(url)
            }),
        )
        return () => {
            gone = true
        }
    }, [value])

    return (
        <VStack gap={4}>
            <Box
                p={4}
                bg="white"
                rounded="2xl"
                shadow="xl"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
            >
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} width={280} height={280} style={{ display: 'block' }} />
                ) : (
                    <Box w="280px" h="280px" />
                )}
            </Box>
            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.600" _dark={{ color: 'gray.300' }} maxW="sm">
                {label}
            </Text>
        </VStack>
    )
}
