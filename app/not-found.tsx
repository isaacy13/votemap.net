'use client'

import { useEffect, useState } from 'react'
import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct, Boot } from '@/mvp/product'
import { PublicProfile } from '@/mvp/screens/PublicProfile'
import { handleFromPathname } from '@/mvp/profile'
import { Question } from '@/mvp/ui/Question'

export default function NotFound() {
    const { effectsEnabled } = useProduct()
    const [handle, setHandle] = useState<string | null>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        Promise.resolve().then(() => {
            setHandle(handleFromPathname(window.location.pathname))
            setReady(true)
        })
    }, [])

    if (!ready) return <Boot />

    return (
        <ProductFrame>
            {handle ? (
                <PublicProfile handle={handle} effectsEnabled={effectsEnabled} />
            ) : (
                <Question title="Not found." effectsEnabled={effectsEnabled} />
            )}
        </ProductFrame>
    )
}
