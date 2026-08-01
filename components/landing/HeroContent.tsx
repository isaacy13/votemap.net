'use client'

import { Text, Stack, Button, SimpleGrid, Heading, Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'

const MotionText = motion(Text)
const MotionStack = motion(Stack)
const MotionBox = motion(Box)

const steps = [
  {
    title: 'Stake with a deadline',
    body: 'Put money on a measurable outcome. If it is not delivered by your deadline, your stake returns automatically.',
  },
  {
    title: 'Verify & Face ID',
    body: 'Prove personhood with open-source ZKPassport. Every vote confirms with Face ID on your phone — including when you start on web.',
  },
  {
    title: 'Deliver or refund',
    body: 'Builders submit proof. You approve release — or the ledger refunds you when time runs out. Every movement is public.',
  },
]

export const HeroContent = () => {
  return (
    <>
      <MotionText
        fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
        fontWeight="bold"
        color="gray.800"
        _dark={{ color: 'white' }}
        mt={{ base: -2, md: -4, lg: -8 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        democratize everything
      </MotionText>

      <MotionText
        fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
        color="gray.600"
        _dark={{ color: 'gray.300' }}
        maxW="3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      >
        vote + roadmap: stake real money on outcomes you want delivered
      </MotionText>

      <MotionText
        fontSize={{ base: 'md', md: 'lg' }}
        color="gray.500"
        _dark={{ color: 'gray.400' }}
        maxW="2xl"
        mt={4}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      >
        Transparent stakes with personal deadlines, direct donations, and entity bounties —
        money moves when results appear, or returns to you when they do not.
      </MotionText>

      <MotionStack
        direction={{ base: 'column', md: 'row' }}
        gap={6}
        mt={8}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
      >
        <Button
          asChild
          size="2xl"
          h="16"
          px="10"
          fontSize="xl"
          colorPalette="gray"
          variant="surface"
          rounded="full"
          _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
          transition="all 0.2s"
        >
          <a href="https://github.com/isaacy13/votemap.net" target="_blank" rel="noopener noreferrer">
            <FaGithub /> Build Now
          </a>
        </Button>
      </MotionStack>

      <MotionBox
        mt={{ base: 12, md: 16 }}
        w="full"
        maxW="4xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.75, ease: 'easeOut' }}
      >
        <Heading
          size="md"
          mb={6}
          color="gray.700"
          _dark={{ color: 'gray.200' }}
          fontWeight="semibold"
        >
          How it works
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          {steps.map((step, i) => (
            <Box
              key={step.title}
              p={5}
              rounded="2xl"
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700', bg: 'whiteAlpha.50' }}
              bg="gray.50"
              textAlign="left"
            >
              <Text fontSize="sm" fontWeight="bold" color="purple.500" mb={2}>
                {i + 1}
              </Text>
              <Text fontWeight="bold" mb={2} color="gray.800" _dark={{ color: 'white' }}>
                {step.title}
              </Text>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                {step.body}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </MotionBox>
    </>
  )
}
