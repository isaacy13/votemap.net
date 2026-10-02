import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Profile',
    description: `${SITE_NAME} — public links`,
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
