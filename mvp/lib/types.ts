import type { Network, ParsedPost } from "./urls";

export type { Network, ParsedPost };

export type TxResult = { hash: string; mock?: boolean };

export type StakeRow = {
    wallet: string;
    amount: bigint;
    expiry: number;
    closed: boolean;
};

export type Issue = {
    id: `0x${string}`;
    url: string;
    parsed: ParsedPost | null;
    total: bigint;
    stakers: StakeRow[];
};

export type Handles = { x: string; threads: string };

export type BindAttestation = {
    network: Network;
    handle: string;
    deadline: number;
    signature: `0x${string}`;
};

export type VoteMapApi = {
    listIssues(): Promise<Issue[]>;
    getIssue(canonicalUrl: string): Promise<Issue | null>;
    handlesOf(wallet: string): Promise<Handles>;
    walletOfHandle(network: Network, handle: string): Promise<string | null>;
    stake(canonicalUrl: string, expiry: number, amount: bigint, from: string): Promise<TxResult>;
    paySolver(canonicalUrl: string, network: Network, handle: string, from: string): Promise<TxResult>;
    withdrawEarly(canonicalUrl: string, from: string): Promise<TxResult>;
    withdrawExpired(canonicalUrl: string, from: string): Promise<TxResult>;
    bindHandle(attestation: BindAttestation, from: string): Promise<TxResult>;
    usdcBalance?(wallet: string): Promise<bigint>;
};
