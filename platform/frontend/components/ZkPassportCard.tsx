import { View, Text, Platform } from 'react-native';
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth';
import { colors } from './ui';

type Props = {
  onVerified: () => void;
};

type QrProps = Record<string, unknown>;

/**
 * Web: drop-in @zkpassport/ui QR card.
 * Native: deep-link instructions (UI package is web/DOM-oriented).
 */
export function ZkPassportCard({ onVerified }: Props) {
  const { accessToken, userId, displayName, setSession } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [WebCard, setWebCard] = useState<ComponentType<QrProps> | null>(null);

  const domain =
    typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';

  const submitLive = useCallback(
    async (payload: { proofs: unknown; queryResult: unknown }) => {
      if (!accessToken || !userId) return;
      setBusy(true);
      setError(null);
      try {
        const result = await api.verifyZkPassport(
          {
            mode: 'live',
            proofs: payload.proofs,
            queryResult: payload.queryResult,
          },
          accessToken
        );
        await setSession({
          accessToken: result.accessToken,
          userId,
          displayName,
          isIdentityVerified: true,
        });
        onVerified();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Live verification failed');
      } finally {
        setBusy(false);
      }
    },
    [accessToken, userId, displayName, setSession, onVerified]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    void import('@zkpassport/ui/react')
      .then((mod) => {
        if (!cancelled) {
          setWebCard(() => mod.ZKPassportQRCode as ComponentType<QrProps>);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            `ZKPassport UI unavailable: ${e instanceof Error ? e.message : String(e)}. Use mock verify in dev.`
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#2a2a3e',
          backgroundColor: '#111118',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>
          Passport verify on phone
        </Text>
        <Text style={{ color: '#a0a0b0', lineHeight: 22 }}>
          Install the ZKPassport app, complete an NFC passport proof for VoteMap (age 18+), then
          return here. For local development without a passport, use Mock verify below.
        </Text>
        <Text style={{ color: colors.blue, marginTop: 12 }} selectable>
          https://zkpassport.id
        </Text>
      </View>
    );
  }

  if (!WebCard) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#a0a0b0' }}>
          {error ?? (busy ? 'Submitting proof…' : 'Loading ZKPassport QR…')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <WebCard
        name="VoteMap"
        logo="https://votemap.net/images/votemap_light.JPG"
        purpose="Prove you are a unique adult (18+) to stake and donate on VoteMap"
        scope="votemap-personhood"
        domain={domain}
        devMode
        query={(queryBuilder: { gte: (f: string, v: number) => { done: () => unknown } }) =>
          queryBuilder.gte('age', 18).done()
        }
        onResult={(response: {
          verified: boolean;
          proofs: unknown;
          result: unknown;
        }) => {
          if (!response.verified) {
            setError('ZKPassport could not verify this proof');
            return;
          }
          void submitLive({
            proofs: response.proofs,
            queryResult: response.result,
          });
        }}
        onError={(message: string) => setError(message)}
        onReject={() => setError('Verification rejected on phone')}
      />
      {busy && <Text style={{ color: '#a0a0b0' }}>Submitting proof to VoteMap…</Text>}
      {error && <Text style={{ color: colors.red }}>{error}</Text>}
    </View>
  );
}
