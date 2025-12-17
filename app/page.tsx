'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Icon,
  Link,
  Flex,
  IconButton,
  VStack,
} from '@chakra-ui/react'
import { FaGithub, FaInstagram, FaMoon, FaSun } from 'react-icons/fa'
import { FaThreads, FaXTwitter } from 'react-icons/fa6'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)
const MotionHeading = motion(Heading)
const MotionText = motion(Text)
const MotionStack = motion(Stack)

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleColorMode = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, gray.50, blue.50, purple.50)"
      color="gray.800"
      _dark={{
        bgGradient: 'linear(to-br, gray.900, blue.900, purple.900)',
        color: 'white',
      }}
      transition="all 0.2s"
      overflow="hidden"
      position="relative"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        top="-20%"
        left="-10%"
        w="50%"
        h="50%"
        bgGradient="radial(blue.400, transparent)"
        filter="blur(100px)"
        opacity={0.2}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="-20%"
        right="-10%"
        w="50%"
        h="50%"
        bgGradient="radial(purple.400, transparent)"
        filter="blur(100px)"
        opacity={0.2}
        zIndex={0}
      />

      <Container maxW="container.xl" p={4} position="relative" zIndex={1}>
        <VStack gap={16} align="center" justify="center" minH="85vh" textAlign="center">
          <Stack gap={6} align="center">
            <MotionHeading
              as="h1"
              fontSize={{ base: '6xl', md: '8xl', lg: '9xl' }}
              css={{
                background: "linear-gradient(to right, #60A5FA, #A855F7, #EC4899)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent"
              }}
              fontWeight="extrabold"
              letterSpacing="tighter"
              lineHeight="1.2"
              pb={4}
              px={4}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              votemap
            </MotionHeading>

            <MotionText
              fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
              fontWeight="bold"
              color="gray.800"
              _dark={{ color: 'white' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
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
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              vote for the future you want to see
            </MotionText>
          </Stack>

          <MotionStack
            direction={{ base: 'column', md: 'row' }}
            gap={6}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
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
                <FaGithub /> Contribute
              </a>
            </Button>
          </MotionStack>

          <MotionStack
            direction="row"
            gap={8}
            pt={8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Link href="https://x.com/vote_map" target="_blank" color="gray.500" _dark={{ color: 'gray.400' }} _hover={{ color: 'black', _dark: { color: 'white' }, transform: 'scale(1.2)' }} transition="all 0.2s">
              <Icon as={FaXTwitter} w={8} h={8} />
            </Link>
            <Link href="https://threads.com/@vote_map" target="_blank" color="gray.500" _dark={{ color: 'gray.400' }} _hover={{ color: 'black', _dark: { color: 'white' }, transform: 'scale(1.2)' }} transition="all 0.2s">
              <Icon as={FaThreads} w={8} h={8} />
            </Link>
            <Link href="https://instagram.com/vote_map" target="_blank" color="gray.500" _dark={{ color: 'gray.400' }} _hover={{ color: 'pink.500', transform: 'scale(1.2)' }} transition="all 0.2s">
              <Icon as={FaInstagram} w={8} h={8} />
            </Link>
          </MotionStack>
        </VStack>

        <Flex
          as="footer"
          direction={{ base: 'column', md: 'row' }}
          justify="center"
          align="center"
          mt="auto"
          py={12}
          gap={{ base: 4, md: 8 }}
          color="gray.500"
          _dark={{ color: 'gray.400' }}
          fontSize="md"
        >
          <Link href="mailto:support@votemap.net" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
            support@votemap.net
          </Link>
          <Text display={{ base: 'none', md: 'block' }}>•</Text>
          <Text>
            Built by{' '}
            <Link href="https://onexengineering.com" target="_blank" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
              onexengineering
            </Link>
          </Text>
          <Text display={{ base: 'none', md: 'block' }}>•</Text>
          <Link href="https://x.com/isaac_yeang" target="_blank" fontWeight="medium" textDecoration="underline" _hover={{ color: 'blue.500' }}>
            @isaac_yeang
          </Link>
          <Text display={{ base: 'none', md: 'block' }}>•</Text>
          <IconButton
            aria-label="Toggle color mode"
            onClick={toggleColorMode}
            variant="ghost"
            rounded="full"
            size="sm"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
            _hover={{ color: 'blue.500', bg: 'transparent' }}
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </IconButton>
        </Flex>
      </Container>
    </Box>
  )
}