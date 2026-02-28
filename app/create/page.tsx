import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { AppShell } from '@/components/layout/AppShell'
import { CreateBountyForm } from '@/components/bounty/CreateBountyForm'
import { GradientText } from '@/components/layout/GradientText'

export const metadata = {
  title: 'Create Bounty — votemap',
  description: 'Post a bounty for a problem you want solved.',
}

export default function CreatePage() {
  return (
    <AppShell>
      <VStack gap={8} align="stretch" maxW="xl" mx="auto">
        <Box>
          <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em" mb={2}>
            Create a Bounty
          </Heading>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            Post a problem and let the world fund and solve it.
          </Text>
        </Box>
        <CreateBountyForm />
      </VStack>
    </AppShell>
  )
}
