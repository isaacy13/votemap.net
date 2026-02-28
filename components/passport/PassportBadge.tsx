'use client'

import { Badge, HStack, Text } from '@chakra-ui/react'
import { getCountry } from '@/lib/countries'

interface PassportBadgeProps {
  nationality?: string | null
  size?: 'xs' | 'sm' | 'md'
  showName?: boolean
}

export function PassportBadge({ nationality, size = 'sm', showName = false }: PassportBadgeProps) {
  if (!nationality) {
    return (
      <Badge variant="subtle" colorPalette="gray" size={size} rounded="full">
        <Text as="span" fontSize="xs">Unverified</Text>
      </Badge>
    )
  }

  const { flag, name } = getCountry(nationality)

  return (
    <Badge
      variant="subtle"
      colorPalette="blue"
      size={size}
      rounded="full"
      cursor="default"
      title={name}
    >
      <HStack gap={1}>
        <Text as="span">{flag}</Text>
        {showName && <Text as="span" fontSize="xs">{name}</Text>}
      </HStack>
    </Badge>
  )
}
