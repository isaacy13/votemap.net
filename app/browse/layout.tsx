import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Browse',
    description: `${SITE_NAME} — pots on X, Threads, Instagram, and TikTok`,
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
