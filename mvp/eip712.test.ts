import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const STAKE = "Stake(address staker,string url,uint256 amount,uint64 expiry,uint256 nonce,uint256 deadline)";
const PAY = "Pay(address staker,bytes32 issueId,address solver,uint256 nonce,uint256 deadline)";
const CLAIM =
    "Claim(address wallet,bytes32 oidcSubHash,string email,string name,uint8 gender,uint16 birthYear,bytes32 phoneHash,bool phoneVerified,uint256 nonce,uint256 deadline)";

test("VoteMap.sol EIP-712 type strings stay in sync", () => {
    const sol = readFileSync(new URL("./VoteMap.sol", import.meta.url), "utf8");
    assert.ok(sol.includes(STAKE), "Stake typehash");
    assert.ok(sol.includes(PAY), "Pay typehash");
    assert.ok(sol.includes(CLAIM), "Claim typehash");
    assert.ok(sol.includes('keccak256("votemap")'));
    assert.ok(!sol.includes("function stake(") || sol.includes("bytes calldata votemapSig"));
    assert.ok(sol.includes("https://threads.net/"));
    assert.ok(sol.includes("https://threads.com/"));
    assert.ok(sol.includes("https://x.com/"));
    assert.ok(!/function stake\([^)]*country/.test(sol), "no country argument on stake");
});
