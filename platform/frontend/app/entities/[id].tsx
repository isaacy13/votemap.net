import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { prepareVote, type PhoneGate } from '../../services/voteFlow';
import { useTheme } from '../../context/theme';
import { colors, GlowCard, FadeInView } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';
import { PhoneConfirmModal } from '../../components/PhoneConfirmModal';

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { accessToken, isIdentityVerified } = useAuthStore();
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted } = useTheme();
  const [amount, setAmount] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneGate, setPhoneGate] = useState<PhoneGate | null>(null);
  const [pendingAction, setPendingAction] = useState<null | (() => Promise<void>)>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.getEntity(id!),
    enabled: !!id,
  });

  const onPhoneConfirmed = useCallback(async () => {
    const action = pendingAction;
    setPhoneGate(null);
    setPendingAction(null);
    if (!action) return;
    setBusy(true);
    try {
      await action();
      await qc.invalidateQueries({ queryKey: ['entity', id] });
      await qc.invalidateQueries({ queryKey: ['ledger'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Donation failed');
    } finally {
      setBusy(false);
    }
  }, [pendingAction, qc, id]);

  const onDonate = async () => {
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }
    if (!isIdentityVerified) {
      router.push('/auth/verify');
      return;
    }
    const entityId = data?.entity?.id;
    if (!entityId) return;
    setBusy(true);
    setError(null);
    try {
      const amountUsdc = Number(amount);
      const { voteSessionId, phoneGate: gate } = await prepareVote(accessToken, 'donate', {
        entityId,
        amountUsdc,
        memo: null,
      });
      if (gate) {
        setPhoneGate(gate);
        setPendingAction(() => async () => {
          await api.donate(entityId, { amountUsdc, voteSessionId }, accessToken);
        });
        return;
      }
      await api.donate(entityId, { amountUsdc, voteSessionId }, accessToken);
      await qc.invalidateQueries({ queryKey: ['entity', id] });
      await qc.invalidateQueries({ queryKey: ['ledger'] });
      setBusy(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Donation failed');
      setBusy(false);
    }
  };

  if (isLoading || !data?.entity) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  const entity = data.entity;

  return (
    <>
      {accessToken && phoneGate && (
        <PhoneConfirmModal
          visible
          sessionId={phoneGate.sessionId}
          deepLink={phoneGate.deepLink}
          token={accessToken}
          onConfirmed={onPhoneConfirmed}
          onCancel={() => {
            setPhoneGate(null);
            setPendingAction(null);
            setBusy(false);
          }}
        />
      )}
      <FlatList
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable onPress={() => router.back()}>
                <Text style={{ color: colors.blue }}>← Back</Text>
              </Pressable>
              <ThemeToggle />
            </View>
            <FadeInView>
              <Text style={{ color: textColor, fontSize: 28, fontWeight: '800', marginTop: 16 }}>
                {entity.name}
              </Text>
              <Text style={{ color: subtitleColor, marginTop: 6 }}>{entity.type}</Text>
              {entity.bio && (
                <Text style={{ color: subtitleColor, marginTop: 12, lineHeight: 22 }}>{entity.bio}</Text>
              )}
            </FadeInView>

            {entity.links && entity.links.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ color: textColor, fontWeight: '700' }}>Links</Text>
                {entity.links.map((l) => (
                  <Text key={l.id} style={{ color: colors.blue, marginTop: 6 }}>
                    {l.label}: {l.url}
                  </Text>
                ))}
              </View>
            )}

            <GlowCard style={{ marginTop: 20 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
              <Text style={{ color: textColor, fontWeight: '700' }}>Direct donation</Text>
              <Text style={{ color: textMuted, fontSize: 12, marginTop: 4, marginBottom: 10 }}>
                Transparent gift — same public ledger rules. Face ID required.
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={textMuted}
                style={{
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 12,
                  padding: 12,
                  color: textColor,
                  marginBottom: 10,
                }}
              />
              <Pressable
                onPress={onDonate}
                disabled={busy}
                style={{
                  backgroundColor: colors.purple,
                  paddingVertical: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {busy ? 'Working…' : 'Face ID & donate'}
                </Text>
              </Pressable>
              {error && <Text style={{ color: colors.red, marginTop: 8 }}>{error}</Text>}
            </GlowCard>

            <Text style={{ color: textColor, fontWeight: '700', fontSize: 18, marginTop: 28 }}>
              Outcomes
            </Text>
          </View>
        }
        data={entity.outcomes ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/outcomes/${item.id}`)}>
            <GlowCard style={{ marginTop: 10 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
              <Text style={{ color: textColor, fontWeight: '600' }}>{item.title}</Text>
              <Text style={{ color: colors.blue, marginTop: 4 }}>
                ${item.totalBountyUsdc} · {item.status}
              </Text>
            </GlowCard>
          </Pressable>
        )}
      />
    </>
  );
}
