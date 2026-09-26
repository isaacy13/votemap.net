'use client'

import { Text, VStack } from '@chakra-ui/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { me as loadMe, type Me } from './api'
import { apiUrl, missingEnv } from './config'
import { readSessionToken } from './session'
import { Browse } from './screens/Browse'
import { IssueView } from './screens/Issue'
import { Profile } from './screens/Profile'
import { Signup } from './screens/Signup'
import { Question } from './ui/Question'
import { Shell } from './ui/Shell'

const emptySubscribe = () => () => {}

function route() {
    if (typeof window === 'undefined') return { view: 'browse', i: '' }
    const sp = new URLSearchParams(window.location.search)
    const i = sp.get('i') || ''
    const view = sp.get('view') || (i ? 'issue' : 'browse')
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
    const { view, i } = ready ? route() : { view: 'browse', i: '' }
    const signupDone = Boolean(user?.handle)

    let body = <Browse effectsEnabled={effectsEnabled} />
    if (missing) {
        body = (
            <Question
                title="Chain env is required."
                hint={`${missing} There is no mock chain. Treasury is required at deploy.`}
                effectsEnabled={effectsEnabled}
            />
        )
    } else if (view === 'signup' || (view === 'me' && !signupDone)) {
        body = <Signup me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
    } else if (view === 'me' && user) {
        body = <Profile me={user} onMe={setUser} effectsEnabled={effectsEnabled} />
    } else if (view === 'issue' && i) {
        body = <IssueView canonical={i} me={user} effectsEnabled={effectsEnabled} />
    }

    if (!ready) {
        return (
            <VStack minH="100vh" justify="center">
                <Text color="gray.500">votemap</Text>
            </VStack>
        )
    }

    return (
        <Shell effectsEnabled={effectsEnabled} toggleEffects={() => setEffectsEnabled((v) => !v)} handle={user?.handle}>
            {body}
        </Shell>
    )
}
