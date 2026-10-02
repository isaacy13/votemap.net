import { keccak256, toBytes, type Hex } from "viem";

/** Same as VoteMap.sol `issueIdOf` — keccak256(bytes(canonical)). Pot key is the permalink. */
export function potHash(canonical: string): Hex {
    return keccak256(toBytes(canonical));
}
