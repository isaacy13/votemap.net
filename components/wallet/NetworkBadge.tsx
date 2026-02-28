'use client'

import { Badge } from '@chakra-ui/react'

export function NetworkBadge() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet'
  const isMainnet = network === 'mainnet-beta'

  return (
    <Badge
      size="xs"
      colorPalette={isMainnet ? 'green' : 'orange'}
      variant="subtle"
      rounded="full"
      fontSize="2xs"
      textTransform="uppercase"
      letterSpacing="wider"
    >
      {isMainnet ? 'mainnet' : 'devnet'}
    </Badge>
  )
}
