'use client'

import { Text, VStack } from '@chakra-ui/react'
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { me as loadMe, type Me } from './api'
import { apiUrl } from './config'
import { readSessionToken } from './session'

const emptySubscribe = () => () => {}

function screenshotMe(): Me | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = sessionStorage.getItem('votemap.screenshotMe')
        if (!raw) return null
        const row = JSON.parse(raw) as { handle?: string; name?: string }
        const handle = (row.handle || '').replace(/^@/, '')
        if (!handle) return null
        return {
            id: 'screenshot',
            provider: 'google',
            email: '',
            name: row.name || handle,
            gender: 0,
            birthYear: 1990,
            phone: '+10000000000',
            phoneVerified: true,
            handle,
            payout: null,
            wallets: [],
            socials: { x: '', threads: '', instagram: '', tiktok: '' },
            hasDevice: true,
        }
    } catch {
        return null
    }
}

type Product = {
    ready: boolean
    user: Me | null
    setUser: (m: Me | null) => void
    effectsEnabled: boolean
    toggleEffects: () => void
}

const Ctx = createContext<Product | null>(null)

export function ProductProvider({ children }: { children: ReactNode }) {
    const [effectsEnabled, setEffectsEnabled] = useState(true)
    const ready = useSyncExternalStore(emptySubscribe, () => true, () => false)
    const [user, setUser] = useState<Me | null>(null)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (!ready) return
        readSessionToken()
        const bump = () => setTick((n) => n + 1)
        window.addEventListener('popstate', bump)
        window.addEventListener('votemap:nav', bump)
        return () => {
            window.removeEventListener('popstate', bump)
            window.removeEventListener('votemap:nav', bump)
        }
    }, [ready])

    useEffect(() => {
        if (!ready) return
        const shot = screenshotMe()
        if (shot) {
            Promise.resolve().then(() => setUser(shot))
            return
        }
        if (!readSessionToken() || !apiUrl()) return
        loadMe()
            .then(setUser)
            .catch(() => setUser(null))
    }, [ready, tick])

    return (
        <Ctx.Provider
            value={{
                ready,
                user,
                setUser,
                effectsEnabled,
                toggleEffects: () => setEffectsEnabled((v) => !v),
            }}
        >
            {children}
        </Ctx.Provider>
    )
}

export function useProduct() {
    const v = useContext(Ctx)
    if (!v) throw new Error('ProductProvider')
    return v
}

export function Boot() {
    return (
        <VStack minH="100vh" justify="center">
            <Text color="gray.500">votemap</Text>
        </VStack>
    )
}
