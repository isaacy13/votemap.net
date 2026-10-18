'use client'

import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'
import { ProductProvider } from '@/mvp/product'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider value={defaultSystem}>
            <ThemeProvider attribute="class" disableTransitionOnChange>
                <ProductProvider>{children}</ProductProvider>
            </ThemeProvider>
        </ChakraProvider>
    )
}
