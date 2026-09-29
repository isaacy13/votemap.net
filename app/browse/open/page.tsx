'use client'

import { motion } from 'framer-motion'
import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct } from '@/mvp/product'
import { WhichPost } from '@/mvp/screens/WhichPost'
import { iosPush } from '@/mvp/ui/enter'

export default function Page() {
    const { effectsEnabled } = useProduct()
    return (
        <ProductFrame backHref="/browse" foldFooter>
            <motion.div {...iosPush(effectsEnabled, 1)}>
                <WhichPost effectsEnabled={effectsEnabled} />
            </motion.div>
        </ProductFrame>
    )
}
