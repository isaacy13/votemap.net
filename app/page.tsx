'use client'

import { Boot, useProduct } from '@/mvp/product'
import { Home } from '@/mvp/screens/Home'

export default function Page() {
    const { ready, user, effectsEnabled, toggleEffects } = useProduct()
    if (!ready) return <Boot />
    return <Home effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} handle={user?.handle} />
}
