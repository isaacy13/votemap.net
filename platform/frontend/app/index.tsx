import React, { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, Linking } from 'react-native';
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
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuthStore } from '../store/auth';
import { colors, FadeInView } from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function AnimatedParticle({ x, y, color, delay: d }: { x: number; y: number; color: string; delay: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    opacity.value = withDelay(d, withRepeat(withSequence(
      withTiming(0.6, { duration: 1000, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 1500, easing: Easing.in(Easing.quad) })
    ), -1));
    translateX.value = withDelay(d, withRepeat(withSequence(
      withTiming(Math.cos(angle) * dist, { duration: 2500 }),
      withTiming(0, { duration: 0 })
    ), -1));
    translateY.value = withDelay(d, withRepeat(withSequence(
      withTiming(Math.sin(angle) * dist, { duration: 2500 }),
      withTiming(0, { duration: 0 })
    ), -1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{
      position: 'absolute', left: x, top: y, width: 4, height: 4,
      borderRadius: 2, backgroundColor: color,
    }, animatedStyle]} />
  );
}

function SparkField() {
  const particles = React.useMemo(() => {
    const w = SCREEN_WIDTH;
    let id = 0;
    return [
      ...Array.from({ length: 8 }, () => ({ id: id++, x: w * 0.15 + (Math.random() - 0.5) * w * 0.2, y: 40 + Math.random() * 40, color: colors.blue, delay: 2000 + Math.random() * 4000 })),
      ...Array.from({ length: 15 }, () => ({ id: id++, x: w * 0.5 + (Math.random() - 0.5) * w * 0.4, y: 30 + Math.random() * 60, color: colors.purple, delay: 1500 + Math.random() * 3500 })),
      ...Array.from({ length: 8 }, () => ({ id: id++, x: w * 0.85 + (Math.random() - 0.5) * w * 0.2, y: 40 + Math.random() * 40, color: colors.red, delay: 2000 + Math.random() * 4000 })),
    ];
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}>
      {particles.map((p) => <AnimatedParticle key={p.id} x={p.x} y={p.y} color={p.color} delay={p.delay} />)}
    </View>
  );
}

function GradientHeading() {
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(withSequence(
      withTiming(0.7, { duration: 2000 }),
      withTiming(0.4, { duration: 2000 })
    ), -1);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      <SparkField />
      <Animated.View style={[{ position: 'absolute', width: 300, height: 80, borderRadius: 40, top: 10 }, glowStyle]}>
        <LinearGradient
          colors={[colors.gradient.start + '30', colors.gradient.middle + '20', colors.gradient.end + '30']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
        <SvgText x="200" y="55" textAnchor="middle" fill="url(#textGrad)" fontSize="64" fontWeight="800" letterSpacing={-2}>
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
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — matches NextJS landing layout */}
      <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
        <GradientHeading />

        <FadeInView delay={200}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 16, letterSpacing: -0.5 }}>
            democratize everything
          </Text>
        </FadeInView>

        <FadeInView delay={400}>
          <Text style={{ fontSize: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 24 }}>
            vote for the future you want to see
          </Text>
        </FadeInView>
      </View>

      {/* CTA — matches NextJS "Build Now" button style */}
      <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
        <FadeInView delay={600}>
          <Pressable
            onPress={() => router.push('/issues')}
            style={({ pressed }) => ({
              overflow: 'hidden', borderRadius: 100, opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View style={{
              backgroundColor: colors.surface, padding: 18, borderRadius: 100,
              alignItems: 'center', borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>
                🗳️  Browse Issues
              </Text>
            </View>
          </Pressable>
        </FadeInView>

        {/* Auth */}
        {!isAuthenticated ? (
          <FadeInView delay={700}>
            <Pressable
              onPress={() => router.push('/auth/login')}
              style={({ pressed }) => ({
                marginTop: 12, borderRadius: 100, borderWidth: 1, borderColor: colors.border,
                padding: 16, alignItems: 'center',
                backgroundColor: pressed ? colors.surfaceHover : 'transparent',
              })}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                Sign In for Write Access
              </Text>
            </Pressable>
          </FadeInView>
        ) : (
          <FadeInView delay={700}>
            <View style={{
              marginTop: 16, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 12,
            }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {user?.displayName ?? 'Voter'}
              </Text>
              <Pressable onPress={signOut} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' }}>
                  Sign Out
                </Text>
              </Pressable>
            </View>
          </FadeInView>
        )}
      </View>

      {/* Social Links — matches NextJS SocialLinks (X, Threads, Instagram) */}
      <FadeInView delay={800}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32, marginTop: 48 }}>
          <Pressable onPress={() => Linking.openURL('https://x.com/vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.6, transform: [{ scale: pressed ? 1.2 : 1 }] })}>
            <Text style={{ color: colors.textMuted, fontSize: 28 }}>𝕏</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://threads.com/@vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.6, transform: [{ scale: pressed ? 1.2 : 1 }] })}>
            <Text style={{ color: colors.textMuted, fontSize: 28 }}>🧵</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://instagram.com/vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.6, transform: [{ scale: pressed ? 1.2 : 1 }] })}>
            <Text style={{ color: colors.textMuted, fontSize: 28 }}>📷</Text>
          </Pressable>
        </View>
      </FadeInView>

      {/* Footer — matches NextJS Footer */}
      <FadeInView delay={900}>
        <View style={{ alignItems: 'center', marginTop: 32, paddingBottom: 24, gap: 8 }}>
          <Pressable onPress={() => Linking.openURL('mailto:support@votemap.net')}>
            <Text style={{ color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' }}>
              support@votemap.net
            </Text>
          </Pressable>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            Built by{' '}
            <Text onPress={() => Linking.openURL('https://onexengineering.com')} style={{ textDecorationLine: 'underline' }}>
              onexengineering
            </Text>
          </Text>
          <Pressable onPress={() => Linking.openURL('https://x.com/isaac_yeang')}>
            <Text style={{ color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' }}>
              @isaac_yeang
            </Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}
