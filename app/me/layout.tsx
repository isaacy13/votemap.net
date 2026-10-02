import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'You',
    description: `${SITE_NAME} — account`,
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
