import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'app',
    description: `${SITE_NAME} — stake USDC on an X, Threads, Instagram, or TikTok post`,
}

export default function MvpLayout({ children }: { children: React.ReactNode }) {
    return children
}
