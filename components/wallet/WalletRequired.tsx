'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Box, Button, Text, VStack } from '@chakra-ui/react'
import { motion } from 'framer-motion'

const MotionBox = motion.create(Box)

interface WalletRequiredProps {
  children: React.ReactNode
  message?: string
}

export function WalletRequired({ children, message = 'Connect your wallet to continue' }: WalletRequiredProps) {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()

  if (publicKey) return <>{children}</>

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="40vh"
    >
      <VStack gap={6} textAlign="center" maxW="sm" px={4}>
        <Text fontSize="3xl">🔐</Text>
        <Text fontSize="lg" fontWeight="medium">
          {message}
        </Text>
        <Button
          size="lg"
          variant="surface"
          colorPalette="blue"
          onClick={() => setVisible(true)}
          _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
          transition="all 0.2s"
          rounded="full"
          px={8}
        >
          Connect Wallet
        </Button>
      </VStack>
    </MotionBox>
  )
}
