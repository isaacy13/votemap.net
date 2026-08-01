import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/theme';
import { colors, FadeInView } from '../../components/ui';

/**
 * ZKPassport verification screen.
 * Production: integrate @zkpassport/ui QR / deep link into ZKPassport app.
 * Dev: mock verify when backend ZKPASSPORT_DEV_MODE=true ($0).
 */
export default function VerifyIdentityScreen() {
  const router = useRouter();
  const { accessToken, setSession, displayName, userId, isIdentityVerified } = useAuthStore();
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor } = useTheme();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const mockVerify = async () => {
    if (!accessToken || !userId) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.verifyZkPassport(
        {
          mode: 'mock',
          mockNullifier: `mock:${userId}`,
          ageBand: '18+',
          region: 'US',
        },
        accessToken
      );
      await setSession({
        accessToken: result.accessToken,
        userId,
        displayName,
        isIdentityVerified: true,
      });
      setMessage('Identity verified (mock / dev). You can vote.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  if (isIdentityVerified) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: colors.green, fontSize: 20, fontWeight: '700' }}>
          You are verified
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.blue }}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, padding: 24 }}>
      <FadeInView>
        <Text style={{ color: textColor, fontSize: 28, fontWeight: '800', marginTop: 40 }}>
          Verify identity
        </Text>
        <Text style={{ color: subtitleColor, fontSize: 16, marginTop: 12, lineHeight: 24 }}>
          VoteMap uses open-source ZKPassport proofs from your biometric passport — free, private,
          no paid KYC vendor. Scan once; then Face ID gates every vote.
        </Text>

        <View
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 16,
            backgroundColor: surfaceBg,
            borderWidth: 1,
            borderColor,
          }}
        >
          <Text style={{ color: textColor, fontWeight: '700', marginBottom: 8 }}>
            Production path
          </Text>
          <Text style={{ color: subtitleColor, lineHeight: 22 }}>
            Install the ZKPassport app, complete an NFC passport proof for VoteMap (age 18+ /
            personhood), then return here. Live proof submission wires through
            /auth/zkpassport/verify.
          </Text>
        </View>

        <Pressable
          onPress={mockVerify}
          disabled={busy || !accessToken}
          style={{
            marginTop: 24,
            backgroundColor: colors.purple,
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: 'center',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700' }}>Mock verify (dev)</Text>
          )}
        </Pressable>

        {message && (
          <Text style={{ color: subtitleColor, marginTop: 16, textAlign: 'center' }}>{message}</Text>
        )}
      </FadeInView>
    </View>
  );
}
