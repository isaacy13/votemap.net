import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { beginVoteSession, waitForVoteSessionConfirm } from '../../services/biometrics';
import { colors, FadeInView, GlowCard, PulsingDot } from '../../components/ui';
import { useTheme } from '../../context/theme';
import { ThemeToggle } from '../../components/ThemeToggle';

async function ensureVoteSession(
  token: string,
  action: 'stake' | 'resolve' | 'deliverable',
  payload: Record<string, unknown>
) {
  const session = await beginVoteSession(token, action, payload);
  if (session.needsPhoneConfirm) {
    Alert.alert(
      'Confirm on your phone',
      `Open the VoteMap app and Face ID confirm.\n\nDeep link:\n${session.deepLink}\n\nOr open: /vote-confirm/${session.voteSessionId}`
    );
    await waitForVoteSessionConfirm(token, session.voteSessionId);
  }
  return session.voteSessionId;
}

export default function OutcomeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { accessToken, isIdentityVerified, userId } = useAuthStore();
  const { darkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted: themeMuted } =
    useTheme();

  const [amount, setAmount] = useState('10');
  const [deadlineDays, setDeadlineDays] = useState('30');
  const [proofText, setProofText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: outcome, isLoading } = useQuery({
    queryKey: ['outcome', id],
    queryFn: () => api.getOutcome(id!),
    enabled: !!id,
  });

  const requireAuthPath = () => {
    if (!accessToken) {
      router.push('/auth/login');
      return false;
    }
    if (!isIdentityVerified) {
      router.push('/auth/verify');
      return false;
    }
    return true;
  };

  const onStake = async () => {
    if (!requireAuthPath() || !accessToken || !id) return;
    setBusy(true);
    setError(null);
    try {
      const deadlineAt = new Date(Date.now() + Number(deadlineDays) * 86400000).toISOString();
      const amountUsdc = Number(amount);
      const voteSessionId = await ensureVoteSession(accessToken, 'stake', {
        outcomeId: id,
        amountUsdc,
        deadlineAt,
      });
      await api.createStake(id, { amountUsdc, deadlineAt, voteSessionId }, accessToken);
      await qc.invalidateQueries({ queryKey: ['outcome', id] });
      await qc.invalidateQueries({ queryKey: ['ledger'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stake failed');
    } finally {
      setBusy(false);
    }
  };

  const onDeliverable = async () => {
    if (!requireAuthPath() || !accessToken || !id) return;
    setBusy(true);
    setError(null);
    try {
      const voteSessionId = await ensureVoteSession(accessToken, 'deliverable', {
        outcomeId: id,
        proofText,
      });
      await api.submitDeliverable(id, { proofText, voteSessionId }, accessToken);
      await qc.invalidateQueries({ queryKey: ['outcome', id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deliverable failed');
    } finally {
      setBusy(false);
    }
  };

  const onResolve = async (stakeId: string, decision: 'approve' | 'reject') => {
    if (!requireAuthPath() || !accessToken || !id) return;
    setBusy(true);
    setError(null);
    try {
      const voteSessionId = await ensureVoteSession(accessToken, 'resolve', {
        outcomeId: id,
        stakeId,
        decision,
      });
      await api.resolveStake(id, { stakeId, decision, voteSessionId }, accessToken);
      await qc.invalidateQueries({ queryKey: ['outcome', id] });
      await qc.invalidateQueries({ queryKey: ['ledger'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resolve failed');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !outcome) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.blue }}>← Back</Text>
        </Pressable>
        <ThemeToggle />
      </View>

      <FadeInView delay={0}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, marginTop: 16 }}>
          {outcome.title}
        </Text>
      </FadeInView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.green + '18',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
          }}
        >
          <PulsingDot color={colors.green} size={6} />
          <Text style={{ color: colors.green, fontWeight: '600', fontSize: 13 }}>
            {outcome.status.toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: colors.blue, fontSize: 22, fontWeight: '800' }}>
          ${outcome.totalBountyUsdc} USDC
        </Text>
      </View>

      <Text style={{ color: subtitleColor, fontSize: 16, marginTop: 20, lineHeight: 26 }}>
        {outcome.description}
      </Text>

      <GlowCard style={{ marginTop: 20 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
        <Text style={{ color: themeMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
          SUCCESS CRITERIA
        </Text>
        <Text style={{ color: textColor, fontSize: 15, marginTop: 10, lineHeight: 22 }}>
          {outcome.successCriteria}
        </Text>
      </GlowCard>

      {Platform.OS === 'web' && (
        <Text style={{ color: colors.yellow, marginTop: 16, fontSize: 13 }}>
          On web, staking waits for Face ID confirmation in the VoteMap mobile app.
        </Text>
      )}

      <GlowCard style={{ marginTop: 24 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
        <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>Stake</Text>
        <Text style={{ color: themeMuted, marginTop: 4, marginBottom: 12, fontSize: 13 }}>
          If this outcome is not delivered by your deadline, your stake returns automatically.
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Amount USDC"
          placeholderTextColor={themeMuted}
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            padding: 12,
            color: textColor,
            marginBottom: 8,
          }}
        />
        <TextInput
          value={deadlineDays}
          onChangeText={setDeadlineDays}
          keyboardType="number-pad"
          placeholder="Deadline (days)"
          placeholderTextColor={themeMuted}
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            padding: 12,
            color: textColor,
            marginBottom: 12,
          }}
        />
        <Pressable
          onPress={onStake}
          disabled={busy}
          style={{
            backgroundColor: colors.purple,
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {busy ? 'Working…' : 'Face ID & stake'}
          </Text>
        </Pressable>
      </GlowCard>

      <GlowCard style={{ marginTop: 16 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
        <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>Submit deliverable</Text>
        <TextInput
          value={proofText}
          onChangeText={setProofText}
          multiline
          placeholder="Proof of delivery"
          placeholderTextColor={themeMuted}
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            padding: 12,
            color: textColor,
            marginVertical: 12,
            minHeight: 80,
          }}
        />
        <Pressable
          onPress={onDeliverable}
          disabled={busy || !proofText}
          style={{
            backgroundColor: darkMode ? colors.surfaceLight : '#edf2f7',
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: textColor, fontWeight: '700' }}>Face ID & submit proof</Text>
        </Pressable>
      </GlowCard>

      {error && <Text style={{ color: colors.red, marginTop: 12 }}>{error}</Text>}

      {outcome.stakes && outcome.stakes.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>Stakes</Text>
          {outcome.stakes.map((s) => (
            <GlowCard
              key={s.id}
              style={{ marginTop: 10, padding: 14 }}
              surfaceColor={surfaceBg}
              borderColorOverride={borderColor}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: textColor, fontWeight: '600' }}>
                  {s.user?.displayName ?? 'Anonymous'}
                </Text>
                <Text style={{ color: colors.blue, fontWeight: '700' }}>${s.amountUsdc}</Text>
              </View>
              <Text style={{ color: themeMuted, marginTop: 6, fontSize: 12 }}>
                {s.status} · deadline {new Date(s.deadlineAt).toLocaleString()}
              </Text>
              {s.status === 'active' &&
                s.userId === userId &&
                (outcome.status === 'delivery_submitted' ||
                  outcome.status === 'partially_resolved') && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Pressable
                      onPress={() => onResolve(s.id, 'approve')}
                      style={{
                        flex: 1,
                        backgroundColor: colors.green + '33',
                        padding: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.green, fontWeight: '700' }}>Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onResolve(s.id, 'reject')}
                      style={{
                        flex: 1,
                        backgroundColor: colors.red + '33',
                        padding: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.red, fontWeight: '700' }}>Reject</Text>
                    </Pressable>
                  </View>
                )}
            </GlowCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
