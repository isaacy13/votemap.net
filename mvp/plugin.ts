import { registerPlugin, WebPlugin } from "@capacitor/core";

/**
 * Native VoteMap plugin.
 *
 * The HTML Stake button may call VoteMap.stake(...). That means “please start a
 * stake,” not “biometrics passed.” The web implementation never signs. iOS /
 * Android prompt Face ID / Class 3 (no PIN fallback), sign with the enclave /
 * keystore, then HTTPS to the signer. sendOk() from JavaScript is ignored.
 */

export type Capabilities = {
    native: boolean;
    biometrics: boolean;
    strong: boolean;
};

export type SignResult = {
    signature: `0x${string}`;
    nonce: string;
    deadline: number;
    url?: string;
    oidcSubHash?: `0x${string}`;
    email?: string;
    name?: string;
    gender?: number;
    birthYear?: number;
    phoneHash?: `0x${string}`;
    phoneVerified?: boolean;
};

export type StakeArgs = {
    apiUrl: string;
    sessionToken: string;
    url: string;
    amount: string;
    expiry: number;
    staker: `0x${string}`;
};

export type PayArgs = {
    apiUrl: string;
    sessionToken: string;
    issueId: `0x${string}`;
    solver: `0x${string}`;
    staker: `0x${string}`;
};

export type ClaimArgs = {
    apiUrl: string;
    sessionToken: string;
    wallet: `0x${string}`;
};

export interface VoteMapPlugin {
    capabilities(): Promise<Capabilities>;
    registerDevice(args: { apiUrl: string; sessionToken: string }): Promise<{ ok: true }>;
    stake(args: StakeArgs): Promise<SignResult>;
    pay(args: PayArgs): Promise<SignResult>;
    claim(args: ClaimArgs): Promise<SignResult>;
}

const WEB_READONLY = "Open the phone app to stake.";

class VoteMapWeb extends WebPlugin implements VoteMapPlugin {
    async capabilities(): Promise<Capabilities> {
        return { native: false, biometrics: false, strong: false };
    }

    async registerDevice(): Promise<{ ok: true }> {
        throw new Error(WEB_READONLY);
    }

    async stake(): Promise<SignResult> {
        throw new Error(WEB_READONLY);
    }

    async pay(): Promise<SignResult> {
        throw new Error(WEB_READONLY);
    }

    async claim(): Promise<SignResult> {
        throw new Error(WEB_READONLY);
    }

    /** Intentionally unused. The signer has no sendOk endpoint. */
    async sendOk(): Promise<never> {
        throw new Error("sendOk is ignored. The signer only accepts a hardware signature from the native plugin.");
    }
}

export const VoteMap = registerPlugin<VoteMapPlugin>("VoteMap", {
    web: () => Promise.resolve(new VoteMapWeb()),
});

export async function isNativeApp(): Promise<boolean> {
    try {
        const c = await VoteMap.capabilities();
        return c.native;
    } catch {
        return false;
    }
}
