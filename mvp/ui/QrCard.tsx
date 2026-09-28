'use client'

import { Box, VStack } from '@chakra-ui/react'
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
        <VStack gap={0}>
            <Box
                p={{ base: 5, md: 8 }}
                bg="white"
                rounded="2xl"
                shadow="xl"
            >
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} width={220} height={220} style={{ display: 'block', width: '220px', height: '220px' }} />
                ) : (
                    <Box w="220px" h="220px" />
                )}
            </Box>
        </VStack>
    )
}
