package net.votemap.plugin;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Iterator;

@CapacitorPlugin(name = "VoteMap")
public class VoteMapPlugin extends Plugin {
    private static final String ALIAS = "net.votemap.device-key";

    @PluginMethod
    public void capabilities(PluginCall call) {
        call.resolve(bio());
    }

    @PluginMethod
    public void registerDevice(PluginCall call) {
        run(call, "/device/register", true);
    }

    @PluginMethod
    public void stake(PluginCall call) {
        run(call, "/sign/stake", false);
    }

    @PluginMethod
    public void pay(PluginCall call) {
        run(call, "/sign/pay", false);
    }

    @PluginMethod
    public void claim(PluginCall call) {
        run(call, "/sign/claim", false);
    }

    private JSObject bio() {
        JSObject o = new JSObject();
        int can = BiometricManager.from(getContext())
                .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        boolean ok = can == BiometricManager.BIOMETRIC_SUCCESS;
        o.put("native", true);
        o.put("biometrics", ok);
        o.put("strong", ok);
        return o;
    }

    private void run(PluginCall call, String path, boolean enroll) {
        if (!Boolean.TRUE.equals(bio().getBool("strong"))) {
            call.reject("Class 3 biometrics are not enrolled. votemap does not allow a PIN or passcode fallback.");
            return;
        }
        String apiUrl = call.getString("apiUrl");
        String token = call.getString("sessionToken");
        if (apiUrl == null || token == null) {
            call.reject("missing apiUrl or sessionToken");
            return;
        }
        new Thread(() -> {
            try {
                ensureKey();
                JSONObject challenge = http(apiUrl, "/sign/challenge", token, new JSONObject());
                String cid = challenge.getString("challengeId");
                byte[] toSign = fromHex(challenge.getString("challenge"));
                Signature signature = Signature.getInstance("SHA256withECDSA");
                KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                ks.load(null);
                KeyStore.PrivateKeyEntry entry = (KeyStore.PrivateKeyEntry) ks.getEntry(ALIAS, null);
                signature.initSign(entry.getPrivateKey());
                getActivity().runOnUiThread(() -> prompt(call, signature, toSign, apiUrl, token, path, enroll, cid));
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }).start();
    }

    private void prompt(
            PluginCall call,
            Signature signature,
            byte[] toSign,
            String apiUrl,
            String token,
            String path,
            boolean enroll,
            String cid
    ) {
        FragmentActivity activity = (FragmentActivity) getActivity();
        BiometricPrompt prompt = new BiometricPrompt(activity, ContextCompat.getMainExecutor(getContext()),
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        new Thread(() -> {
                            try {
                                Signature crypto = result.getCryptoObject() != null
                                        ? result.getCryptoObject().getSignature()
                                        : signature;
                                crypto.update(toSign);
                                String deviceSig = toHex(crypto.sign());
                                call.resolve(finish(call, apiUrl, token, path, enroll, cid, deviceSig));
                            } catch (Exception e) {
                                call.reject(e.getMessage());
                            }
                        }).start();
                    }

                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        call.reject(String.valueOf(errString));
                    }
                });
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("votemap")
                .setSubtitle("Class 3 biometrics only — PIN is not accepted.")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setNegativeButtonText("Cancel")
                .build();
        prompt.authenticate(info, new BiometricPrompt.CryptoObject(signature));
    }

    private JSObject finish(
            PluginCall call,
            String apiUrl,
            String token,
            String path,
            boolean enroll,
            String cid,
            String deviceSig
    ) throws Exception {
        JSONObject body = new JSONObject();
        JSObject opts = call.getData();
        Iterator<String> keys = opts.keys();
        while (keys.hasNext()) {
            String k = keys.next();
            if ("sendOk".equals(k) || "biometricOk".equals(k) || "jsOk".equals(k)) continue;
            body.put(k, opts.get(k));
        }
        body.put("challengeId", cid);
        body.put("deviceSig", deviceSig);
        if (enroll) {
            body.put("pubkey", pubHex());
            body.put("platform", "android");
            http(apiUrl, "/device/register", token, body);
            JSObject ok = new JSObject();
            ok.put("ok", true);
            return ok;
        }
        JSONObject signed = http(apiUrl, path, token, body);
        JSObject out = new JSObject();
        Iterator<String> sk = signed.keys();
        while (sk.hasNext()) {
            String k = sk.next();
            out.put(k, signed.get(k));
        }
        return out;
    }

    private void ensureKey() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) return;
        KeyPairGenerator kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
        KeyGenParameterSpec.Builder b = new KeyGenParameterSpec.Builder(
                ALIAS,
                KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
        )
                .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true);
        if (Build.VERSION.SDK_INT >= 30) {
            b.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
        }
        if (Build.VERSION.SDK_INT >= 28) {
            try { b.setIsStrongBoxBacked(true); } catch (Exception ignored) { }
        }
        kpg.initialize(b.build());
        kpg.generateKeyPair();
    }

    private String pubHex() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        ECPublicKey pub = (ECPublicKey) ks.getCertificate(ALIAS).getPublicKey();
        byte[] x = pub.getW().getAffineX().toByteArray();
        byte[] y = pub.getW().getAffineY().toByteArray();
        byte[] out = new byte[65];
        out[0] = 0x04;
        copyFit(x, out, 1);
        copyFit(y, out, 33);
        return toHex(out);
    }

    private static void copyFit(byte[] src, byte[] dest, int at) {
        int n = Math.min(src.length, 32);
        System.arraycopy(src, src.length - n, dest, at + 32 - n, n);
    }

    private JSONObject http(String apiUrl, String path, String token, JSONObject body) throws Exception {
        URL url = new URL(apiUrl.replaceAll("/+$", "") + path);
        HttpURLConnection c = (HttpURLConnection) url.openConnection();
        c.setRequestMethod("POST");
        c.setDoOutput(true);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Authorization", "Bearer " + token);
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream os = c.getOutputStream()) { os.write(bytes); }
        int code = c.getResponseCode();
        InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
        String raw = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        JSONObject json = raw.isEmpty() ? new JSONObject() : new JSONObject(raw);
        if (code >= 400) throw new Exception(json.optString("error", "signer HTTP " + code));
        return json;
    }

    private static byte[] fromHex(String hex) {
        String h = hex.length() % 2 == 1 ? "0" + hex : hex;
        byte[] out = new byte[h.length() / 2];
        for (int i = 0; i < out.length; i++) {
            out[i] = (byte) Integer.parseInt(h.substring(i * 2, i * 2 + 2), 16);
        }
        return out;
    }

    private static String toHex(byte[] b) {
        StringBuilder sb = new StringBuilder();
        for (byte v : b) sb.append(String.format("%02x", v));
        return sb.toString();
    }
}
