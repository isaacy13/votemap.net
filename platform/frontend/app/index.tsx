import React, { useEffect, useMemo } from 'react';
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
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
  Path,
} from 'react-native-svg';
import { useAuthStore } from '../store/auth';
import { colors, FadeInView } from '../components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Spark particles ─────────────────────────────────────────────────
   Matches NextJS VotemapHeading: 15 blue (x≈250), 40 purple (x≈450), 15 red (x≈650)
   in viewBox 0 0 900 180. Each particle drifts outward and fades. */

interface Spark {
  id: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  r: number;
  color: string;
  delay: number;
  duration: number;
}

function generateSparks(): Spark[] {
  let id = 0;
  const make = (count: number, xBase: number, xSpread: number, color: string, delayMax: number): Spark[] =>
    Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      return {
        id: id++,
        cx: xBase + (Math.random() - 0.5) * xSpread,
        cy: 90 + (Math.random() - 0.5) * 60,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        r: Math.random() * 2 + 1,
        color,
        delay: Math.random() * delayMax,
        duration: 2 + Math.random() * 2,
      };
    });

  return [
    ...make(15, 250, 200, '#3b82f6', 25), // Blue (Left)
    ...make(40, 450, 300, '#8b5cf6', 20), // Purple (Middle)
    ...make(15, 650, 200, '#ef4444', 25), // Red (Right)
  ];
}

function AnimatedSpark({ spark }: { spark: Spark }) {
  const opacity = useSharedValue(0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  useEffect(() => {
    const d = spark.delay * 1000; // seconds → ms
    const dur = spark.duration * 1000;
    opacity.value = withDelay(d, withRepeat(
      withSequence(withTiming(0.6, { duration: dur * 0.4 }), withTiming(0, { duration: dur * 0.6 })),
      -1,
    ));
    dx.value = withDelay(d, withRepeat(
      withSequence(withTiming(spark.tx, { duration: dur }), withTiming(0, { duration: 0 })),
      -1,
    ));
    dy.value = withDelay(d, withRepeat(
      withSequence(withTiming(spark.ty, { duration: dur }), withTiming(0, { duration: 0 })),
      -1,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: dx.value }, { translateY: dy.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (spark.cx / 900) * SCREEN_WIDTH,
          top: (spark.cy / 180) * 180,
          width: spark.r * 2,
          height: spark.r * 2,
          borderRadius: spark.r,
          backgroundColor: spark.color,
        },
        style,
      ]}
    />
  );
}

/* ── Heading ──────────────────────────────────────────────────────────
   Matches NextJS: SVG viewBox="0 0 900 180", fontSize 140, fontWeight 800,
   letterSpacing -0.05em, gradient fill, drop-shadow glow. */

function VotemapHeading() {
  const sparks = useMemo(generateSparks, []);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 2000 }), withTiming(0.4, { duration: 2000 })),
      -1,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={{ width: '100%', maxWidth: 1200, height: 180, alignItems: 'center', position: 'relative' }}>
      {/* Spark particles */}
      {sparks.map((s) => (
        <AnimatedSpark key={s.id} spark={s} />
      ))}

      {/* Glow behind text */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 40,
            width: SCREEN_WIDTH * 0.5,
            maxWidth: 400,
            height: 100,
            borderRadius: 50,
            alignSelf: 'center',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
          },
          glowStyle,
        ]}
      />

      {/* SVG text — matches NextJS viewBox exactly */}
      <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' } as any}>
        <Defs>
          <SvgGradient id="headingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#3b82f6" />
            <Stop offset="50%" stopColor="#8b5cf6" />
            <Stop offset="100%" stopColor="#ef4444" />
          </SvgGradient>
        </Defs>
        <SvgText
          x="50%"
          y="50%"
          textAnchor="middle"
          alignmentBaseline="central"
          fill="url(#headingGrad)"
          fontSize="140"
          fontWeight="800"
          letterSpacing={-7}
        >
          votemap
        </SvgText>
      </Svg>
    </View>
  );
}

/* ── Social link SVG icons ────────────────────────────────────────────
   Matches NextJS: FaXTwitter, FaThreads, FaInstagram from react-icons/fa6 */

function XIcon({ size = 32, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </Svg>
  );
}

function ThreadsIcon({ size = 32, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192" fill="none">
      <Path
        d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.681 22.231-5.574 29.049-14.547 5.172-6.807 8.436-15.546 9.884-26.49 5.924 3.576 10.337 8.369 12.94 14.1 4.395 9.68 4.653 25.576-3.155 34.223-6.836 7.571-15.045 10.856-27.369 10.95-13.642-.104-23.961-4.487-30.662-13.03-6.337-8.083-9.617-19.575-9.746-34.149.129-14.574 3.409-26.066 9.746-34.149 6.701-8.543 17.02-12.926 30.662-13.03 13.793.107 24.228 4.573 31.012 13.269l13.632-10.088c-9.584-12.255-23.793-18.658-42.234-18.807h-.394c-18.087.147-32.1 6.498-41.668 18.877-8.507 11.01-12.893 25.88-13.037 44.235.144 18.355 4.53 33.225 13.037 44.235 9.568 12.379 23.581 18.73 41.668 18.877h.394c16.048-.112 28.012-4.849 37.522-14.874 12.252-12.923 12.007-28.634 6.542-40.697-3.906-8.612-10.614-15.603-19.523-20.325zm-48.886 31.19c-10.434.574-21.264-4.104-21.828-14.676-.415-7.783 5.502-16.464 24.493-17.557 2.146-.123 4.244-.184 6.296-.184 6.28 0 12.158.687 17.445 1.993-1.987 26.03-14.952 29.846-26.406 30.424z"
        fill={color}
      />
    </Svg>
  );
}

function InstagramIcon({ size = 32, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill={color}>
      <Path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </Svg>
  );
}

/* ── Home Screen ──────────────────────────────────────────────────── */

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuthStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero section (VotemapHeading + HeroContent) ── */}
      <View style={{ alignItems: 'center', width: '100%', gap: 0 }}>
        <VotemapHeading />

        {/* "democratize everything" — matches NextJS: fontSize 3xl–6xl, bold */}
        <FadeInView delay={200}>
          <Text style={{
            fontSize: 36,
            fontWeight: '800',
            color: colors.text,
            textAlign: 'center',
            marginTop: -8,
            letterSpacing: -0.5,
          }}>
            democratize everything
          </Text>
        </FadeInView>

        {/* "vote for the future you want to see" — matches NextJS: fontSize xl–3xl, gray.300 */}
        <FadeInView delay={400}>
          <Text style={{
            fontSize: 22,
            color: '#d1d5db',
            textAlign: 'center',
            marginTop: 4,
            lineHeight: 30,
            maxWidth: 600,
          }}>
            vote for the future you want to see
          </Text>
        </FadeInView>
      </View>

      {/* ── CTA Buttons — matches NextJS "Build Now" pill style ── */}
      <FadeInView delay={600}>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pressable
            onPress={() => router.push('/issues')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.surfaceHover : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 9999,
              paddingVertical: 16,
              paddingHorizontal: 40,
              transform: [{ translateY: pressed ? -2 : 0 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: pressed ? 8 : 2 },
              shadowOpacity: pressed ? 0.3 : 0.1,
              shadowRadius: pressed ? 16 : 4,
              elevation: pressed ? 8 : 2,
            })}
          >
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
              🗳️  Browse Issues
            </Text>
          </Pressable>

          {!isAuthenticated ? (
            <Pressable
              onPress={() => router.push('/auth/login')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 9999,
                paddingVertical: 16,
                paddingHorizontal: 40,
                transform: [{ translateY: pressed ? -2 : 0 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: pressed ? 8 : 2 },
                shadowOpacity: pressed ? 0.3 : 0.1,
                shadowRadius: pressed ? 16 : 4,
                elevation: pressed ? 8 : 2,
              })}
            >
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
                Sign In
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                {user?.displayName ?? 'Voter'}
              </Text>
              <Pressable onPress={signOut} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ color: colors.textMuted, fontSize: 14, textDecorationLine: 'underline' }}>
                  Sign Out
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── Social Links — matches NextJS SocialLinks (X, Threads, Instagram) ── */}
      <FadeInView delay={800}>
        <View style={{ flexDirection: 'row', gap: 32, marginTop: 64 }}>
          <Pressable
            onPress={() => Linking.openURL('https://x.com/vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 1 : 0.5, transform: [{ scale: pressed ? 1.2 : 1 }] })}
          >
            <XIcon size={32} color="#9ca3af" />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://threads.com/@vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 1 : 0.5, transform: [{ scale: pressed ? 1.2 : 1 }] })}
          >
            <ThreadsIcon size={32} color="#9ca3af" />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://instagram.com/vote_map')}
            style={({ pressed }) => ({ opacity: pressed ? 1 : 0.5, transform: [{ scale: pressed ? 1.2 : 1 }] })}
          >
            <InstagramIcon size={32} color="#9ca3af" />
          </Pressable>
        </View>
      </FadeInView>

      {/* ── Footer — matches NextJS Footer ── */}
      <FadeInView delay={900}>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 48,
          paddingBottom: 24,
          gap: 8,
        }}>
          <Pressable onPress={() => Linking.openURL('mailto:support@votemap.net')}>
            <Text style={{ color: '#9ca3af', fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' }}>
              support@votemap.net
            </Text>
          </Pressable>
          <Text style={{ color: '#9ca3af', fontSize: 15 }}>•</Text>
          <Text style={{ color: '#9ca3af', fontSize: 15 }}>
            Built by{' '}
            <Text
              onPress={() => Linking.openURL('https://onexengineering.com')}
              style={{ fontWeight: '500', textDecorationLine: 'underline' }}
            >
              onexengineering
            </Text>
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 15 }}>•</Text>
          <Pressable onPress={() => Linking.openURL('https://x.com/isaac_yeang')}>
            <Text style={{ color: '#9ca3af', fontSize: 15, fontWeight: '500', textDecorationLine: 'underline' }}>
              @isaac_yeang
            </Text>
          </Pressable>
        </View>
      </FadeInView>
    </ScrollView>
  );
}
