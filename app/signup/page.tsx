'use client'

import { ProductFrame } from '@/mvp/ProductFrame'
import { useProduct } from '@/mvp/product'
import { Profile } from '@/mvp/screens/Profile'
import { Signup } from '@/mvp/screens/Signup'

export default function Page() {
    const { user, setUser, effectsEnabled } = useProduct()
    return (
        <ProductFrame>
            {user?.handle ? (
                <Profile me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
            ) : (
                <Signup me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
            )}
        </ProductFrame>
    )
}
