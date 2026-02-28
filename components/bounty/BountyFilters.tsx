'use client'

import { HStack, Select, Text, createListCollection } from '@chakra-ui/react'
import { BOUNTY_CATEGORIES } from '@/lib/constants'

const STATUS_OPTIONS = createListCollection({
  items: [
    { label: 'All Status',  value: '' },
    { label: 'Open',        value: 'open' },
    { label: 'In Review',   value: 'in_review' },
    { label: 'Resolved',    value: 'resolved' },
  ]
})

const CATEGORY_OPTIONS = createListCollection({
  items: [
    { label: 'All Categories', value: '' },
    ...BOUNTY_CATEGORIES.map((c) => ({ label: c.label, value: c.value })),
  ]
})

interface BountyFiltersProps {
  status: string
  category: string
  onStatusChange: (v: string) => void
  onCategoryChange: (v: string) => void
}

export function BountyFilters({ status, category, onStatusChange, onCategoryChange }: BountyFiltersProps) {
  return (
    <HStack gap={3} flexWrap="wrap">
      <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.400' }}>
        Filter:
      </Text>
      <Select.Root
        collection={STATUS_OPTIONS}
        size="sm"
        value={[status]}
        onValueChange={(e) => onStatusChange(e.value[0] ?? '')}
        width="160px"
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger rounded="full" border="1px solid" borderColor="card.border">
            <Select.ValueText placeholder="Status" />
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content rounded="xl">
            {STATUS_OPTIONS.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>

      <Select.Root
        collection={CATEGORY_OPTIONS}
        size="sm"
        value={[category]}
        onValueChange={(e) => onCategoryChange(e.value[0] ?? '')}
        width="180px"
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger rounded="full" border="1px solid" borderColor="card.border">
            <Select.ValueText placeholder="Category" />
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content rounded="xl">
            {CATEGORY_OPTIONS.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </HStack>
  )
}
