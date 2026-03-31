import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useAuthStore } from '../store/auth';
import { colors, FadeInView } from '../components/ui';
import { useTheme } from '../context/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Track whether the initial home animation has already played.
 *  When true, skip entrance animations on re-mount (e.g. navigating back). */
let _homeAnimPlayed = false;

/** Web-only hover props for Pressable (supported by react-native-web) */
const hoverProps = Platform.OS === 'web' ? (
  (setHovered: (h: boolean) => void) => ({
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
  })
) : () => ({});

/** Web-only SVG className prop — typed as Record for spread compatibility.
 *  react-native-svg types don't include className, but the web renderer supports it. */
const webClassName = (name: string): Record<string, string> =>
  Platform.OS === 'web' ? { className: name } : {};

/** Web-only CSS transition style — no-op on native */
const webTransition = Platform.OS === 'web'
  ? { transition: 'all 0.2s' } as Record<string, string>
  : {};

/** Pill-button shadow style — uses CSS boxShadow on web for smooth transitions,
 *  falls back to RN shadow* props on native. */
const pillShadow = (hovered: boolean): Record<string, any> =>
  Platform.OS === 'web'
    ? { boxShadow: hovered ? '0 12px 20px rgba(0,0,0,0.25)' : '0 2px 4px rgba(0,0,0,0.08)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hovered ? 12 : 2 },
        shadowOpacity: hovered ? 0.3 : 0.1,
        shadowRadius: hovered ? 20 : 4,
        elevation: hovered ? 8 : 2,
      };

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

function AnimatedSpark({ spark, initialDelay = 6 }: { spark: Spark; initialDelay?: number }) {
  const opacity = useSharedValue(0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  useEffect(() => {
    const d = (initialDelay + spark.delay) * 1000;
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
   - Wireframe stroke-drawing animation via CSS @keyframes on web
   - Gradient text fades in at 6s
   - System font stack matching Geist Sans visual weight */

/** CSS keyframes injected into <head> for the stroke-draw animation on web.
 *  Matches NextJS VotemapHeading framer-motion animation exactly:
 *  - strokeDashoffset: 3000 → 0 over 6s easeInOut (separate animation)
 *  - strokeOpacity: 0.8 → final over 1.5s with 5s delay (separate animation)
 *  - stroke uses theme-aware color (currentColor equivalent)
 *  - Gradient text fades in at the 6s mark */
function useWebStrokeAnimation() {
  const injected = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || injected.current) return;
    injected.current = true;
    // Skip if already injected (login page may have added them first)
    if (document.querySelector('style[data-votemap-stroke]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-votemap-stroke', '1');
    style.textContent = `
      @keyframes votemap-dash {
        0% { stroke-dashoffset: 3000; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes votemap-opacity-dark {
        0% { stroke-opacity: 0.8; }
        100% { stroke-opacity: 0.3; }
      }
      @keyframes votemap-opacity-light {
        0% { stroke-opacity: 0.8; }
        100% { stroke-opacity: 0.2; }
      }
      @keyframes votemap-appear {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes votemap-gradient-fade {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      .votemap-stroke-dark {
        stroke-dasharray: 3000;
        stroke-dashoffset: 3000;
        stroke-opacity: 0.8;
        opacity: 0;
        animation:
          votemap-appear 0.5s ease-out forwards,
          votemap-dash 6s ease-in-out forwards,
          votemap-opacity-dark 1.5s ease-out 5s forwards;
      }
      .votemap-stroke-light {
        stroke-dasharray: 3000;
        stroke-dashoffset: 3000;
        stroke-opacity: 0.8;
        opacity: 0;
        animation:
          votemap-appear 0.5s ease-out forwards,
          votemap-dash 6s ease-in-out forwards,
          votemap-opacity-light 1.5s ease-out 5s forwards;
      }
      .votemap-gradient {
        opacity: 0;
        animation: votemap-gradient-fade 2s ease-out 6s forwards;
      }
    `;
    document.head.appendChild(style);
  }, []);
}

function VotemapHeading({ effectsEnabled = true, darkMode = true, skipAnimation = false }: { effectsEnabled?: boolean; darkMode?: boolean; skipAnimation?: boolean }) {
  const sparks = useMemo(generateSparks, []);
  const gradientOpacity = useSharedValue(skipAnimation ? 1 : 0);
  const isWeb = Platform.OS === 'web';
  /** Stroke color follows the theme — matches NextJS "currentColor" approach */
  const strokeColor = darkMode ? '#ffffff' : '#1a202c';

  useWebStrokeAnimation();

  useEffect(() => {
    if (!isWeb && !skipAnimation) {
      gradientOpacity.value = withDelay(6000, withTiming(1, { duration: 2000 }));
    }
  }, []);

  const gradientStyle = useAnimatedStyle(() => ({ opacity: gradientOpacity.value }));

  /** Common SVG text props for both layers */
  const textProps = {
    x: '450',
    y: '90',
    textAnchor: 'middle' as const,
    alignmentBaseline: 'central' as const,
    fontSize: '140',
    fontWeight: '800' as const,
    letterSpacing: -7,
    fontFamily: Platform.select({
      web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      default: undefined,
    }),
  };

  return (
    <View style={{ width: '100%', maxWidth: 1200, height: 180, alignItems: 'center', position: 'relative' }}>
      {effectsEnabled && sparks.map((s) => (
        <AnimatedSpark key={s.id} spark={s} initialDelay={skipAnimation ? 0 : 6} />
      ))}

      <View style={{ width: '100%', height: '100%' }}>
        {/* Gradient fill text */}
        {effectsEnabled && (
          isWeb ? (
            <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
              <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
                <Defs>
                  <SvgGradient id="headingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#3b82f6" />
                    <Stop offset="50%" stopColor="#8b5cf6" />
                    <Stop offset="100%" stopColor="#ef4444" />
                  </SvgGradient>
                </Defs>
                <SvgText
                  {...textProps}
                  fill="url(#headingGrad)"
                  {...(skipAnimation ? {} : webClassName('votemap-gradient'))}
                >
                  votemap
                </SvgText>
              </Svg>
            </View>
          ) : (
            <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, gradientStyle]}>
              <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
                <Defs>
                  <SvgGradient id="headingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#3b82f6" />
                    <Stop offset="50%" stopColor="#8b5cf6" />
                    <Stop offset="100%" stopColor="#ef4444" />
                  </SvgGradient>
                </Defs>
                <SvgText {...textProps} fill="url(#headingGrad)">
                  votemap
                </SvgText>
              </Svg>
            </Animated.View>
          )
        )}

        {/* Wireframe stroke text — draws on page load via CSS animation on web.
            Uses theme-aware color (matches NextJS fill="currentColor" + fillOpacity=0)
            with separate animation classes for dark/light stroke-opacity end values. */}
        <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
          <SvgText
            {...textProps}
            fill={strokeColor}
            fillOpacity={0}
            stroke={strokeColor}
            strokeWidth={2}
            {...(isWeb
              ? (skipAnimation
                  ? {} // final state: no animation classes, use inline attrs below
                  : webClassName(darkMode ? 'votemap-stroke-dark' : 'votemap-stroke-light'))
              : { strokeOpacity: darkMode ? 0.3 : 0.2, strokeDasharray: '3000', strokeDashoffset: '0' }
            )}
            {...(isWeb && skipAnimation ? { strokeOpacity: darkMode ? 0.3 : 0.2, strokeDasharray: '3000', strokeDashoffset: '0' } : {})}
          >
            votemap
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

/* ── Hoverable social link wrapper ────────────────────────────────────
   Uses @expo/vector-icons (FontAwesome6 brands + FontAwesome) instead
   of self-rolled SVGs — matching NextJS react-icons/fa6 and react-icons/fa.
   On hover: color changes + scale(1.2), matching NextJS _hover behavior. */

function HoverableSocialLink({
  href,
  hoverColor,
  children,
}: {
  href: string;
  hoverColor: string;
  children: (color: string) => React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const currentColor = hovered ? hoverColor : GRAY_400;
  const scale = hovered ? 1.2 : 1;

  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      {...(hoverProps(setHovered) as any)}
      style={{ transform: [{ scale }], ...webTransition }}
    >
      {children(currentColor)}
    </Pressable>
  );
}

/* ── Hoverable footer link ────────────────────────────────────────── */

function HoverableFooterLink({
  href,
  label,
  onPressOverride,
  darkMode = true,
}: {
  href: string;
  label: string;
  onPressOverride?: () => void;
  darkMode?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  /** Links use a brighter/more distinct color from surrounding footer text,
   *  making them clearly identifiable as interactive. On hover → blue. */
  const linkColor = darkMode ? '#e2e8f0' : '#4a5568';

  return (
    <Pressable
      onPress={onPressOverride ?? (() => Linking.openURL(href))}
      {...(hoverProps(setHovered) as any)}
    >
      <Text style={{
        color: hovered ? '#3b82f6' : linkColor,
        fontSize: 15,
        fontWeight: '500',
        textDecorationLine: 'underline',
        ...webTransition,
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
  const { darkMode, setDarkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, footerGray } = useTheme();

  /** Skip entrance animations if the user has already seen them this session */
  const skipAnim = _homeAnimPlayed;
  useEffect(() => { _homeAnimPlayed = true; }, []);

  /** Wrapper: skips FadeInView animation on return visits */
  const Wrap = skipAnim
    ? ({ children, style }: { children: React.ReactNode; delay?: number; style?: any }) => <View style={style}>{children}</View>
    : FadeInView;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
        minHeight: SCREEN_HEIGHT * 0.85,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero section ── */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 0,
      }}>
        <View style={{ alignItems: 'center', width: '100%', gap: 0 }}>
          <VotemapHeading effectsEnabled={effectsEnabled} darkMode={darkMode} skipAnimation={skipAnim} />

          {/* "democratize everything" — matches NextJS HeroContent */}
          <Wrap delay={200}>
            <Text style={{
              fontSize: 36,
              fontWeight: '800',
              color: textColor,
              textAlign: 'center',
              marginTop: -8,
              letterSpacing: -0.5,
            }}>
              democratize everything
            </Text>
          </Wrap>

          {/* "vote for the future you want to see" */}
          <Wrap delay={400}>
            <Text style={{
              fontSize: 22,
              color: subtitleColor,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 30,
              maxWidth: 600,
            }}>
              vote for the future you want to see
            </Text>
          </Wrap>

          {/* ── CTA Buttons — pill style matching NextJS ── */}
          <Wrap delay={600}>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Pressable
                onPress={() => router.push('/issues')}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                  backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  paddingHorizontal: 40,
                  height: 64,
                  justifyContent: 'center' as const,
                  transform: [{ translateY: hovered ? -4 : 0 }],
                  ...pillShadow(!!hovered),
                  ...webTransition,
                })}
              >
                <Text style={{ color: textColor, fontSize: 20, fontWeight: '600' }}>
                  🗳️  Browse Issues
                </Text>
              </Pressable>

              {!isAuthenticated ? (
                <Pressable
                  onPress={() => router.push('/auth/login')}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                    backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 9999,
                    paddingVertical: 16,
                    paddingHorizontal: 40,
                    height: 64,
                    justifyContent: 'center' as const,
                    transform: [{ translateY: hovered ? -4 : 0 }],
                    ...pillShadow(!!hovered),
                    ...webTransition,
                  })}
                >
                  <Text style={{ color: textColor, fontSize: 20, fontWeight: '600' }}>
                    Sign In
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 64 }}>
                  <Text style={{ color: darkMode ? colors.textSecondary : '#718096', fontSize: 15 }}>
                    {user?.displayName ?? 'Voter'}
                  </Text>
                  <Pressable onPress={signOut} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text style={{ color: darkMode ? colors.textMuted : '#a0aec0', fontSize: 14, textDecorationLine: 'underline' }}>
                      Sign Out
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Wrap>
        </View>

        {/* ── Social Links — @expo/vector-icons FontAwesome6 (brands) ── */}
        <Wrap delay={800}>
          <View style={{ flexDirection: 'row', gap: 32, paddingTop: 32 }}>
            <HoverableSocialLink href="https://x.com/vote_map" hoverColor={darkMode ? '#ffffff' : '#000000'}>
              {(color) => <FontAwesome6 name="x-twitter" size={32} color={color} iconStyle="brand" />}
            </HoverableSocialLink>
            <HoverableSocialLink href="https://threads.com/@vote_map" hoverColor={darkMode ? '#ffffff' : '#000000'}>
              {(color) => <FontAwesome6 name="threads" size={32} color={color} iconStyle="brand" />}
            </HoverableSocialLink>
            <HoverableSocialLink href="https://instagram.com/vote_map" hoverColor="#ec4899">
              {(color) => <FontAwesome name="instagram" size={32} color={color} />}
            </HoverableSocialLink>
          </View>
        </Wrap>
      </View>

      {/* ── Footer — matching NextJS Footer ── */}
      <Wrap delay={900}>
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 48,
          gap: 8,
        }}>
          <HoverableFooterLink href="mailto:support@votemap.net" label="support@votemap.net" darkMode={darkMode} />
          <Text style={{ color: footerGray, fontSize: 15 }}>•</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: footerGray, fontSize: 15 }}>Built by </Text>
            <HoverableFooterLink href="https://onexengineering.com" label="onexengineering" darkMode={darkMode} />
          </View>
          <Text style={{ color: footerGray, fontSize: 15 }}>•</Text>
          <HoverableFooterLink href="https://x.com/isaac_yeang" label="@isaac_yeang" darkMode={darkMode} />
          <Text style={{ color: footerGray, fontSize: 15 }}>•</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {/* Magic wand toggle — FontAwesome "magic" matching NextJS FaMagic */}
            <Pressable
              onPress={() => setEffectsEnabled(!effectsEnabled)}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 9999,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <FontAwesome
                name="magic"
                size={16}
                color={effectsEnabled ? '#a855f7' : footerGray}
              />
            </Pressable>
            {/* Light/dark mode toggle — FontAwesome sun/moon matching NextJS FaSun/FaMoon */}
            <Pressable
              onPress={() => setDarkMode(!darkMode)}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 9999,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <FontAwesome
                name={darkMode ? 'sun-o' : 'moon-o'}
                size={16}
                color={footerGray}
              />
            </Pressable>
          </View>
        </View>
      </Wrap>
    </ScrollView>
  );
}
