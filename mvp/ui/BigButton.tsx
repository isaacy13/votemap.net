'use client'

import { Button } from '@chakra-ui/react'
import type { ButtonProps } from '@chakra-ui/react'

export function BigButton(props: ButtonProps) {
    return (
        <Button
            size="2xl"
            h="16"
            px="10"
            fontSize="xl"
            colorPalette="gray"
            variant="surface"
            rounded="full"
            w={{ base: 'full', md: 'auto' }}
            minW="240px"
            _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
            transition="all 0.2s"
            {...props}
        />
    )
}
