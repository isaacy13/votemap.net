import assert from "node:assert/strict";
import { test } from "node:test";
import { keccak256, toBytes } from "viem";
import { potHash } from "./issueId";

test("potHash matches Solidity keccak256(bytes(url))", () => {
    const url = "https://x.com/i/status/1234567890123456789";
    assert.equal(potHash(url), keccak256(toBytes(url)));
    assert.equal(potHash(url), potHash(url));
    assert.notEqual(potHash(url), potHash(url + "/"));
});
