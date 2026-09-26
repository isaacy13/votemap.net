'use client'

import { Stack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { api, health, type Me } from '../api'
import { apiUrl } from '../config'
import { setView } from '../session'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { Question } from '../ui/Question'

const GENDERS: { id: number; label: string }[] = [
    { id: 1, label: 'Woman' },
    { id: 2, label: 'Man' },
    { id: 3, label: 'Nonbinary' },
    { id: 0, label: 'Prefer not to say' },
]

function stepOf(me: Me | null): 'auth' | 'gender' | 'year' | 'phone' | 'otp' | 'handle' | 'done' {
    if (!me) return 'auth'
    if (me.gender === null) return 'gender'
    if (me.birthYear === null) return 'year'
    if (!me.phoneVerified) return me.phone ? 'otp' : 'phone'
    if (!me.handle) return 'handle'
    return 'done'
}

export function Signup({ me, onMe, effectsEnabled }: { me: Me | null; onMe: (m: Me) => void; effectsEnabled: boolean }) {
    const [err, setErr] = useState('')
    const [year, setYear] = useState('')
    const [phone, setPhone] = useState('+1')
    const [code, setCode] = useState('')
    const [handle, setHandle] = useState('')
    const [oauth, setOauth] = useState<{ google: boolean; apple: boolean } | null>(null)
    const step = stepOf(me)

    useEffect(() => {
        if (!apiUrl()) return
        health()
            .then((h) => setOauth({ google: h.google, apple: h.apple }))
            .catch((e: Error) => setErr(e.message))
    }, [])

    useEffect(() => {
        if (step === 'done' && me?.handle) setView({ view: 'me' })
    }, [step, me?.handle])

    async function post(path: string, body: unknown) {
        setErr('')
        try {
            onMe(await api<Me>(path, { method: 'POST', body: JSON.stringify(body) }))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'error')
        }
    }

    if (!apiUrl()) {
        return (
            <Question title="The account API is not set." hint="Set NEXT_PUBLIC_API_URL. There is no mock login." effectsEnabled={effectsEnabled} />
        )
    }

    if (step === 'auth') {
        return (
            <Question
                title="Start with Google or Apple."
                hint="We save your name the first time Apple shares it. Email can be Hide My Email."
                effectsEnabled={effectsEnabled}
                compact
            >
                <VStack gap={3}>
                    {oauth && !oauth.google && !oauth.apple ? (
                        <Text color="red.500">Google / Apple env is not set on the API. No mock mode.</Text>
                    ) : null}
                    <BigButton asChild>
                        <a href={`${apiUrl()}/auth/google`}>Continue with Google</a>
                    </BigButton>
                    <BigButton asChild>
                        <a href={`${apiUrl()}/auth/apple`}>Continue with Apple</a>
                    </BigButton>
                    {err ? <Text color="red.500">{err}</Text> : null}
                </VStack>
            </Question>
        )
    }

    if (step === 'gender') {
        return (
            <Question title="What’s your gender?" hint="Self-reported. Google and Apple don’t send this." effectsEnabled={effectsEnabled}>
                <Stack gap={4}>
                    {GENDERS.map((g) => (
                        <BigButton key={g.id} w="full" onClick={() => post('/profile/gender', { gender: g.id })}>
                            {g.label}
                        </BigButton>
                    ))}
                    {err ? <Text color="red.500">{err}</Text> : null}
                </Stack>
            </Question>
        )
    }

    if (step === 'year') {
        return (
            <Question
                title="What year were you born?"
                hint="One number. Then your phone."
                onNext={() => post('/profile/birth-year', { birthYear: Number(year) })}
                nextDisabled={!/^\d{4}$/.test(year)}
                effectsEnabled={effectsEnabled}
            >
                <BigInput
                    inputMode="numeric"
                    placeholder="1994"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    maxLength={4}
                />
                {err ? <Text color="red.500" mt={3}>{err}</Text> : null}
            </Question>
        )
    }

    if (step === 'phone') {
        return (
            <Question
                title="What’s your phone number?"
                hint="SMS once. We never put the raw number on-chain."
                onNext={() => post('/otp/send', { phone })}
                nextDisabled={!/^\+[1-9]\d{7,14}$/.test(phone)}
                nextLabel="Text me a code"
                effectsEnabled={effectsEnabled}
            >
                <BigInput
                    inputMode="tel"
                    placeholder="+15551234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                {err ? <Text color="red.500" mt={3}>{err}</Text> : null}
            </Question>
        )
    }

    if (step === 'otp') {
        return (
            <Question
                title="What code did we text?"
                hint={me?.phone || ''}
                onNext={() => post('/otp/verify', { code })}
                nextDisabled={code.trim().length < 4}
                onBack={() => onMe({ ...me!, phone: null, phoneVerified: false })}
                effectsEnabled={effectsEnabled}
            >
                <BigInput
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                {err ? <Text color="red.500" mt={3}>{err}</Text> : null}
            </Question>
        )
    }

    return (
        <Question
            title="Pick a handle."
            hint="First come, in our store. Not a social login."
            onNext={() => post('/handle', { handle })}
            nextDisabled={!/^[a-zA-Z0-9_]{3,20}$/.test(handle)}
            effectsEnabled={effectsEnabled}
        >
            <BigInput
                placeholder="yourname"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                maxLength={20}
            />
            {err ? <Text color="red.500" mt={3}>{err}</Text> : null}
        </Question>
    )
}
