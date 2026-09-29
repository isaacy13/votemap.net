import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Sign up',
    description: `${SITE_NAME} — Google or Apple, then one question at a time`,
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
