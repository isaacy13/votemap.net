'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import { system } from '@/lib/theme'
import { SolanaProviders } from '@/components/wallet/SolanaProviders'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider value={system}>
            <ThemeProvider attribute="class" disableTransitionOnChange>
                <SolanaProviders>
                    {children}
                </SolanaProviders>
            </ThemeProvider>
        </ChakraProvider>
    )
}
