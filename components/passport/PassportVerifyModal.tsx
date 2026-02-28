'use client'

import { Box, Dialog, Heading, Text, VStack } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'

// Lazy-load the Self QR code to avoid SSR issues
const SelfQRcodeWrapper = dynamic(
  () => import('@selfxyz/qrcode').then((m) => m.SelfQRcodeWrapper),
  { ssr: false, loading: () => <Box h="280px" w="280px" bg="gray.100" rounded="xl" /> }
)

interface PassportVerifyModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (nationality: string) => void
}

export function PassportVerifyModal({ open, onClose, onSuccess }: PassportVerifyModalProps) {
  const { publicKey } = useWallet()

  if (!publicKey) return null

  const walletAddress = publicKey.toBase58()

  // Build the Self app config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let selfApp: any = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SelfAppBuilder } = require('@selfxyz/qrcode')
    selfApp = new SelfAppBuilder({
      appName: 'votemap',
      scope: process.env.NEXT_PUBLIC_SELF_SCOPE ?? 'votemap-verify',
      endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/verify-passport`,
      userContextData: walletAddress,
      disclosures: {
        nationality: true,
        minimumAge: 18,
      },
    }).build()
  } catch {
    // Self.xyz not configured
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose() }} placement="center">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content rounded="2xl" p={6} maxW="sm">
          <Dialog.Header>
            <Heading size="md">Verify your passport</Heading>
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap={4} align="center">
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} textAlign="center">
                Scan with the <strong>Self app</strong> to prove your nationality with a ZK proof. Your personal details stay private.
              </Text>
              {selfApp ? (
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={() => {
                    // Poll for nationality from our API
                    fetch(`/api/users/${walletAddress}`)
                      .then((r) => r.json())
                      .then((data) => {
                        const nat = data?.profile?.passport?.nationality
                        if (nat) onSuccess(nat)
                      })
                  }}
                  type="websocket"
                  onError={(err) => console.error('Self.xyz error:', err)}
                />
              ) : (
                <Box p={4} bg="gray.100" _dark={{ bg: 'gray.800' }} rounded="xl" textAlign="center">
                  <Text fontSize="sm" color="gray.500">
                    Self.xyz not configured. Set NEXT_PUBLIC_SELF_SCOPE and NEXT_PUBLIC_APP_URL.
                  </Text>
                </Box>
              )}
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Powered by{' '}
                <Text as="span" fontWeight="medium">Self.xyz</Text>{' '}
                — your passport data never leaves your device
              </Text>
            </VStack>
          </Dialog.Body>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
