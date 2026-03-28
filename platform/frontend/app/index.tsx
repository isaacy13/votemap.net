import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { useAuthStore } from '../store/auth';
import { colors, FadeInView, GlowCard } from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AnimatedParticle({ x, y, color, delay: d }: { x: number; y: number; color: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    opacity.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.in(Easing.quad) })
        ),
        -1
      )
    );
    translateX.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(Math.cos(angle) * dist, { duration: 2500 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
    translateY.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(Math.sin(angle) * dist, { duration: 2500 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

function SparkField() {
  const particles = React.useMemo(() => {
    const result: { x: number; y: number; color: string; delay: number; id: number }[] = [];
    let id = 0;
    const w = SCREEN_WIDTH;
    // Blue (left)
    for (let i = 0; i < 8; i++) {
      result.push({ id: id++, x: w * 0.15 + (Math.random() - 0.5) * w * 0.2, y: 40 + Math.random() * 40, color: colors.blue, delay: 2000 + Math.random() * 4000 });
    }
    // Purple (center)
    for (let i = 0; i < 15; i++) {
      result.push({ id: id++, x: w * 0.5 + (Math.random() - 0.5) * w * 0.4, y: 30 + Math.random() * 60, color: colors.purple, delay: 1500 + Math.random() * 3500 });
    }
    // Red (right)
    for (let i = 0; i < 8; i++) {
      result.push({ id: id++, x: w * 0.85 + (Math.random() - 0.5) * w * 0.2, y: 40 + Math.random() * 40, color: colors.red, delay: 2000 + Math.random() * 4000 });
    }
    return result;
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}>
      {particles.map((p) => (
        <AnimatedParticle key={p.id} x={p.x} y={p.y} color={p.color} delay={p.delay} />
      ))}
    </View>
  );
}

function GradientHeading() {
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      <SparkField />
      <Animated.View style={[{
        position: 'absolute',
        width: 300,
        height: 80,
        borderRadius: 40,
        top: 10,
      }, glowStyle]}>
        <LinearGradient
          colors={[colors.gradient.start + '30', colors.gradient.middle + '20', colors.gradient.end + '30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: 40 }}
        />
      </Animated.View>
      <Svg width={SCREEN_WIDTH * 0.85} height={100} viewBox="0 0 400 80">
        <Defs>
          <SvgGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.gradient.start} />
            <Stop offset="50%" stopColor={colors.gradient.middle} />
            <Stop offset="100%" stopColor={colors.gradient.end} />
          </SvgGradient>
        </Defs>
        <SvgText
          x="200"
          y="55"
          textAnchor="middle"
          fill="url(#textGrad)"
          fontSize="64"
          fontWeight="800"
          letterSpacing={-2}
        >
          votemap
        </SvgText>
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuthStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 }}>
        <GradientHeading />

        <FadeInView delay={200}>
          <Text style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginTop: 16,
            letterSpacing: -0.5,
          }}>
            democratize everything
          </Text>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={{
            fontSize: 17,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 24,
          }}>
            vote for the future you want to see
          </Text>
        </FadeInView>
      </View>

      {/* Action Section */}
      <View style={{ paddingHorizontal: 24, marginTop: 48 }}>
        {!isAuthenticated ? (
          <FadeInView delay={600}>
            <Pressable
              onPress={() => router.push('/auth/login')}
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
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>
                  Get Started
                </Text>
              </LinearGradient>
            </Pressable>

            <Text style={{
              color: colors.textMuted,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 12,
            }}>
              Sign in with Google or Apple to browse issues
            </Text>
          </FadeInView>
        ) : (
          <>
            <FadeInView delay={200}>
              <GlowCard>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Welcome back</Text>
                <Text style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: '700',
                  marginTop: 4,
                }}>
                  {user?.displayName ?? 'Voter'}
                </Text>
              </GlowCard>
            </FadeInView>

            <FadeInView delay={400}>
              <Pressable
                onPress={() => router.push('/issues')}
                style={({ pressed }) => ({
                  overflow: 'hidden',
                  borderRadius: 16,
                  marginTop: 16,
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
                    Browse Issues
                  </Text>
                </LinearGradient>
              </Pressable>
            </FadeInView>

            <FadeInView delay={500}>
              <Pressable
                onPress={() => router.push('/auth/link-x')}
                style={({ pressed }) => ({
                  marginTop: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                })}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                  Link X Account
                </Text>
              </Pressable>
            </FadeInView>

            <FadeInView delay={600}>
              <Pressable
                onPress={signOut}
                style={{ marginTop: 24, alignItems: 'center', padding: 8 }}
              >
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                  Sign Out
                </Text>
              </Pressable>
            </FadeInView>
          </>
        )}
      </View>

      {/* Info Cards */}
      <View style={{ paddingHorizontal: 24, marginTop: 48 }}>
        <FadeInView delay={800}>
          <GlowCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.blue + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>🗳️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>On-Chain Bounties</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  USDC escrow with full transparency
                </Text>
              </View>
            </View>
          </GlowCard>
        </FadeInView>

        <FadeInView delay={900}>
          <GlowCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.purple + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>🔒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Individual Resolution</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  You decide where your money goes
                </Text>
              </View>
            </View>
          </GlowCard>
        </FadeInView>

        <FadeInView delay={1000}>
          <GlowCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.green + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 20 }}>✨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Open Source</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  Fully auditable, censorship-resistant
                </Text>
              </View>
            </View>
          </GlowCard>
        </FadeInView>
      </View>

      {/* Footer */}
      <View style={{ alignItems: 'center', marginTop: 48, paddingBottom: 20 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Built by onexengineering
        </Text>
      </View>
    </ScrollView>
  );
}
