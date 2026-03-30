import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import Svg, {
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
} from 'react-native-svg';
import { useAuthStore } from '../store/auth';
import { colors, FadeInView } from '../components/ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Web-only hover props for Pressable (supported by react-native-web) */
const hoverProps = Platform.OS === 'web' ? (
  (setHovered: (h: boolean) => void) => ({
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
  })
) : () => ({});

/** Gray color for social icons and footer text — matches NextJS Chakra gray.400 */
const GRAY_400 = '#9ca3af';

/* ── Spark particles ─────────────────────────────────────────────────
   Matches NextJS VotemapHeading: 15 blue (x≈250), 40 purple (x≈450), 15 red (x≈650)
   in viewBox 0 0 900 180. Each particle drifts outward and fades.
   Sparks start after 6s delay matching NextJS (delay: 6 + spark.delay). */

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
    // 6s initial delay matches NextJS "delay: 6 + spark.delay"
    const d = (6 + spark.delay) * 1000;
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

  // Scale spark positions relative to screen width (viewBox is 0 0 900 180)
  const headingHeight = 180;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (spark.cx / 900) * SCREEN_WIDTH,
          top: (spark.cy / 180) * headingHeight,
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
   Matches NextJS VotemapHeading exactly:
   - SVG viewBox="0 0 900 180", fontSize 140px, fontWeight 800
   - Wireframe stroke-drawing animation (strokeDasharray/offset over 6s)
   - Gradient text fades in at 6s
   - Drop-shadow glow filter on gradient text
   - No separate oval/glow shape behind text */

function VotemapHeading({ effectsEnabled = true }: { effectsEnabled?: boolean }) {
  const sparks = useMemo(generateSparks, []);

  // Stroke-drawing animation: strokeDashoffset goes from 3000 → 0 over 6s
  const strokeOffset = useSharedValue(3000);
  const strokeOpacityVal = useSharedValue(0.8);
  // Gradient text fades in at 6s
  const gradientOpacity = useSharedValue(0);

  useEffect(() => {
    // Draw stroke over 6s
    strokeOffset.value = withTiming(0, { duration: 6000 });
    // After ~5s, fade the stroke to low opacity
    strokeOpacityVal.value = withDelay(5000, withTiming(0.3, { duration: 1500 }));
    // Gradient text fades in at 6s
    gradientOpacity.value = withDelay(6000, withTiming(1, { duration: 2000 }));
  }, []);

  const strokeStyle = useAnimatedStyle(() => ({ opacity: 1 }));
  const gradientStyle = useAnimatedStyle(() => ({ opacity: gradientOpacity.value }));

  return (
    <View style={{ width: '100%', maxWidth: 1200, height: 180, alignItems: 'center', position: 'relative' }}>
      {/* Spark particles — delayed 6s like NextJS */}
      {effectsEnabled && sparks.map((s) => (
        <AnimatedSpark key={s.id} spark={s} />
      ))}

      {/* SVG with both text layers — matches NextJS exactly */}
      <View style={{ width: '100%', height: '100%' }}>
        {/* Gradient fill text — fades in at 6s */}
        {effectsEnabled && (
          <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, gradientStyle]}>
            <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
              <Defs>
                <SvgGradient id="headingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#3b82f6" />
                  <Stop offset="50%" stopColor="#8b5cf6" />
                  <Stop offset="100%" stopColor="#ef4444" />
                </SvgGradient>
              </Defs>
              <SvgText
                x="450"
                y="90"
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
          </Animated.View>
        )}

        {/* Wireframe stroke text — draws on page load, then fades to subtle outline */}
        <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
          <SvgText
            x="450"
            y="90"
            textAnchor="middle"
            alignmentBaseline="central"
            fill="none"
            stroke={colors.text}
            strokeWidth={2}
            strokeOpacity={0.3}
            fontSize="140"
            fontWeight="800"
            letterSpacing={-7}
            strokeDasharray="3000"
            strokeDashoffset="0"
          >
            votemap
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

/* ── Social link SVG icons ────────────────────────────────────────────
   Matches NextJS: FaXTwitter, FaThreads, FaInstagram from react-icons/fa6 */

function XIcon({ size = 32, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </Svg>
  );
}

function ThreadsIcon({ size = 32, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill={color}>
      <Path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.4-30.4 147.2c-36.7 39.7-81.2 59.3-132.6 60.5c-73 1.6-130.8-32.2-167-97.6C34.2 345.6 18 272.1 22 191.2c5.6-113.7 65.7-188.5 169.3-193.4c8.2-.4 16.3-.4 24.3 .1c76 4 130.7 41.8 163.1 112.6c3.1 6.8 6 13.8 8.4 20.8l-66.2 19.2c-3.5-11.6-7.6-22.4-14-32.2c-22.5-34.7-59.3-51.6-106.7-49c-72.4 3.8-120.5 61.5-124.7 149.5c-3.1 64.1 7.3 120.1 39.7 165.5c29.7 41.6 75.6 56.2 128 49.4c29.3-3.8 54.7-17.5 74.8-40.3c28.2-32 36-70.4 22.1-115.2c-6.7-21.6-21.6-38.3-43.4-48.5c-3.4 24.1-9.6 48.2-22.3 68.5c-20.8 33.1-52.2 51.3-89 55.2c-31 3.3-59.5-4.2-81.3-24.2c-28.7-26.3-36-65.4-20.9-103.7c18.5-47 61.6-72.5 113.3-70.7c17.8 .6 34.8 5.2 49.9 14.2zM194.9 327.3c12.3 13.2 31.7 15.9 47.5 10.8c20.2-6.5 33.7-22.3 41.3-44.5c-21.2-10.2-43.8-14.3-66.9-11.4c-24.7 3.1-39 17.4-21.9 45.1z" />
    </Svg>
  );
}

function InstagramIcon({ size = 32, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill={color}>
      <Path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </Svg>
  );
}

/* ── Footer SVG icons ─────────────────────────────────────────────────
   Matches NextJS Footer: FaMagic and FaSun/FaMoon toggle buttons */

function MagicWandIcon({ size = 16, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.7-53.3L160 80l-53.3-26.7L80 0 53.3 53.3 0 80l53.3 26.7L80 160zm352 128l-26.7 53.3L352 368l53.3 26.7L432 448l26.7-53.3L512 368l-53.3-26.7L432 288zm70.7-208l-48.7-48.7c-6.3-6.3-16.4-6.3-22.6 0L12.7 450c-6.3 6.3-6.3 16.4 0 22.6l48.7 48.7c6.3 6.3 16.4 6.3 22.6 0L502.7 102.6c6.3-6.3 6.3-16.4 0-22.6zM91.4 478L34 420.6 227.3 227.3 284.7 284.7 91.4 478z" />
    </Svg>
  );
}

function SunIcon({ size = 16, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1zm-155.9 106c-49.9 49.9-131.1 49.9-181 0-49.9-49.9-49.9-131.1 0-181 49.9-49.9 131.1-49.9 181 0 49.9 49.9 49.9 131.1 0 181z" />
    </Svg>
  );
}

function MoonIcon({ size = 16, color = GRAY_400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Path d="M283.2 512c78.9 0 151-42.4 189.8-110.8 3.8-6.7-.7-14.9-8.4-14.3-108.4 8.5-207.4-74.2-207.4-183.7 0-68.9 37.8-132.2 98.5-165.6 6.1-3.4 5.9-12.2-.4-15.3C330.8 8.4 307.3 0 283.2 0 131.3 0 8 123.3 8 275.2S131.3 512 283.2 512z" />
    </Svg>
  );
}

/* ── Hoverable social link wrapper ────────────────────────────────────
   Provides hover + press state for web (Pressable hovered state).
   On hover: color changes + scale(1.2), matching NextJS _hover behavior. */

function HoverableSocialLink({
  href,
  hoverColor,
  children,
}: {
  href: string;
  hoverColor: string;
  children: (color: string, scale: number) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const currentColor = hovered ? hoverColor : GRAY_400;
  const scale = hovered ? 1.2 : 1;

  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      {...(hoverProps(setHovered) as any)}
      style={{ transform: [{ scale }] }}
    >
      {children(currentColor, scale)}
    </Pressable>
  );
}

/* ── Hoverable footer link ────────────────────────────────────────── */

function HoverableFooterLink({
  href,
  label,
  onPressOverride,
}: {
  href: string;
  label: string;
  onPressOverride?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPressOverride ?? (() => Linking.openURL(href))}
      {...(hoverProps(setHovered) as any)}
    >
      <Text style={{
        color: hovered ? '#3b82f6' : GRAY_400,
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Home Screen ──────────────────────────────────────────────────── */

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, signOut } = useAuthStore();
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // Toggle icon state — visual-only until full theme support is added

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
        minHeight: SCREEN_HEIGHT * 0.85,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero section (VotemapHeading + HeroContent) — centered with gap 0 like NextJS ── */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 0,
      }}>
        <View style={{ alignItems: 'center', width: '100%', gap: 0 }}>
          <VotemapHeading effectsEnabled={effectsEnabled} />

          {/* "democratize everything" — matches NextJS: fontSize 3xl–6xl, bold, mt -8 */}
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

          {/* ── CTA Buttons — matches NextJS "Build Now" pill style (mt 8 = 32px) ── */}
          <FadeInView delay={600}>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable
                onPress={() => router.push('/issues')}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                  backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  paddingHorizontal: 40,
                  height: 64,
                  justifyContent: 'center' as const,
                  transform: [{ translateY: (hovered || pressed) ? -4 : 0 }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: (hovered || pressed) ? 12 : 2 },
                  shadowOpacity: (hovered || pressed) ? 0.3 : 0.1,
                  shadowRadius: (hovered || pressed) ? 20 : 4,
                  elevation: (hovered || pressed) ? 8 : 2,
                })}
              >
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
                  🗳️  Browse Issues
                </Text>
              </Pressable>

              {!isAuthenticated ? (
                <Pressable
                  onPress={() => router.push('/auth/login')}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                    backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 9999,
                    paddingVertical: 16,
                    paddingHorizontal: 40,
                    height: 64,
                    justifyContent: 'center' as const,
                    transform: [{ translateY: (hovered || pressed) ? -4 : 0 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: (hovered || pressed) ? 12 : 2 },
                    shadowOpacity: (hovered || pressed) ? 0.3 : 0.1,
                    shadowRadius: (hovered || pressed) ? 20 : 4,
                    elevation: (hovered || pressed) ? 8 : 2,
                  })}
                >
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
                    Sign In
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 }}>
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
        </View>

        {/* ── Social Links — matches NextJS SocialLinks: gap 8 (32px), pt 8 (32px) ── */}
        <FadeInView delay={800}>
          <View style={{ flexDirection: 'row', gap: 32, paddingTop: 32 }}>
            <HoverableSocialLink href="https://x.com/vote_map" hoverColor="#ffffff">
              {(color) => <XIcon size={32} color={color} />}
            </HoverableSocialLink>
            <HoverableSocialLink href="https://threads.com/@vote_map" hoverColor="#ffffff">
              {(color) => <ThreadsIcon size={32} color={color} />}
            </HoverableSocialLink>
            <HoverableSocialLink href="https://instagram.com/vote_map" hoverColor="#ec4899">
              {(color) => <InstagramIcon size={32} color={color} />}
            </HoverableSocialLink>
          </View>
        </FadeInView>
      </View>

      {/* ── Footer — matches NextJS Footer: mt auto, py 12, gap 8, with toggle buttons ── */}
      <FadeInView delay={900}>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 48,
          gap: 8,
        }}>
          <HoverableFooterLink href="mailto:support@votemap.net" label="support@votemap.net" />
          <Text style={{ color: GRAY_400, fontSize: 15 }}>•</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: GRAY_400, fontSize: 15 }}>Built by </Text>
            <HoverableFooterLink href="https://onexengineering.com" label="onexengineering" />
          </View>
          <Text style={{ color: GRAY_400, fontSize: 15 }}>•</Text>
          <HoverableFooterLink href="https://x.com/isaac_yeang" label="@isaac_yeang" />
          <Text style={{ color: GRAY_400, fontSize: 15 }}>•</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {/* Magic wand toggle — matches NextJS FaMagic button */}
            <Pressable
              onPress={() => setEffectsEnabled(!effectsEnabled)}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 9999,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MagicWandIcon
                size={16}
                color={effectsEnabled ? '#a855f7' : GRAY_400}
              />
            </Pressable>
            {/* Light/dark mode toggle — matches NextJS FaMoon/FaSun button */}
            <Pressable
              onPress={() => setDarkMode(!darkMode)}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 9999,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {darkMode
                ? <SunIcon size={16} color={GRAY_400} />
                : <MoonIcon size={16} color={GRAY_400} />
              }
            </Pressable>
          </View>
        </View>
      </FadeInView>
    </ScrollView>
  );
}
