'use client'

import { Link, Stack, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { api, type Me } from '../api'
import { signLinkMessage, submitClaim } from '../chain'
import { addressUrl, apiUrl } from '../config'
import { VoteMap, isNativeApp } from '../plugin'
import { clearSession, readSessionToken, setView } from '../session'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { Question } from '../ui/Question'

export function Profile({ me, onMe, effectsEnabled }: { me: Me; onMe: (m: Me | null) => void; effectsEnabled: boolean }) {
    const [err, setErr] = useState('')
    const [socials, setSocials] = useState(me.socials)
    const [nativeAsk, setNativeAsk] = useState(false)

    async function saveSocials() {
        setErr('')
        try {
            onMe(await api<Me>('/socials', { method: 'POST', body: JSON.stringify(socials) }))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'error')
        }
    }

    async function linkWallet() {
        setErr('')
        try {
            const signed = await signLinkMessage(me.id)
            onMe(await api<Me>('/wallets/link', { method: 'POST', body: JSON.stringify(signed) }))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'error')
        }
    }

    async function payout(address: string) {
        try {
            onMe(await api<Me>('/wallets/payout', { method: 'POST', body: JSON.stringify({ address }) }))
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'error')
        }
    }

    async function claimOnchain() {
        setErr('')
        try {
            const native = await isNativeApp()
            if (!native) {
                setNativeAsk(true)
                return
            }
            const token = readSessionToken()
            const wallet = me.payout as `0x${string}` | undefined
            if (!token || !wallet) throw new Error('Link a payout wallet first.')
            const signed = await VoteMap.claim({ apiUrl: apiUrl(), sessionToken: token, wallet })
            const hash = await submitClaim({
                oidcSubHash: signed.oidcSubHash!,
                email: signed.email || me.email,
                name: signed.name || me.name,
                gender: signed.gender ?? me.gender ?? 0,
                birthYear: signed.birthYear ?? me.birthYear ?? 0,
                phoneHash: signed.phoneHash!,
                phoneVerified: true,
                nonce: BigInt(signed.nonce),
                deadline: signed.deadline,
                signature: signed.signature,
                from: wallet,
            })
            setErr(`claimed ${hash.slice(0, 10)}…`)
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'error')
        }
    }

    if (nativeAsk) {
        return (
            <Question
                title="Open the phone app."
                onNext={() => setNativeAsk(false)}
                nextLabel="Back"
                effectsEnabled={effectsEnabled}
            />
        )
    }

    return (
        <VStack gap={10} align="stretch" maxW="lg" mx="auto">
            <VStack gap={3}>
                <Text fontSize={{ base: '4xl', md: '6xl' }} fontWeight="bold" letterSpacing="-0.04em" textAlign="center">
                    @{me.handle}
                </Text>
                <Text textAlign="center" color="gray.500">
                    {me.email}
                </Text>
            </VStack>

            <Stack gap={3}>
                <Text fontWeight="medium">Wallets</Text>
                {me.wallets.map((w) => (
                    <Stack key={w.address} gap={1}>
                        <Link href={addressUrl(w.address)} target="_blank" fontFamily="mono" fontSize="sm">
                            {w.address}
                            {me.payout === w.address ? ' · payout' : ''}
                        </Link>
                        {me.payout !== w.address ? (
                            <BigButton size="sm" h="10" fontSize="md" minW="auto" onClick={() => void payout(w.address)}>
                                Make payout
                            </BigButton>
                        ) : null}
                    </Stack>
                ))}
                <BigButton onClick={() => void linkWallet()}>Link wallet</BigButton>
                <BigButton variant="outline" onClick={() => void claimOnchain()}>
                    Claim
                </BigButton>
            </Stack>

            <Stack gap={3}>
                <Text fontWeight="medium">Socials</Text>
                {(['x', 'threads', 'instagram', 'tiktok'] as const).map((k) => (
                    <BigInput
                        key={k}
                        placeholder={k}
                        value={socials[k]}
                        onChange={(e) => setSocials({ ...socials, [k]: e.target.value })}
                    />
                ))}
                <BigButton onClick={() => void saveSocials()}>Save</BigButton>
            </Stack>

            {err ? <Text color="red.500">{err}</Text> : null}
            <BigButton
                variant="ghost"
                onClick={() => {
                    clearSession()
                    onMe(null)
                    setView({ view: null, i: null })
                }}
            >
                Sign out
            </BigButton>
        </VStack>
    )
}
