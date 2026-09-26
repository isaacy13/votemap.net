import type { Network } from "./urls";
import { oauthCallbackUrl } from "./config";

export function oauthStartUrl(network: Network, wallet: string): string {
    const base = oauthCallbackUrl();
    if (!base) throw new Error("NEXT_PUBLIC_OAUTH_CALLBACK_URL is not set");
    const u = new URL(base);
    u.searchParams.set("action", "start");
    u.searchParams.set("network", network);
    u.searchParams.set("wallet", wallet);
    return u.toString();
}

export type BindQuery = {
    network: Network;
    handle: string;
    deadline: number;
    signature: `0x${string}`;
};

export function readBindQuery(params: URLSearchParams): BindQuery | null {
    const network = params.get("bind_network");
    const handle = params.get("bind_handle");
    const deadline = params.get("bind_deadline");
    const signature = params.get("bind_sig");
    if (!network || !handle || !deadline || !signature) return null;
    if (network !== "x" && network !== "threads") return null;
    if (!signature.startsWith("0x")) return null;
    return {
        network,
        handle,
        deadline: Number(deadline),
        signature: signature as `0x${string}`,
    };
}
