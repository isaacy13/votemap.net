'use client'

import { Button } from '@chakra-ui/react'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { SubmitSolutionModal } from './SubmitSolutionModal'

interface BountyActionsProps {
  bountyId: string
  status: string
}

export function BountyActions({ bountyId, status }: BountyActionsProps) {
  const { publicKey } = useWallet()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (status === 'resolved' || status === 'cancelled') return null

  return (
    <>
      <Button
        size="sm"
        variant="surface"
        colorPalette="purple"
        rounded="full"
        disabled={!publicKey}
        onClick={() => setOpen(true)}
      >
        Submit Solution
      </Button>
      <SubmitSolutionModal
        bountyId={bountyId}
        open={open}
        onClose={() => setOpen(false)}
        onSubmitted={() => router.refresh()}
      />
    </>
  )
}
