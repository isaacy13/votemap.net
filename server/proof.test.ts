import assert from "node:assert/strict";
import { test } from "node:test";
import { assertDeviceProof } from "./proof";

test("sendOk without a hardware signature is rejected", () => {
    assert.throws(
        () => assertDeviceProof({ sendOk: true, biometricOk: true, jsOk: true }),
        /device proof required/,
    );
});

test("hardware signature + challenge is accepted as the only proof", () => {
    const got = assertDeviceProof({
        sendOk: false,
        challengeId: "abc",
        deviceSig: "0xdead",
    });
    assert.equal(got.challengeId, "abc");
    assert.equal(got.deviceSig, "0xdead");
});
