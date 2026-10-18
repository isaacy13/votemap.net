'use client'

import { Input } from '@chakra-ui/react'

export function BigInput({
    value,
    onChange,
    placeholder,
    inputMode,
    maxLength,
}: {
    value?: string
    onChange?: (e: { target: { value: string } }) => void
    placeholder?: string
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    maxLength?: number
}) {
    return (
        <Input
            w="full"
            h={{ base: '16', md: '20' }}
            px="8"
            rounded="full"
            fontSize={{ base: 'xl', md: '2xl' }}
            textAlign="center"
            borderWidth="1px"
            bg="white"
            color="gray.800"
            _dark={{ bg: 'gray.900', color: 'white', borderColor: 'gray.700' }}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            inputMode={inputMode}
            maxLength={maxLength}
        />
    )
}
