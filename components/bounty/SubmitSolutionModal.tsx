'use client'

import {
  Button,
  Dialog,
  Field,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import { buildAuthMessage } from '@/lib/auth'

interface SubmitSolutionModalProps {
  bountyId: string
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

export function SubmitSolutionModal({ bountyId, open, onClose, onSubmitted }: SubmitSolutionModalProps) {
  const { publicKey, signMessage } = useWallet()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!publicKey || !signMessage) return
    setLoading(true)
    setError(null)
    try {
      const wallet = publicKey.toBase58()
      const timestamp = Date.now()
      const message = buildAuthMessage(wallet, 'submit-solution', timestamp)
      const sig = await signMessage(new TextEncoder().encode(message))
      const signature = bs58.encode(sig)

      const res = await fetch(`/api/bounties/${bountyId}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          action: 'submit-solution',
          timestamp,
          signature,
          title: title.trim(),
          description: description.trim(),
          url: url.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit')
      onSubmitted?.()
      onClose()
      setTitle('')
      setDescription('')
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose() }} placement="center">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content rounded="2xl" p={6} maxW="md">
          <Dialog.Header>
            <Heading size="md">Submit your solution</Heading>
          </Dialog.Header>
          <Dialog.Body>
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Field.Root required>
                  <Field.Label fontSize="sm">Title</Field.Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief title of your solution"
                    rounded="lg"
                  />
                </Field.Root>
                <Field.Root required>
                  <Field.Label fontSize="sm">Description</Field.Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe how you solved the bounty..."
                    rows={4}
                    rounded="lg"
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label fontSize="sm">Proof URL (optional)</Field.Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    rounded="lg"
                  />
                </Field.Root>
                {error && <Text fontSize="sm" color="red.500">{error}</Text>}
                <Button
                  type="submit"
                  w="full"
                  colorPalette="blue"
                  variant="surface"
                  loading={loading}
                  disabled={!title || !description}
                  rounded="full"
                >
                  Submit Solution
                </Button>
              </VStack>
            </form>
          </Dialog.Body>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
