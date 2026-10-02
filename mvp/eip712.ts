/** Must match VoteMap.sol typehashes. */

export const EIP712_NAME = "votemap" as const;
export const EIP712_VERSION = "1" as const;

export const stakeTypes = {
    Stake: [
        { name: "staker", type: "address" },
        { name: "url", type: "string" },
        { name: "amount", type: "uint256" },
        { name: "expiry", type: "uint64" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
} as const;

export const payTypes = {
    Pay: [
        { name: "staker", type: "address" },
        { name: "issueId", type: "bytes32" },
        { name: "solver", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
} as const;

export const claimTypes = {
    Claim: [
        { name: "wallet", type: "address" },
        { name: "oidcSubHash", type: "bytes32" },
        { name: "email", type: "string" },
        { name: "name", type: "string" },
        { name: "gender", type: "uint8" },
        { name: "birthYear", type: "uint16" },
        { name: "phoneHash", type: "bytes32" },
        { name: "phoneVerified", type: "bool" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
    ],
} as const;

export function domain(chainId: number, verifyingContract: `0x${string}`) {
    return {
        name: EIP712_NAME,
        version: EIP712_VERSION,
        chainId,
        verifyingContract,
    };
}
