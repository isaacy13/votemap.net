import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuth from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuthStore, useGoogleAuth } from '../../store/auth';
import { authConfig } from '../../config/auth';
import { colors, FadeInView } from '../../components/ui';
import { useTheme } from '../../context/theme';
import { ThemeToggle } from '../../components/ThemeToggle';

WebBrowser.maybeCompleteAuthSession();

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Apple OAuth discovery for web fallback
const appleDiscovery = {
  authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
};

/** Web-only SVG className prop */
const webClassName = (name: string): Record<string, string> =>
  Platform.OS === 'web' ? { className: name } : {};

/** Inject stroke-drawing CSS keyframes on web (same as home page) */
function useWebStrokeAnimation() {
  const injected = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || injected.current) return;
    injected.current = true;
    // Only inject if not already present (home page may have added them)
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

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, isLoading, error, isAuthenticated } = useAuthStore();
  const [appleNativeAvailable, setAppleNativeAvailable] = useState(false);
  const { darkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted: themeMuted } = useTheme();
  const isWeb = Platform.OS === 'web';
  const strokeColor = darkMode ? '#ffffff' : '#1a202c';

  useWebStrokeAnimation();

  useEffect(() => {
    AppleAuth.isAvailableAsync().then(setAppleNativeAvailable);
  }, []);

  // Google Auth setup
  const [request, response, promptAsync] = useGoogleAuth();

  // Apple web auth (fallback for Safari/macOS)
  const appleRedirectUri = AuthSession.makeRedirectUri({ scheme: 'votemap' });
  const [appleRequest, appleResponse, applePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: authConfig.apple.serviceId,
      redirectUri: appleRedirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['name', 'email'],
    },
    appleDiscovery
  );

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      signInWithGoogle(response.authentication.idToken)
        .then(() => router.replace('/'))
        .catch(() => {});
    }
  }, [response]);

  // Handle Apple web auth response
  useEffect(() => {
    if (appleResponse?.type === 'success' && appleResponse.params?.id_token) {
      signInWithApple(appleResponse.params.id_token)
        .then(() => router.replace('/'))
        .catch(() => {});
    }
  }, [appleResponse]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error('Google login prompt failed:', err);
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (appleNativeAvailable) {
        const credential = await AppleAuth.signInAsync({
          requestedScopes: [
            AppleAuth.AppleAuthenticationScope.FULL_NAME,
            AppleAuth.AppleAuthenticationScope.EMAIL,
          ],
        });
        if (credential.identityToken) {
          await signInWithApple(credential.identityToken);
          router.replace('/');
        }
      } else if (isWeb) {
        await applePromptAsync();
      } else {
        useAuthStore.getState().setError('Apple Sign-In is not available on this device');
      }
    } catch (err) {
      console.error('Apple login failed:', err);
    }
  };

  /** SVG text props matching the home page VotemapHeading exactly */
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
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        minHeight: SCREEN_HEIGHT * 0.85,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 480, alignItems: 'center' }}>

        {/* ── Votemap heading — same as home page ── */}
        <FadeInView delay={0} style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 480, height: 120, position: 'relative' }}>
            {/* Gradient fill text */}
            {isWeb ? (
              <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
                  <Defs>
                    <SvgGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#3b82f6" />
                      <Stop offset="50%" stopColor="#8b5cf6" />
                      <Stop offset="100%" stopColor="#ef4444" />
                    </SvgGradient>
                  </Defs>
                  <SvgText
                    {...textProps}
                    fill="url(#loginGrad)"
                    {...webClassName('votemap-gradient')}
                  >
                    votemap
                  </SvgText>
                </Svg>
              </View>
            ) : (
              <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
                  <Defs>
                    <SvgGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor="#3b82f6" />
                      <Stop offset="50%" stopColor="#8b5cf6" />
                      <Stop offset="100%" stopColor="#ef4444" />
                    </SvgGradient>
                  </Defs>
                  <SvgText {...textProps} fill="url(#loginGrad)">
                    votemap
                  </SvgText>
                </Svg>
              </View>
            )}
            {/* Wireframe stroke text — draws on load via CSS animation */}
            <Svg width="100%" height="100%" viewBox="0 0 900 180" style={{ overflow: 'visible' }}>
              <SvgText
                {...textProps}
                fill={strokeColor}
                fillOpacity={0}
                stroke={strokeColor}
                strokeWidth={2}
                {...(isWeb
                  ? webClassName(darkMode ? 'votemap-stroke-dark' : 'votemap-stroke-light')
                  : { strokeOpacity: darkMode ? 0.3 : 0.2, strokeDasharray: '3000', strokeDashoffset: '0' }
                )}
              >
                votemap
              </SvgText>
            </Svg>
          </View>
        </FadeInView>

        {/* ── Title text ── */}
        <FadeInView delay={200}>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: textColor,
            textAlign: 'center',
            letterSpacing: -0.5,
            marginTop: 8,
          }}>
            Sign in to get started
          </Text>
        </FadeInView>
        <FadeInView delay={300}>
          <Text style={{
            fontSize: 18,
            color: subtitleColor,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 26,
          }}>
            contribute and vote on bounties
          </Text>
        </FadeInView>

        {/* Error Message */}
        {error && (
          <FadeInView delay={0}>
            <View style={{
              backgroundColor: colors.red + '15',
              borderRadius: 9999,
              paddingVertical: 10,
              paddingHorizontal: 20,
              marginTop: 20,
              borderWidth: 1,
              borderColor: colors.red + '30',
            }}>
              <Text style={{ color: colors.red, fontSize: 14, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          </FadeInView>
        )}

        {/* ── Auth Buttons — capsule/pill style matching home CTA ── */}
        <View style={{ marginTop: 40, gap: 16, width: '100%', maxWidth: 380, alignSelf: 'center' }}>
          <FadeInView delay={400}>
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 9999,
                paddingVertical: 16,
                paddingHorizontal: 40,
                height: 64,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isLoading ? 0.6 : 1,
                transform: [{ translateY: (hovered || pressed) ? -2 : 0 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: (hovered || pressed) ? 12 : 2 },
                shadowOpacity: (hovered || pressed) ? 0.3 : 0.1,
                shadowRadius: (hovered || pressed) ? 20 : 4,
                elevation: (hovered || pressed) ? 8 : 2,
              })}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Text style={{ color: textColor, fontSize: 20, fontWeight: '600' }}>
                  Continue with Google
                </Text>
              )}
            </Pressable>
          </FadeInView>

          <FadeInView delay={500}>
            <Pressable
              onPress={handleAppleLogin}
              disabled={isLoading}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
                backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 9999,
                paddingVertical: 16,
                paddingHorizontal: 40,
                height: 64,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isLoading ? 0.6 : 1,
                transform: [{ translateY: (hovered || pressed) ? -2 : 0 }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: (hovered || pressed) ? 12 : 2 },
                shadowOpacity: (hovered || pressed) ? 0.3 : 0.1,
                shadowRadius: (hovered || pressed) ? 20 : 4,
                elevation: (hovered || pressed) ? 8 : 2,
              })}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Text style={{ color: textColor, fontSize: 20, fontWeight: '600' }}>
                   Continue with Apple
                </Text>
              )}
            </Pressable>
          </FadeInView>
        </View>

        {/* Browse without signing in */}
        <FadeInView delay={600}>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              marginTop: 32,
              paddingVertical: 14,
              paddingHorizontal: 28,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: subtitleColor, fontSize: 16, fontWeight: '500' }}>
              Browse without signing in →
            </Text>
          </Pressable>
        </FadeInView>

        {/* Info note */}
        <FadeInView delay={700}>
          <Text style={{
            color: themeMuted,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 40,
            lineHeight: 22,
          }}>
            Read-only access on sign-in · <Text style={{ color: colors.purple }}>Link X</Text> for write access
          </Text>
        </FadeInView>

        {/* Theme Toggle */}
        <View style={{ marginTop: 24 }}>
          <ThemeToggle />
        </View>
      </View>
    </ScrollView>
  );
}
