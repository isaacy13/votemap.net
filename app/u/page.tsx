'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct } from '@/mvp/product'
import { Boot } from '@/mvp/product'
import { PublicProfile } from '@/mvp/screens/PublicProfile'
import { handleFromPathname, handleFromSearch } from '@/mvp/profile'
import { Question } from '@/mvp/ui/Question'

function Inner() {
    const sp = useSearchParams()
    const { effectsEnabled } = useProduct()
    const [handle, setHandle] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        Promise.resolve().then(() => {
            setHandle(handleFromPathname(window.location.pathname) || handleFromSearch(sp))
            setReady(true)
        })
    }, [sp])

    if (!ready) return <Boot />

    return (
        <ProductFrame>
            {handle ? (
                <PublicProfile handle={handle} effectsEnabled={effectsEnabled} />
            ) : (
                <Question title="No such profile" effectsEnabled={effectsEnabled} />
            )}
        </ProductFrame>
    )
}

export default function Page() {
    return (
        <Suspense fallback={<Boot />}>
            <Inner />
        </Suspense>
    )
}
