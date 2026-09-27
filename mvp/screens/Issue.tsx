'use client'

import { Box, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import type { Me } from '../api'
import {
    getIssue,
    issueId,
    submitPay,
    submitStake,
    withdrawEarly,
    withdrawExpired,
    type Issue,
} from '../chain'
import { addressUrl, apiUrl, formatUsdc, parseUsdc, siteUrl, txUrl } from '../config'
import { VoteMap, isNativeApp } from '../plugin'
import { readSessionToken, setView } from '../session'
import { parsePostUrl } from '../urls'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { PostEmbed } from '../ui/PostEmbed'
import { QrCard } from '../ui/QrCard'
import { Question } from '../ui/Question'

type StakeStep = 'idle' | 'amount' | 'days' | 'working' | 'pay' | 'withdraw'

export function IssueView({
    canonical,
    me,
    effectsEnabled,
}: {
    canonical: string
    me: Me | null
    effectsEnabled: boolean
}) {
    const parsed = useMemo(() => parsePostUrl(canonical), [canonical])
    const url = parsed?.canonical || canonical
    const share = `${siteUrl()}/mvp?i=${encodeURIComponent(url)}`
    const [issue, setIssue] = useState<Issue | null>(null)
    const [err, setErr] = useState('')
    const [tx, setTx] = useState('')
    const [native, setNative] = useState(false)
    const [step, setStep] = useState<StakeStep>('idle')
    const [amount, setAmount] = useState('1')
    const [days, setDays] = useState('30')
    const [solver, setSolver] = useState('')

    useEffect(() => {
        isNativeApp().then(setNative)
        getIssue(url)
            .then(setIssue)
            .catch((e: Error) => setErr(e.message))
    }, [url])

    async function shareSheet() {
        try {
            if (navigator.share) await navigator.share({ title: 'votemap', url: share })
            else await navigator.clipboard.writeText(share)
        } catch {
            /* user cancelled */
        }
    }

    async function reload() {
        setIssue(await getIssue(url))
    }

    async function stakeNow() {
        setErr('')
        setStep('working')
        try {
            const token = readSessionToken()
            const staker = me?.payout as `0x${string}` | undefined
            if (!token || !staker) throw new Error('Sign in and link a wallet first.')
            const units = parseUsdc(amount)
            const expiry = Math.floor(Date.now() / 1000) + Number(days) * 86400
            const signed = await VoteMap.stake({
                apiUrl: apiUrl(),
                sessionToken: token,
                url,
                amount: units.toString(),
                expiry,
                staker,
            })
            const hash = await submitStake({
                canonicalUrl: signed.url || url,
                expiry,
                amount: units,
                nonce: BigInt(signed.nonce),
                deadline: signed.deadline,
                signature: signed.signature,
                from: staker,
            })
            setTx(hash)
            await reload()
            setStep('idle')
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'stake failed')
            setStep('idle')
        }
    }

    async function payNow() {
        setErr('')
        setStep('working')
        try {
            const token = readSessionToken()
            const staker = me?.payout as `0x${string}` | undefined
            if (!token || !staker) throw new Error('Sign in and link a wallet first.')
            const id = await issueId(url)
            const signed = await VoteMap.pay({
                apiUrl: apiUrl(),
                sessionToken: token,
                issueId: id,
                solver: solver as `0x${string}`,
                staker,
            })
            const hash = await submitPay({
                canonicalUrl: url,
                solver: solver as `0x${string}`,
                nonce: BigInt(signed.nonce),
                deadline: signed.deadline,
                signature: signed.signature,
                from: staker,
            })
            setTx(hash)
            await reload()
            setStep('idle')
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'pay failed')
            setStep('idle')
        }
    }

    async function withdraw(kind: 'early' | 'expired') {
        setErr('')
        try {
            const from = me?.payout
            if (!from) throw new Error('Link a wallet.')
            const hash = kind === 'early' ? await withdrawEarly(url, from) : await withdrawExpired(url, from)
            setTx(hash)
            await reload()
            setStep('idle')
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'withdraw failed')
        }
    }

    if (!parsed) {
        return (
            <Question title="Not an X or Threads post." onNext={() => setView({ view: 'browse', i: null })} nextLabel="Browse" effectsEnabled={effectsEnabled} />
        )
    }

    if (step === 'amount') {
        return (
            <Question
                title="How many USDC?"
                onNext={() => setStep('days')}
                onBack={() => setStep('idle')}
                nextDisabled={(() => {
                    try {
                        return parseUsdc(amount) < BigInt(1_000_000)
                    } catch {
                        return true
                    }
                })()}
                effectsEnabled={effectsEnabled}
            >
                <BigInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Question>
        )
    }

    if (step === 'days') {
        return (
            <Question
                title="How many days?"
                onNext={() => void stakeNow()}
                onBack={() => setStep('amount')}
                nextLabel="Stake"
                nextDisabled={!/^\d+$/.test(days) || Number(days) < 1}
                effectsEnabled={effectsEnabled}
            >
                <SimpleGrid columns={3} gap={3} mb={4}>
                    {['7', '30', '90'].map((d) => (
                        <BigButton key={d} minW="auto" w="full" variant={days === d ? 'solid' : 'surface'} onClick={() => setDays(d)}>
                            {d}d
                        </BigButton>
                    ))}
                </SimpleGrid>
                <BigInput inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </Question>
        )
    }

    if (step === 'pay') {
        return (
            <Question
                title="Pay whom?"
                hint="1.5% fee."
                onNext={() => void payNow()}
                onBack={() => setStep('idle')}
                nextLabel="Pay"
                nextDisabled={!/^0x[a-fA-F0-9]{40}$/.test(solver)}
                effectsEnabled={effectsEnabled}
            >
                <BigInput placeholder="0x…" value={solver} onChange={(e) => setSolver(e.target.value.trim())} />
            </Question>
        )
    }

    if (step === 'withdraw') {
        return (
            <Question title="Withdraw?" hint="10% now, 5% after the date." onBack={() => setStep('idle')} effectsEnabled={effectsEnabled}>
                <VStack gap={3}>
                    <BigButton w="full" onClick={() => void withdraw('early')}>
                        Now
                    </BigButton>
                    <BigButton w="full" variant="outline" onClick={() => void withdraw('expired')}>
                        After the date
                    </BigButton>
                </VStack>
            </Question>
        )
    }

    const live = issue?.live ?? BigInt(0)

    return (
        <VStack gap={0} align="stretch">
            <PostEmbed parsed={parsed} url={url} />
            <Text mt={8} textAlign="center" fontSize={{ base: '4xl', md: '6xl' }} fontWeight="bold" letterSpacing="-0.04em">
                {formatUsdc(live)} USDC
            </Text>
            {issue && issue.byCountry.length > 0 ? (
                <Stack gap={1} maxW="md" mx="auto" w="full" mt={4}>
                    {issue.byCountry.map((row) => (
                        <Text key={row.country} textAlign="center" color="gray.500">
                            {row.country || '—'} · {formatUsdc(row.live)} USDC
                        </Text>
                    ))}
                </Stack>
            ) : null}

            {!native ? (
                <VStack mt={8} gap={4}>
                    <QrCard value={share} label="Open on your phone to stake" />
                    <BigButton onClick={() => void shareSheet()}>Share</BigButton>
                </VStack>
            ) : (
                <VStack mt={8} gap={4}>
                    <BigButton onClick={() => setStep('amount')} disabled={step === 'working'}>
                        Stake
                    </BigButton>
                    <BigButton variant="outline" onClick={() => setStep('pay')} disabled={step === 'working'}>
                        Pay
                    </BigButton>
                </VStack>
            )}

            <Box mt={8} textAlign="center">
                <BigButton variant="ghost" onClick={() => setStep('withdraw')}>
                    Withdraw
                </BigButton>
            </Box>

            {tx ? (
                <Text mt={6} textAlign="center">
                    <Link href={txUrl(tx)} target="_blank" textDecoration="underline">
                        Basescan
                    </Link>
                </Text>
            ) : null}
            {err ? (
                <Text mt={4} color="red.500" textAlign="center">
                    {err}
                </Text>
            ) : null}

            {issue && issue.stakers.length > 0 ? (
                <Box maxW="720px" mx="auto" w="full" mt={10}>
                    {issue.stakers.map((s) => (
                        <Box key={s.wallet} py={3} borderBottomWidth="1px" borderColor="gray.100" _dark={{ borderColor: 'gray.800' }}>
                            <Link href={addressUrl(s.wallet)} target="_blank" fontFamily="mono" fontSize="sm">
                                {s.wallet.slice(0, 6)}…{s.wallet.slice(-4)}
                            </Link>
                            <Text>
                                {formatUsdc(s.amount)} USDC
                                {s.closed ? ' · closed' : ` · ${new Date(s.expiry * 1000).toLocaleDateString()}`}
                            </Text>
                        </Box>
                    ))}
                </Box>
            ) : null}
        </VStack>
    )
}
