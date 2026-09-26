/** Device proof for the signer. JS sendOk / biometricOk is never consulted. */

export type HttpError = Error & { status: number };

export function fail(status: number, message: string): never {
    const err = new Error(message) as HttpError;
    err.status = status;
    throw err;
}

export function assertDeviceProof(body: Record<string, unknown>): { challengeId: string; deviceSig: string } {
    void body.sendOk;
    void body.biometricOk;
    void body.jsOk;
    void body.ok;
    const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
    const deviceSig = typeof body.deviceSig === "string" ? body.deviceSig.trim() : "";
    if (!challengeId || !deviceSig) {
        fail(401, "device proof required (native hardware signature). sendOk is ignored.");
    }
    return { challengeId, deviceSig };
}
