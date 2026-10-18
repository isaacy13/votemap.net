'use client'

import { Suspense } from 'react'
import MvpRedirect from '@/mvp/MvpRedirect'

export default function MvpPage() {
    return (
        <Suspense>
            <MvpRedirect />
        </Suspense>
    )
}
