import Foundation
import Capacitor
import LocalAuthentication
import Security

@objc(VoteMapPlugin)
public class VoteMapPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VoteMapPlugin"
    public let jsName = "VoteMap"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "capabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "registerDevice", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stake", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "claim", returnType: CAPPluginReturnPromise)
    ]

    private let keyTag = "net.votemap.device-key"

    @objc func capabilities(_ call: CAPPluginCall) {
        call.resolve(self.bioState())
    }

    @objc func registerDevice(_ call: CAPPluginCall) {
        Task { await self.enroll(call) }
    }

    @objc func stake(_ call: CAPPluginCall) {
        Task { await self.signPath(call, path: "/sign/stake") }
    }

    @objc func pay(_ call: CAPPluginCall) {
        Task { await self.signPath(call, path: "/sign/pay") }
    }

    @objc func claim(_ call: CAPPluginCall) {
        Task { await self.signPath(call, path: "/sign/claim") }
    }

    private func bioState() -> [String: Any] {
        let ctx = LAContext()
        ctx.localizedFallbackTitle = ""
        var err: NSError?
        let ok = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err)
        let strong = ok && ctx.biometryType != .none
        return ["native": true, "biometrics": ok, "strong": strong]
    }

    private func requireStrongBiometrics() throws {
        let state = bioState()
        if state["strong"] as? Bool != true {
            throw PluginError("Face ID / Touch ID is not enrolled. votemap does not allow a PIN or passcode fallback.")
        }
    }

    private func enroll(_ call: CAPPluginCall) async {
        do {
            try requireStrongBiometrics()
            let apiUrl = try need(call, "apiUrl")
            let token = try need(call, "sessionToken")
            _ = try key()
            let challenge = try await post(apiUrl: apiUrl, path: "/sign/challenge", token: token, body: [:])
            let cid = challenge["challengeId"] as? String ?? ""
            let bytes = challenge["challenge"] as? String ?? ""
            let sig = try sign(hex: bytes)
            _ = try await post(
                apiUrl: apiUrl,
                path: "/device/register",
                token: token,
                body: ["challengeId": cid, "deviceSig": sig, "pubkey": try pubHex(), "platform": "ios"]
            )
            call.resolve(["ok": true])
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    private func signPath(_ call: CAPPluginCall, path: String) async {
        do {
            try requireStrongBiometrics()
            let apiUrl = try need(call, "apiUrl")
            let token = try need(call, "sessionToken")
            _ = try key()
            let challenge = try await post(apiUrl: apiUrl, path: "/sign/challenge", token: token, body: [:])
            let cid = challenge["challengeId"] as? String ?? ""
            let bytes = challenge["challenge"] as? String ?? ""
            let deviceSig = try sign(hex: bytes)
            var body = call.options ?? [:]
            body["challengeId"] = cid
            body["deviceSig"] = deviceSig
            body.removeValue(forKey: "sendOk")
            body.removeValue(forKey: "biometricOk")
            let signed = try await post(apiUrl: apiUrl, path: path, token: token, body: body)
            call.resolve(signed)
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    private func need(_ call: CAPPluginCall, _ key: String) throws -> String {
        guard let v = call.getString(key), !v.isEmpty else { throw PluginError("missing \(key)") }
        return v
    }

    private func key() throws -> SecKey {
        if let existing = loadKey() { return existing }
        var err: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage, .biometryCurrentSet],
            &err
        ) else {
            throw PluginError("could not bind key to biometrics (no PIN fallback)")
        }
        let attrs: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: keyTag.data(using: .utf8) as Any,
                kSecAttrAccessControl as String: access
            ]
        ]
        guard let priv = SecKeyCreateRandomKey(attrs as CFDictionary, &err) else {
            throw PluginError("Secure Enclave key failed. Enroll Face ID.")
        }
        return priv
    }

    private func loadKey() -> SecKey? {
        let q: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: keyTag.data(using: .utf8) as Any,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecReturnRef as String: true
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(q as CFDictionary, &item)
        return status == errSecSuccess ? (item as! SecKey) : nil
    }

    private func pubHex() throws -> String {
        let priv = try key()
        guard let pub = SecKeyCopyPublicKey(priv) else { throw PluginError("pubkey") }
        var err: Unmanaged<CFError>?
        guard let data = SecKeyCopyExternalRepresentation(pub, &err) as Data? else { throw PluginError("pubkey export") }
        return data.map { String(format: "%02x", $0) }.joined()
    }

    private func sign(hex: String) throws -> String {
        let priv = try key()
        var bytes = Data()
        var tmp = hex
        if tmp.count % 2 == 1 { tmp = "0" + tmp }
        var idx = tmp.startIndex
        while idx < tmp.endIndex {
            let next = tmp.index(idx, offsetBy: 2)
            bytes.append(UInt8(tmp[idx..<next], radix: 16) ?? 0)
            idx = next
        }
        var err: Unmanaged<CFError>?
        guard let sig = SecKeyCreateSignature(
            priv,
            .ecdsaSignatureMessageX962SHA256,
            bytes as CFData,
            &err
        ) as Data? else {
            throw PluginError("Face ID cancelled or key unavailable")
        }
        return sig.map { String(format: "%02x", $0) }.joined()
    }

    private func post(apiUrl: String, path: String, token: String, body: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: apiUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + path) else {
            throw PluginError("apiUrl")
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        let http = resp as? HTTPURLResponse
        let json = (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
        if let code = http?.statusCode, code >= 400 {
            throw PluginError((json["error"] as? String) ?? "signer HTTP \(code)")
        }
        return json
    }
}

private struct PluginError: LocalizedError {
    let errorDescription: String?
    init(_ m: String) { self.errorDescription = m }
}
