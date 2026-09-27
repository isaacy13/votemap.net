'use client'

import { Box, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

export function QrCard({ value, label }: { value: string; label: string }) {
    const [src, setSrc] = useState('')

    useEffect(() => {
        let gone = false
        import('qrcode').then((qr) =>
            qr.toDataURL(value, { width: 280, margin: 1, color: { dark: '#111827', light: '#ffffff' } }).then((url) => {
                if (!gone) setSrc(url)
            }),
        )
        return () => {
            gone = true
        }
    }, [value])

    return (
        <VStack gap={3}>
            <Box
                p={{ base: 3, md: 4 }}
                bg="white"
                rounded="2xl"
                shadow="lg"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
            >
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} width={220} height={220} style={{ display: 'block', width: '220px', height: '220px' }} />
                ) : (
                    <Box w="220px" h="220px" />
                )}
            </Box>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" _dark={{ color: 'gray.300' }} maxW="sm">
                {label}
            </Text>
        </VStack>
    )
}
