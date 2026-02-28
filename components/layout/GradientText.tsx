'use client'

import { Text, type TextProps } from '@chakra-ui/react'

interface GradientTextProps extends TextProps {
  children: React.ReactNode
}

export function GradientText({ children, ...props }: GradientTextProps) {
  return (
    <Text
      as="span"
      bgGradient="to-r"
      gradientFrom="#3b82f6"
      gradientVia="#8b5cf6"
      gradientTo="#ef4444"
      bgClip="text"
      fontWeight="800"
      {...props}
    >
      {children}
    </Text>
  )
}
