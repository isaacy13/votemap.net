'use client'

import { Box, Flex, IconButton, Input, Link, Stack, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { FaArrowDown, FaArrowUp, FaCheckCircle, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa'
import { api, type Me } from '../api'
import { signLinkMessage, submitClaim } from '../chain'
import { addressUrl, apiUrl } from '../config'
import { VoteMap, isNativeApp } from '../plugin'
import { bindLive, profilePath, type ProfileLink } from '../profile'
import { clearSession, readSessionToken } from '../session'
import { useRouter } from 'next/navigation'
import { BigButton } from '../ui/BigButton'
import { BigInput } from '../ui/BigInput'
import { Question } from '../ui/Question'

function LinksEditor({ me, onMe, onErr }: { me: Me; onMe: (m: Me) => void; onErr: (s: string) => void }) {
    const [rows, setRows] = useState<ProfileLink[]>(() => [...(me.links || [])].sort((a, b) => a.order - b.order))
    const [label, setLabel] = useState('')
    const [url, setUrl] = useState('')

    function move(i: number, dir: -1 | 1) {
        const j = i + dir
        if (j < 0 || j >= rows.length) return
        const next = [...rows]
        const tmp = next[i]
        next[i] = next[j]
        next[j] = tmp
        setRows(next.map((r, order) => ({ ...r, order })))
    }

    async function save(nextRows: ProfileLink[]) {
        onErr('')
        try {
            onMe(await api<Me>('/profile/links', { method: 'POST', body: JSON.stringify({ links: nextRows }) }))
            setRows(nextRows)
        } catch (e) {
            onErr(e instanceof Error ? e.message : 'error')
        }
    }

    return (
        <Stack gap={3}>
            <Flex justify="space-between" align="baseline" gap={3}>
                <Text fontWeight="medium">Public links</Text>
                {me.handle ? (
                    <Link href={profilePath(me.handle)} fontSize="sm" color="gray.500">
                        {profilePath(me.handle)}
                    </Link>
                ) : null}
            </Flex>
            <Text fontSize="sm" color="gray.500">
                Hide a social here without dropping the bio bind. Custom URLs are never verified.
            </Text>
            {rows.map((row, i) => {
                const verified = Boolean(row.bindNetwork && bindLive(me.binds?.[row.bindNetwork]))
                return (
                    <Box
                        key={row.id}
                        p={4}
                        rounded="2xl"
                        borderWidth="1px"
                        borderColor="gray.200"
                        _dark={{ borderColor: 'gray.700' }}
                    >
                        <Flex gap={2} align="center" mb={2}>
                            <Input
                                value={row.label}
                                onChange={(e) => {
                                    const next = rows.map((r, n) => (n === i ? { ...r, label: e.target.value } : r))
                                    setRows(next)
                                }}
                                fontWeight="medium"
                            />
                            {verified ? (
                                <Flex align="center" gap={1} color="blue.500" flexShrink={0} fontSize="xs">
                                    <FaCheckCircle />
                                    verified
                                </Flex>
                            ) : (
                                <Text fontSize="xs" color="gray.500" flexShrink={0}>
                                    unverified
                                </Text>
                            )}
                        </Flex>
                        <Input
                            value={row.url}
                            onChange={(e) => {
                                if (row.bindNetwork) return
                                const next = rows.map((r, n) => (n === i ? { ...r, url: e.target.value } : r))
                                setRows(next)
                            }}
                            fontFamily="mono"
                            fontSize="sm"
                            readOnly={Boolean(row.bindNetwork)}
                            mb={2}
                        />
                        <Flex gap={1} wrap="wrap">
                            <IconButton
                                aria-label={row.hidden ? 'Show' : 'Hide'}
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const next = rows.map((r, n) => (n === i ? { ...r, hidden: !r.hidden } : r))
                                    setRows(next)
                                }}
                            >
                                {row.hidden ? <FaEyeSlash /> : <FaEye />}
                            </IconButton>
                            <IconButton aria-label="Up" size="sm" variant="ghost" onClick={() => move(i, -1)}>
                                <FaArrowUp />
                            </IconButton>
                            <IconButton aria-label="Down" size="sm" variant="ghost" onClick={() => move(i, 1)}>
                                <FaArrowDown />
                            </IconButton>
                            {row.bindNetwork ? null : (
                                <IconButton
                                    aria-label="Remove"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRows(rows.filter((_, n) => n !== i).map((r, order) => ({ ...r, order })))}
                                >
                                    <FaTrash />
                                </IconButton>
                            )}
                        </Flex>
                    </Box>
                )
            })}
            <Input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Input placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
            <BigButton
                size="sm"
                h="10"
                fontSize="md"
                minW="auto"
                onClick={() => {
                    if (!label.trim() || !url.trim()) return
                    setRows([
                        ...rows,
                        {
                            id: `new-${rows.length}`,
                            label: label.trim(),
                            url: url.trim(),
                            order: rows.length,
                            hidden: false,
                            bindNetwork: null,
                        },
                    ])
                    setLabel('')
                    setUrl('')
                }}
            >
                Add link
            </BigButton>
            <BigButton onClick={() => void save(rows)}>Save links</BigButton>
        </Stack>
    )
}

export function Profile({ me, onMe, effectsEnabled }: { me: Me; onMe: (m: Me | null) => void; effectsEnabled: boolean }) {
    const router = useRouter()
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

            <LinksEditor me={me} onMe={onMe} onErr={setErr} />

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
                    router.push('/')
                }}
            >
                Sign out
            </BigButton>
        </VStack>
    )
}
