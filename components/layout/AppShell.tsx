import { Box } from '@chakra-ui/react'
import { Navbar } from './Navbar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box minH="100vh">
      <Navbar />
      <Box as="main" maxW="container.xl" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
        {children}
      </Box>
    </Box>
  )
}
