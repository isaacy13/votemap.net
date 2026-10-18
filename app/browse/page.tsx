'use client'

import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct } from '@/mvp/product'
import { Browse } from '@/mvp/screens/Browse'

export default function Page() {
    const { effectsEnabled } = useProduct()
    return (
        <ProductFrame>
            <Browse effectsEnabled={effectsEnabled} />
        </ProductFrame>
    )
}
