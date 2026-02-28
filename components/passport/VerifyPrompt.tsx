'use client'

import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { PassportVerifyModal } from './PassportVerifyModal'

const MotionBox = motion.create(Box)

interface VerifyPromptProps {
  onVerified?: (nationality: string) => void
}

export function VerifyPrompt({ onVerified }: VerifyPromptProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        p={5}
        rounded="xl"
        border="1px solid"
        borderColor="card.border"
        bg="card.bg"
      >
        <VStack gap={3} align="start">
          <HStack gap={2}>
            <Text fontSize="lg">🛂</Text>
            <Text fontWeight="semibold" fontSize="sm">Verify your passport</Text>
          </HStack>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            Link your country of residence to your wallet. Your identity stays private — only your nationality is revealed using a ZK proof.
          </Text>
          <Button
            size="sm"
            variant="surface"
            colorPalette="blue"
            onClick={() => setOpen(true)}
            _hover={{ transform: 'translateY(-1px)' }}
            transition="all 0.2s"
            rounded="full"
          >
            Verify with Self.xyz
          </Button>
        </VStack>
      </MotionBox>

      <PassportVerifyModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(nationality) => {
          setOpen(false)
          onVerified?.(nationality)
        }}
      />
    </>
  )
}
