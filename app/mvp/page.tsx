'use client'

import { Suspense } from 'react'
import { App } from '@/mvp/App'

export default function MvpPage() {
    return (
        <Suspense>
            <App />
        </Suspense>
    )
}
