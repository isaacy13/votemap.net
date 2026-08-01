import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { colors, FadeInView, GlowCard, PulsingDot } from '../../components/ui';
import { useTheme } from '../../context/theme';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isWriteEnabled } = useAuthStore();
  const { darkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted: themeMuted } = useTheme();

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.getIssue(id!),
    enabled: !!id,
  });

  if (isLoading || !issue) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={{ color: subtitleColor, fontSize: 16, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: textColor,
          letterSpacing: -0.5,
          lineHeight: 34,
        }}>
          {issue.title}
        </Text>
      </FadeInView>

      {/* Status + Bounty Row */}
      <FadeInView delay={100}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: issue.status === 'open' ? colors.green + '18' : colors.yellow + '18',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: issue.status === 'open' ? colors.green + '30' : colors.yellow + '30',
          }}>
            <PulsingDot color={issue.status === 'open' ? colors.green : colors.yellow} size={6} />
            <Text style={{
              color: issue.status === 'open' ? colors.green : colors.yellow,
              fontWeight: '600',
              fontSize: 13,
              letterSpacing: 0.5,
            }}>
              {issue.status.toUpperCase()}
            </Text>
          </View>
          <Text style={{
            color: colors.blue,
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}>
            ${issue.totalBountyUsdc} USDC
          </Text>
        </View>
      </FadeInView>

      {/* Entity */}
      {issue.entity && (
        <FadeInView delay={150}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
            gap: 6,
          }}>
            <View style={{
              backgroundColor: darkMode ? colors.surfaceLight : '#edf2f7',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}>
              <Text style={{ color: subtitleColor, fontSize: 13, fontWeight: '500' }}>
                {issue.entity.name}
              </Text>
            </View>
            <Text style={{ color: themeMuted, fontSize: 13 }}>
              {issue.entity.type}
            </Text>
          </View>
        </FadeInView>
      )}

      {/* Description */}
      <FadeInView delay={200}>
        <Text style={{
          color: subtitleColor,
          fontSize: 16,
          marginTop: 20,
          lineHeight: 26,
        }}>
          {issue.description}
        </Text>
      </FadeInView>

      {/* Success Criteria */}
      <FadeInView delay={300}>
        <GlowCard style={{ marginTop: 20 }} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
          <Text style={{
            color: themeMuted,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            Success Criteria
          </Text>
          <Text style={{ color: textColor, fontSize: 15, marginTop: 10, lineHeight: 22 }}>
            {issue.successCriteria}
          </Text>
        </GlowCard>
      </FadeInView>

      {/* Target Date */}
      {issue.targetDate && (
        <FadeInView delay={350}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 14,
            gap: 6,
          }}>
            <Text style={{ fontSize: 14 }}>📅</Text>
            <Text style={{ color: colors.yellow, fontSize: 14, fontWeight: '600' }}>
              Target: {new Date(issue.targetDate).toLocaleDateString()}
            </Text>
          </View>
        </FadeInView>
      )}

      {/* Contributions Section */}
      {issue.contributions && issue.contributions.length > 0 && (
        <FadeInView delay={400}>
          <View style={{ marginTop: 28 }}>
            <Text style={{
              color: textColor,
              fontSize: 18,
              fontWeight: '700',
              letterSpacing: -0.3,
            }}>
              Contributions
            </Text>
            <Text style={{ color: themeMuted, fontSize: 13, marginTop: 2 }}>
              {issue.contributions.length} contributor{issue.contributions.length !== 1 ? 's' : ''}
            </Text>
            {issue.contributions.map((c, i) => (
              <GlowCard key={c.id} style={{ marginTop: 10, padding: 14 }} delay={450 + i * 60} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>
                    {c.user?.displayName ?? 'Anonymous'}
                  </Text>
                  <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 15 }}>
                    ${c.amountUsdc} USDC
                  </Text>
                </View>
              </GlowCard>
            ))}
          </View>
        </FadeInView>
      )}

      {/* Deliverables Section */}
      {issue.deliverables && issue.deliverables.length > 0 && (
        <FadeInView delay={500}>
          <View style={{ marginTop: 28 }}>
            <Text style={{
              color: textColor,
              fontSize: 18,
              fontWeight: '700',
              letterSpacing: -0.3,
            }}>
              Deliverables
            </Text>
            <Text style={{ color: themeMuted, fontSize: 13, marginTop: 2 }}>
              {issue.deliverables.length} submission{issue.deliverables.length !== 1 ? 's' : ''}
            </Text>
            {issue.deliverables.map((d, i) => (
              <GlowCard key={d.id} style={{ marginTop: 10, padding: 14 }} delay={550 + i * 60} surfaceColor={surfaceBg} borderColorOverride={borderColor}>
                <Text style={{ color: textColor, fontSize: 14, lineHeight: 20 }}>{d.proofText}</Text>
                <Text style={{ color: themeMuted, fontSize: 12, marginTop: 6 }}>
                  📎 {new Date(d.submittedAt).toLocaleDateString()}
                </Text>
              </GlowCard>
            ))}
          </View>
        </FadeInView>
      )}

      {/* Action Buttons */}
      <FadeInView delay={600}>
        <View style={{ marginTop: 28 }}>
          {isWriteEnabled && issue.status === 'open' && (
            <Pressable
              onPress={() => {/* Navigate to contribute flow */}}
              style={({ pressed }) => ({
                overflow: 'hidden',
                borderRadius: 16,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.middle]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  padding: 18,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>
                  Contribute USDC
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {!isWriteEnabled && (
            <Pressable
              onPress={() => router.push('/auth/link-x')}
              style={({ pressed }) => ({
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderColor,
                padding: 16,
                alignItems: 'center',
                backgroundColor: pressed
                  ? (darkMode ? colors.surfaceHover : '#e2e8f0')
                  : surfaceBg,
              })}
            >
              <Text style={{ color: subtitleColor, fontSize: 16, fontWeight: '600' }}>
                Link X Account for Write Access
              </Text>
            </Pressable>
          )}
        </View>
      </FadeInView>

      {/* Theme Toggle */}
      <ThemeToggle />
    </ScrollView>
  );
}
