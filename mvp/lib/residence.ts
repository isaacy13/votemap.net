import { createPublicClient, http, zeroHash } from "viem";
import { easAbi, indexerAbi } from "./abi";
import {
    chainMode,
    coinbaseIndexer,
    EAS_OP_PREDEPLOY,
    publicRpc,
    verifiedCountrySchema,
    viemChain,
} from "./config";

const MOCK_KEY = "votemap-mvp-residence-v1";

function mockMap(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(window.localStorage.getItem(MOCK_KEY) || "{}") as Record<string, string>;
    } catch {
        return {};
    }
}

/** Testnet / mock: a local checkbox. Mainnet: Coinbase Verified Country on EAS. */
export function mockResidenceOnThisChain(): boolean {
    return chainMode() !== "base";
}

export function getMockResidence(wallet: string): string | null {
    return mockMap()[wallet.toLowerCase()] ?? null;
}

export function setMockResidence(wallet: string, country: string) {
    const m = mockMap();
    m[wallet.toLowerCase()] = country.toUpperCase();
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(m));
}

export async function checkResidence(wallet: string): Promise<{ ok: boolean; country: string | null; source: string }> {
    if (mockResidenceOnThisChain()) {
        const c = getMockResidence(wallet);
        return { ok: Boolean(c), country: c, source: "mock" };
    }
    const pub = createPublicClient({ chain: viemChain(), transport: http(publicRpc()) });
    const uid = (await pub.readContract({
        address: coinbaseIndexer(),
        abi: indexerAbi,
        functionName: "getAttestationUid",
        args: [wallet as `0x${string}`, verifiedCountrySchema()],
    })) as `0x${string}`;
    if (!uid || uid === zeroHash) {
        return { ok: false, country: null, source: "coinbase" };
    }
    const att = (await pub.readContract({
        address: EAS_OP_PREDEPLOY,
        abi: easAbi,
        functionName: "getAttestation",
        args: [uid],
    })) as { revocationTime: bigint; expirationTime: bigint };
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (att.revocationTime !== BigInt(0)) return { ok: false, country: null, source: "coinbase" };
    if (att.expirationTime !== BigInt(0) && att.expirationTime < now) {
        return { ok: false, country: null, source: "coinbase" };
    }
    return { ok: true, country: "attested", source: "coinbase" };
}
