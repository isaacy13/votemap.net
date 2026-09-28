'use client'

import { Text, VStack } from '@chakra-ui/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { me as loadMe, type Me } from './api'
import { apiUrl, missingEnv } from './config'
import { readSessionToken } from './session'
import { Browse } from './screens/Browse'
import { Home } from './screens/Home'
import { IssueView } from './screens/Issue'
import { Profile } from './screens/Profile'
import { Signup } from './screens/Signup'
import { Question } from './ui/Question'
import { Shell } from './ui/Shell'

const emptySubscribe = () => () => {}

function route() {
    if (typeof window === 'undefined') return { view: 'home', i: '' }
    const sp = new URLSearchParams(window.location.search)
    const i = sp.get('i') || ''
    const view = sp.get('view') || (i ? 'issue' : 'home')
    return { view, i }
}

export function App() {
    const [effectsEnabled, setEffectsEnabled] = useState(true)
    const [tick, setTick] = useState(0)
    const ready = useSyncExternalStore(emptySubscribe, () => true, () => false)
    const [user, setUser] = useState<Me | null>(null)

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
        if (!ready || !readSessionToken() || !apiUrl()) return
        loadMe()
            .then(setUser)
            .catch(() => setUser(null))
    }, [ready, tick])

    const missing = missingEnv()
    const { view, i } = ready ? route() : { view: 'home', i: '' }
    const signupDone = Boolean(user?.handle)
    const toggleEffects = () => setEffectsEnabled((v) => !v)

    if (!ready) {
        return (
            <VStack minH="100vh" justify="center">
                <Text color="gray.500">votemap</Text>
            </VStack>
        )
    }

    if (view === 'home' && !i) {
        return <Home effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} />
    }

    let body = <Browse effectsEnabled={effectsEnabled} />
    if (missing && view !== 'signup' && view !== 'me') {
        body = <Question title="Set the chain env." hint={missing} effectsEnabled={effectsEnabled} />
    } else if (view === 'signup' || (view === 'me' && !signupDone)) {
        body = <Signup me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
    } else if (view === 'me' && user) {
        body = <Profile me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
    } else if ((view === 'issue' || i) && i) {
        body = <IssueView canonical={i} me={user} effectsEnabled={effectsEnabled} />
    }

    return (
        <Shell effectsEnabled={effectsEnabled} toggleEffects={toggleEffects} handle={user?.handle}>
            {body}
        </Shell>
    )
}
