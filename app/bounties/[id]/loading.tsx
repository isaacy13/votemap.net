import { Box, Grid, Skeleton, VStack } from '@chakra-ui/react'
import { AppShell } from '@/components/layout/AppShell'

export default function BountyDetailLoading() {
  return (
    <AppShell>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 320px' }} gap={8}>
        <VStack gap={5} align="stretch">
          <Skeleton h="40px" w="60%" rounded="md" />
          <Skeleton h="20px" w="40%" rounded="md" />
          <VStack gap={2} align="stretch">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} h="16px" w={i % 3 === 2 ? '70%' : 'full'} rounded="md" />
            ))}
          </VStack>
        </VStack>
        <Box>
          <Skeleton h="200px" rounded="2xl" />
        </Box>
      </Grid>
    </AppShell>
  )
}
