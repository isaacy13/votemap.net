'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button, Text } from '@chakra-ui/react'

function truncateWallet(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

interface ConnectWalletButtonProps {
  size?: 'sm' | 'md' | 'lg'
}

export function ConnectWalletButton({ size = 'sm' }: ConnectWalletButtonProps) {
  const { publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  if (publicKey) {
    return (
      <Button
        size={size}
        variant="outline"
        borderColor="card.border"
        onClick={() => disconnect()}
        fontFamily="mono"
        fontSize="xs"
        letterSpacing="tight"
        _hover={{ borderColor: 'brand.red', color: 'brand.red' }}
      >
        {truncateWallet(publicKey.toBase58())}
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant="surface"
      colorPalette="blue"
      loading={connecting}
      onClick={() => setVisible(true)}
      _hover={{ transform: 'translateY(-1px)', shadow: 'sm' }}
      transition="all 0.2s"
    >
      <Text>Connect Wallet</Text>
    </Button>
  )
}
