'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct } from '@/mvp/product'
import { IssueView } from '@/mvp/screens/Issue'
import { issueUrlFromSearch } from '@/mvp/urls'
import { Boot } from '@/mvp/product'

function IssueInner() {
    const sp = useSearchParams()
    const { user, effectsEnabled } = useProduct()
    const canonical = issueUrlFromSearch(sp)
    return (
        <ProductFrame needChain>
            <IssueView canonical={canonical} me={user} effectsEnabled={effectsEnabled} />
        </ProductFrame>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<Boot />}>
            <IssueInner />
        </Suspense>
    )
}
