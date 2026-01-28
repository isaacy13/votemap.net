'use client'

import { Box, Container, Stack, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { VotemapHeading } from '@/components/landing/VotemapHeading'
import { HeroContent } from '@/components/landing/HeroContent'
import { SocialLinks } from '@/components/landing/SocialLinks'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  const [effectsEnabled, setEffectsEnabled] = useState(true)

  return (
    <Box>
      <Container maxW="container.xl" p={4} position="relative" zIndex={1}>
        <VStack gap={16} align="center" justify="center" minH="85vh" textAlign="center">
          <Stack gap={0} align="center">
            <VotemapHeading effectsEnabled={effectsEnabled} />
            <HeroContent />
          </Stack>

          <SocialLinks />
        </VStack>

        <Footer effectsEnabled={effectsEnabled} toggleEffects={() => setEffectsEnabled(!effectsEnabled)} />
      </Container>
    </Box>
  )
}
