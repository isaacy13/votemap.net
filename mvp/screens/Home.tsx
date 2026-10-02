'use client'

import { Box, Container, Flex, Stack, Text, VStack } from '@chakra-ui/react'
import { VotemapHeading } from '@/components/landing/VotemapHeading'
import { HeroContent } from '@/components/landing/HeroContent'
import { SocialLinks } from '@/components/landing/SocialLinks'
import { VideoEmbed } from '@/components/landing/VideoEmbed'
import { TweetEmbeds } from '@/components/landing/TweetEmbeds'
import { Footer } from '@/components/landing/Footer'
import { apiUrl } from '../config'
import { AccountControl } from '../ui/AccountControl'
import { BrowsePill, SignInButtons } from '../ui/SignInButtons'
import { OrRule } from '../ui/OrRule'

export function Home({
    effectsEnabled,
    toggleEffects,
    handle,
}: {
    effectsEnabled: boolean
    toggleEffects: () => void
    handle?: string | null
}) {
    const api = apiUrl()

    return (
        <Box as="main">
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
                {handle ? (
                    <Flex justify="flex-end" position="absolute" top={4} right={4} zIndex={2}>
                        <AccountControl handle={handle} />
                    </Flex>
                ) : null}
                <VStack gap={16} align="center" justify="center" minH="85vh" textAlign="center">
                    <Stack gap={0} align="center" w="full">
                        <VotemapHeading effectsEnabled={effectsEnabled} />
                        <HeroContent
                            effectsEnabled={effectsEnabled}
                            actions={
                                <VStack gap={6} w="full" maxW="384px" data-shot="home-pills">
                                    {handle ? null : api ? (
                                        <SignInButtons googleHref={`${api}/auth/google`} appleHref={`${api}/auth/apple`} />
                                    ) : (
                                        <Text color="red.500">Set the account API.</Text>
                                    )}
                                    {handle ? null : <OrRule effectsEnabled={effectsEnabled} />}
                                    <BrowsePill href="/browse">Browse</BrowsePill>
                                </VStack>
                            }
                        />
                    </Stack>

                    <VideoEmbed effectsEnabled={effectsEnabled} />

                    <TweetEmbeds effectsEnabled={effectsEnabled} />

                    <SocialLinks />
                </VStack>

                <Footer
                    effectsEnabled={effectsEnabled}
                    toggleEffects={toggleEffects}
                    showSocial
                    showGithub
                />
            </Container>
        </Box>
    )
}
