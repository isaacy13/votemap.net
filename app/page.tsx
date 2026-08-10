'use client'

import { Box, Container, Stack, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { VotemapHeading } from '@/components/landing/VotemapHeading'
import { HeroContent } from '@/components/landing/HeroContent'
import { SocialLinks } from '@/components/landing/SocialLinks'
import { VideoEmbed } from '@/components/landing/VideoEmbed'
import { TweetEmbeds } from '@/components/landing/TweetEmbeds'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  const [effectsEnabled, setEffectsEnabled] = useState(true)

  return (
    <Box as="main">
      {/* Accessible / SEO primary heading — brand is rendered visually via SVG */}
      <Box
        as="h1"
        position="absolute"
        w="1px"
        h="1px"
        p={0}
        m="-1px"
        overflow="hidden"
        clip="rect(0, 0, 0, 0)"
        whiteSpace="nowrap"
        borderWidth={0}
      >
        votemap — democratize everything
      </Box>
      <Container maxW="container.xl" p={4} position="relative" zIndex={1}>
        <VStack gap={16} align="center" justify="center" minH="85vh" textAlign="center">
          <Stack gap={0} align="center">
            <VotemapHeading effectsEnabled={effectsEnabled} />
            <HeroContent />
          </Stack>

          <VideoEmbed />

          <TweetEmbeds effectsEnabled={effectsEnabled} />

          <SocialLinks />
        </VStack>

        <Footer effectsEnabled={effectsEnabled} toggleEffects={() => setEffectsEnabled(!effectsEnabled)} />
      </Container>
    </Box>
  )
}
