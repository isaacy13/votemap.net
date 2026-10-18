'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { issuePath } from '@/mvp/urls'

/** Old `/mvp?view=` bookmarks and OAuth returns. */
export default function MvpRedirect() {
    const router = useRouter()

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search)
        const token = sp.get('token')
        const view = sp.get('view')
        const i = sp.get('i') || sp.get('u')
        const q = token ? `?token=${encodeURIComponent(token)}` : ''
        if (i) {
            const dest = issuePath(i)
            router.replace(token ? `${dest}&token=${encodeURIComponent(token)}` : dest)
            return
        }
        if (view === 'browse') router.replace(`/browse${q}`)
        else if (view === 'signup') router.replace(`/signup${q}`)
        else if (view === 'me') router.replace(`/me${q}`)
        else if (token) router.replace(`/signup${q}`)
        else router.replace('/')
    }, [router])

    return null
}
