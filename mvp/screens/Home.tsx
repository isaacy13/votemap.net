'use client'

import { Box, Button, Container, Stack, Text, VStack } from '@chakra-ui/react'
import { VotemapHeading } from '@/components/landing/VotemapHeading'
import { HeroContent } from '@/components/landing/HeroContent'
import { SocialLinks } from '@/components/landing/SocialLinks'
import { VideoEmbed } from '@/components/landing/VideoEmbed'
import { TweetEmbeds } from '@/components/landing/TweetEmbeds'
import { Footer } from '@/components/landing/Footer'
import { apiUrl } from '../config'
import { setView } from '../session'
import { SignInButtons } from '../ui/SignInButtons'

export function Home({
    effectsEnabled,
    toggleEffects,
}: {
    effectsEnabled: boolean
    toggleEffects: () => void
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
                <VStack gap={16} align="center" justify="center" minH="85vh" textAlign="center">
                    <Stack gap={0} align="center" w="full">
                        <VotemapHeading effectsEnabled={effectsEnabled} />
                        <HeroContent
                            effectsEnabled={effectsEnabled}
                            actions={
                                <VStack gap={6} w="full" maxW="384px">
                                    {api ? (
                                        <SignInButtons googleHref={`${api}/auth/google`} appleHref={`${api}/auth/apple`} />
                                    ) : (
                                        <Text color="red.500">Set the account API.</Text>
                                    )}
                                    <Box w="full" h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        h="12"
                                        px="8"
                                        fontSize={{ base: 'xl', md: '2xl' }}
                                        fontWeight="medium"
                                        color="gray.600"
                                        _dark={{ color: 'gray.300' }}
                                        rounded="full"
                                        onClick={() => setView({ view: 'browse', i: null })}
                                        _hover={{ transform: 'translateY(-2px)', color: 'gray.800', _dark: { color: 'white' }, bg: 'transparent' }}
                                        transition="all 0.2s"
                                    >
                                        Browse
                                    </Button>
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
