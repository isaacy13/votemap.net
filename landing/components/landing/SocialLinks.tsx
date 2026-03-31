'use client'

import { Stack, Link, Icon } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FaInstagram } from 'react-icons/fa'
import { FaThreads, FaXTwitter } from 'react-icons/fa6'

const MotionStack = motion(Stack)

export const SocialLinks = () => {
    return (
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
    )
}
