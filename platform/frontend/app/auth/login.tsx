import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/theme';
import { colors, FadeInView } from '../../components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { bgColor, textColor, subtitleColor } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.devLogin('Demo Voter');
      await setSession({
        accessToken: res.accessToken,
        userId: res.user.id,
        displayName: res.user.displayName,
        isIdentityVerified: res.user.isIdentityVerified,
      });
      if (!res.user.isIdentityVerified) {
        router.replace('/auth/verify');
      } else {
        router.replace('/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, padding: 24, justifyContent: 'center' }}>
      <FadeInView>
        <Text style={{ color: textColor, fontSize: 32, fontWeight: '800', textAlign: 'center' }}>
          votemap
        </Text>
        <Text style={{ color: subtitleColor, textAlign: 'center', marginTop: 8, marginBottom: 32 }}>
          Sign in, verify with ZKPassport, Face ID to vote.
        </Text>

        <Pressable
          onPress={devLogin}
          disabled={busy}
          style={{
            backgroundColor: colors.purple,
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700' }}>Dev login</Text>
          )}
        </Pressable>

        <Text style={{ color: subtitleColor, textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          Google / Apple OAuth use the same session APIs when client IDs are configured.
        </Text>
        {error && (
          <Text style={{ color: colors.red, textAlign: 'center', marginTop: 12 }}>{error}</Text>
        )}
      </FadeInView>
    </View>
  );
}
