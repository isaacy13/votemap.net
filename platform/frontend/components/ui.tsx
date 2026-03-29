import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

/** Shared color palette matching the NextJS landing page */
export const colors = {
  bg: '#0a0a0a',
  surface: '#111118',
  surfaceLight: '#1a1a2e',
  surfaceHover: '#252540',
  border: '#2a2a3e',
  borderLight: '#333350',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  gradient: {
    start: '#3b82f6',
    middle: '#8b5cf6',
    end: '#ef4444',
  },
};

/** Animated fade-in wrapper */
export function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={style}>
      {children}
    </Animated.View>
  );
}

/** Animated card with subtle glow border */
export function GlowCard({
  children,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify()}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          shadowColor: colors.purple,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Pulsing dot indicator */
export function PulsingDot({ color = colors.green, size = 8 }: { color?: string; size?: number }) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export { FadeInDown };
