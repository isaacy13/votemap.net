'use client'

import {
  Box, Button, Field, Heading, Input,
  Select, createListCollection,
  Separator, Text, Textarea, VStack,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion, AnimatePresence } from 'framer-motion'
import bs58 from 'bs58'
import { BOUNTY_CATEGORIES, USDC_UNIT } from '@/lib/constants'
import { buildAuthMessage } from '@/lib/auth'

const MotionBox = motion.create(Box)

const CATEGORY_COLLECTION = createListCollection({
  items: BOUNTY_CATEGORIES.map((c) => ({ label: c.label, value: c.value }))
})

const STEPS = ['Details', 'Amount', 'Review']

export function CreateBountyForm() {
  const router = useRouter()
  const { publicKey, signMessage } = useWallet()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [targetUsdc, setTargetUsdc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetMicro = Math.round((parseFloat(targetUsdc) || 0) * USDC_UNIT)

  async function handleSubmit() {
    if (!publicKey || !signMessage) {
      setError('Connect your wallet first to publish a bounty.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const wallet = publicKey.toBase58()
      const timestamp = Date.now()
      const message = buildAuthMessage(wallet, 'create-bounty', timestamp)
      const sig = await signMessage(new TextEncoder().encode(message))
      const signature = bs58.encode(sig)

      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          action: 'create-bounty',
          timestamp,
          signature,
          title,
          description,
          category,
          usdcTarget: targetMicro,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create bounty')
      router.push(`/bounties/${data.bounty.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="xl" mx="auto">
      {/* Step indicator */}
      <Box mb={8}>
        <Box display="flex" gap={0} rounded="full" overflow="hidden" border="1px solid" borderColor="card.border" w="fit-content">
          {STEPS.map((s, i) => (
            <Box
              key={s}
              px={4}
              py={2}
              fontSize="sm"
              fontWeight={i === step ? '600' : 'medium'}
              bg={i === step ? 'brand.blue' : 'transparent'}
              color={i === step ? 'white' : 'gray.500'}
              cursor={i < step ? 'pointer' : 'default'}
              onClick={() => i < step && setStep(i)}
              transition="all 0.2s"
            >
              {s}
            </Box>
          ))}
        </Box>
      </Box>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <MotionBox
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VStack gap={5} align="stretch">
              <Heading size="lg" fontWeight="800" letterSpacing="-0.03em">
                What needs to be solved?
              </Heading>
              <Field.Root required>
                <Field.Label>Title</Field.Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fix the potholes on Main Street"
                  maxLength={120}
                  rounded="xl"
                />
                <Field.HelperText>{title.length}/120</Field.HelperText>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the problem in detail. What does success look like?"
                  rows={6}
                  maxLength={2000}
                  rounded="xl"
                />
                <Field.HelperText>{description.length}/2000</Field.HelperText>
              </Field.Root>
              <Field.Root required>
                <Field.Label>Category</Field.Label>
                <Select.Root
                  collection={CATEGORY_COLLECTION}
                  value={[category]}
                  onValueChange={(e) => setCategory(e.value[0] ?? 'general')}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger rounded="xl">
                      <Select.ValueText />
                    </Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content rounded="xl">
                      {CATEGORY_COLLECTION.items.map((item) => (
                        <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field.Root>
              <Button
                colorPalette="blue"
                variant="surface"
                rounded="full"
                size="lg"
                disabled={!title || !description}
                onClick={() => setStep(1)}
              >
                Next →
              </Button>
            </VStack>
          </MotionBox>
        )}

        {step === 1 && (
          <MotionBox
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VStack gap={5} align="stretch">
              <Heading size="lg" fontWeight="800" letterSpacing="-0.03em">
                Set a funding goal
              </Heading>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                This is the target amount in USDC stablecoin. The bounty stays open until a solution is approved — anyone can contribute.
              </Text>
              <Field.Root required>
                <Field.Label>Target amount (USDC)</Field.Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={targetUsdc}
                  onChange={(e) => setTargetUsdc(e.target.value)}
                  placeholder="e.g. 1000"
                  rounded="xl"
                  size="lg"
                />
                <Field.HelperText>
                  {targetMicro > 0 && `= $${(targetMicro / USDC_UNIT).toLocaleString()} USDC`}
                </Field.HelperText>
              </Field.Root>
              <Button
                colorPalette="blue"
                variant="surface"
                rounded="full"
                size="lg"
                disabled={!targetUsdc || targetMicro < USDC_UNIT}
                onClick={() => setStep(2)}
              >
                Review →
              </Button>
              <Button variant="ghost" rounded="full" onClick={() => setStep(0)}>
                ← Back
              </Button>
            </VStack>
          </MotionBox>
        )}

        {step === 2 && (
          <MotionBox
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VStack gap={5} align="stretch">
              <Heading size="lg" fontWeight="800" letterSpacing="-0.03em">
                Review & publish
              </Heading>
              <Box p={5} rounded="xl" border="1px solid" borderColor="card.border" bg="card.bg">
                <VStack gap={3} align="start">
                  <Text fontWeight="700" fontSize="lg">{title}</Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>{description}</Text>
                  <Separator />
                  <Text fontSize="sm"><strong>Category:</strong> {BOUNTY_CATEGORIES.find((c) => c.value === category)?.label}</Text>
                  <Text fontSize="sm"><strong>Goal:</strong> ${(targetMicro / USDC_UNIT).toLocaleString()} USDC</Text>
                </VStack>
              </Box>
              <Text fontSize="xs" color="gray.500">
                After publishing, you'll need to send ~0.01 SOL to the escrow address to activate the bounty for contributions.
              </Text>
              {error && <Text fontSize="sm" color="red.500">{error}</Text>}
              <Button
                colorPalette="blue"
                variant="surface"
                rounded="full"
                size="lg"
                loading={loading}
                onClick={handleSubmit}
              >
                Publish Bounty
              </Button>
              <Button variant="ghost" rounded="full" onClick={() => setStep(1)}>
                ← Back
              </Button>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  )
}
