import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Issue',
    description: `${SITE_NAME} — stake USDC on a post`,
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
