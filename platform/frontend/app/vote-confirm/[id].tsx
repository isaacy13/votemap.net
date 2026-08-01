import { View, Text, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { promptBiometrics } from '../../services/biometrics';
import { useTheme } from '../../context/theme';
import { colors } from '../../components/ui';

/** Deep link target: confirm a web-initiated vote with Face ID on phone. */
export default function VoteConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isIdentityVerified } = useAuthStore();
  const { bgColor, textColor, subtitleColor } = useTheme();
  const [status, setStatus] = useState<'ready' | 'working' | 'done' | 'error'>('ready');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setError('Open this link in the VoteMap iOS/Android app to confirm with Face ID.');
      setStatus('error');
    }
  }, []);

  const confirm = async () => {
    if (!accessToken || !id) return;
    if (!isIdentityVerified) {
      router.push('/auth/verify');
      return;
    }
    setStatus('working');
    try {
      const ok = await promptBiometrics('Confirm this VoteMap action with Face ID');
      if (!ok) throw new Error('Face ID failed or cancelled');
      await api.confirmVoteSession(id, accessToken);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
      setStatus('error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: textColor, fontSize: 24, fontWeight: '800', marginBottom: 12 }}>
        Confirm vote
      </Text>
      <Text style={{ color: subtitleColor, fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
        A web session is waiting. Authenticate with Face ID to unlock the action on your browser.
      </Text>
      {status === 'working' && <ActivityIndicator color={colors.purple} />}
      {status === 'done' && (
        <Text style={{ color: colors.green, fontWeight: '700' }}>
          Confirmed. You can return to your browser — it should continue automatically.
        </Text>
      )}
      {error && <Text style={{ color: colors.red, marginBottom: 12 }}>{error}</Text>}
      {status === 'ready' && (
        <Pressable
          onPress={confirm}
          style={{
            backgroundColor: colors.purple,
            paddingVertical: 16,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Face ID & confirm</Text>
        </Pressable>
      )}
      <Pressable onPress={() => router.replace('/')} style={{ marginTop: 20 }}>
        <Text style={{ color: subtitleColor, textAlign: 'center' }}>Back home</Text>
      </Pressable>
      {Platform.OS !== 'web' && (
        <Pressable onPress={() => Linking.openURL('https://votemap.net')} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.blue, textAlign: 'center' }}>votemap.net</Text>
        </Pressable>
      )}
    </View>
  );
}
