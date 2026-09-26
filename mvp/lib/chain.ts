import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    getAddress,
    maxUint256,
    zeroAddress,
    type Hex,
} from "viem";
import { voteMapAbi, erc20Abi } from "./abi";
import {
    contractAddress,
    publicRpc,
    usdcAddress,
    viemChain,
} from "./config";
import { networkByte, parsePostUrl } from "./urls";
import type { BindAttestation, Handles, Issue, TxResult, VoteMapApi } from "./types";

function injected() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("No injected wallet. Install Coinbase Wallet or MetaMask.");
    }
    return window.ethereum;
}

function publicClient() {
    return createPublicClient({ chain: viemChain(), transport: http(publicRpc()) });
}

function walletClient() {
    return createWalletClient({
        chain: viemChain(),
        transport: custom(injected()),
    });
}

function contract(): `0x${string}` {
    const a = contractAddress();
    if (!a) throw new Error("NEXT_PUBLIC_VOTEMAP_CONTRACT is not set");
    return a;
}

async function send(
    account: `0x${string}`,
    abi: typeof voteMapAbi | typeof erc20Abi,
    address: `0x${string}`,
    functionName: string,
    args: unknown[],
): Promise<TxResult> {
    const wallet = walletClient();
    const pub = publicClient();
    const hash = await wallet.writeContract({
        account,
        address,
        abi,
        functionName,
        args,
        chain: viemChain(),
    } as never);
    await pub.waitForTransactionReceipt({ hash });
    return { hash };
}

async function loadIssue(id: Hex, urlHint?: string): Promise<Issue | null> {
    const pub = publicClient();
    const address = contract();
    const url =
        urlHint ||
        ((await pub.readContract({
            address,
            abi: voteMapAbi,
            functionName: "issueUrl",
            args: [id],
        })) as string);
    if (!url) return null;
    const total = (await pub.readContract({
        address,
        abi: voteMapAbi,
        functionName: "issueTotal",
        args: [id],
    })) as bigint;
    const n = (await pub.readContract({
        address,
        abi: voteMapAbi,
        functionName: "stakerCount",
        args: [id],
    })) as bigint;
    const stakers = [];
    for (let i = 0; i < Number(n); i++) {
        const row = (await pub.readContract({
            address,
            abi: voteMapAbi,
            functionName: "getStakerAt",
            args: [id, BigInt(i)],
        })) as [string, bigint, bigint | number, boolean];
        stakers.push({
            wallet: getAddress(row[0]),
            amount: row[1],
            expiry: Number(row[2]),
            closed: row[3],
        });
    }
    return { id, url, parsed: parsePostUrl(url), total, stakers };
}

export async function ensureChain(): Promise<void> {
    const eth = injected();
    const id = `0x${viemChain().id.toString(16)}`;
    try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: id }] });
    } catch (e: unknown) {
        const code = (e as { code?: number }).code;
        if (code !== 4902) throw e;
        const chain = viemChain();
        await eth.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: id,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: [publicRpc()],
                    blockExplorerUrls: [chain.blockExplorers?.default.url].filter(Boolean),
                },
            ],
        });
    }
}

export function createChainApi(): VoteMapApi {
    return {
        async listIssues() {
            const pub = publicClient();
            const address = contract();
            const n = (await pub.readContract({
                address,
                abi: voteMapAbi,
                functionName: "issueCount",
            })) as bigint;
            const out: Issue[] = [];
            for (let i = 0; i < Number(n); i++) {
                const id = (await pub.readContract({
                    address,
                    abi: voteMapAbi,
                    functionName: "issueIds",
                    args: [BigInt(i)],
                })) as Hex;
                const issue = await loadIssue(id);
                if (issue) out.push(issue);
            }
            return out;
        },
        async getIssue(canonicalUrl) {
            const pub = publicClient();
            const id = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "issueIdOf",
                args: [canonicalUrl],
            })) as Hex;
            const stored = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "issueUrl",
                args: [id],
            })) as string;
            if (!stored) return null;
            return loadIssue(id, stored);
        },
        async handlesOf(wallet) {
            const pub = publicClient();
            const pair = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "handlesOf",
                args: [getAddress(wallet)],
            })) as [string, string];
            return { x: pair[0], threads: pair[1] } satisfies Handles;
        },
        async walletOfHandle(network, handle) {
            const pub = publicClient();
            const key = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "handleKey",
                args: [networkByte(network), handle],
            })) as Hex;
            const w = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "walletOfHandle",
                args: [key],
            })) as string;
            return !w || w === zeroAddress ? null : getAddress(w);
        },
        async stake(canonicalUrl, expiry, amount, from) {
            await ensureChain();
            const account = getAddress(from);
            const usdc = usdcAddress();
            const factory = contract();
            const pub = publicClient();
            const allowance = (await pub.readContract({
                address: usdc,
                abi: erc20Abi,
                functionName: "allowance",
                args: [account, factory],
            })) as bigint;
            if (allowance < amount) {
                await send(account, erc20Abi, usdc, "approve", [factory, maxUint256]);
            }
            return send(account, voteMapAbi, factory, "stake", [
                canonicalUrl,
                BigInt(expiry),
                amount,
            ]);
        },
        async paySolver(canonicalUrl, network, handle, from) {
            await ensureChain();
            const account = getAddress(from);
            const pub = publicClient();
            const id = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "issueIdOf",
                args: [canonicalUrl],
            })) as Hex;
            return send(account, voteMapAbi, contract(), "paySolver", [
                id,
                networkByte(network),
                handle,
            ]);
        },
        async withdrawEarly(canonicalUrl, from) {
            await ensureChain();
            const account = getAddress(from);
            const pub = publicClient();
            const id = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "issueIdOf",
                args: [canonicalUrl],
            })) as Hex;
            return send(account, voteMapAbi, contract(), "withdrawEarly", [id]);
        },
        async withdrawExpired(canonicalUrl, from) {
            await ensureChain();
            const account = getAddress(from);
            const pub = publicClient();
            const id = (await pub.readContract({
                address: contract(),
                abi: voteMapAbi,
                functionName: "issueIdOf",
                args: [canonicalUrl],
            })) as Hex;
            return send(account, voteMapAbi, contract(), "withdrawExpired", [id]);
        },
        async bindHandle(attestation: BindAttestation, from: string) {
            await ensureChain();
            const account = getAddress(from);
            return send(account, voteMapAbi, contract(), "bindHandle", [
                networkByte(attestation.network),
                attestation.handle,
                BigInt(attestation.deadline),
                attestation.signature,
            ]);
        },
        async usdcBalance(wallet: string) {
            const pub = publicClient();
            return (await pub.readContract({
                address: usdcAddress(),
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [getAddress(wallet)],
            })) as bigint;
        },
    };
}
