import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
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

// Apple OAuth discovery for web fallback
const appleDiscovery = {
  authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
};

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, isLoading, error, isAuthenticated } = useAuthStore();
  const [appleNativeAvailable, setAppleNativeAvailable] = useState(false);
  const { darkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted: themeMuted } = useTheme();

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
        // Native Apple Sign-In (iOS/macOS native)
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
      } else if (Platform.OS === 'web') {
        // Web fallback: use OAuth session (works in Safari on macOS)
        await applePromptAsync();
      } else {
        useAuthStore.getState().setError('Apple Sign-In is not available on this device');
      }
    } catch (err) {
      console.error('Apple login failed:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 420, alignItems: 'center' }}>
        {/* Logo */}
        <FadeInView delay={0} style={{ alignItems: 'center', marginBottom: 16 }}>
          <Svg width={280} height={70} viewBox="0 0 900 180">
            <Defs>
              <SvgGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={colors.gradient.start} />
                <Stop offset="50%" stopColor={colors.gradient.middle} />
                <Stop offset="100%" stopColor={colors.gradient.end} />
              </SvgGradient>
            </Defs>
            <SvgText
              x="450"
              y="140"
              textAnchor="middle"
              fill="url(#loginGrad)"
              fontSize="140"
              fontWeight="800"
              letterSpacing={-7}
            >
              votemap
            </SvgText>
          </Svg>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: textColor,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}>
            Sign in to get started
          </Text>
          <Text style={{
            fontSize: 16,
            color: subtitleColor,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 22,
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

        {/* Auth Buttons — capsule/pill style matching home page */}
        <View style={{ marginTop: 32, gap: 12, width: '100%' }}>
          <FadeInView delay={200}>
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={({ pressed }) => ({
                backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 9999,
                paddingVertical: 16,
                paddingHorizontal: 32,
                height: 58,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isLoading ? 0.6 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: pressed ? 8 : 2 },
                shadowOpacity: pressed ? 0.2 : 0.08,
                shadowRadius: pressed ? 16 : 4,
                elevation: pressed ? 6 : 2,
              })}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '600' }}>
                  Continue with Google
                </Text>
              )}
            </Pressable>
          </FadeInView>

          <FadeInView delay={300}>
            <Pressable
              onPress={handleAppleLogin}
              disabled={isLoading}
              style={({ pressed }) => ({
                backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 9999,
                paddingVertical: 16,
                paddingHorizontal: 32,
                height: 58,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: isLoading ? 0.6 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: pressed ? 8 : 2 },
                shadowOpacity: pressed ? 0.2 : 0.08,
                shadowRadius: pressed ? 16 : 4,
                elevation: pressed ? 6 : 2,
              })}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '600' }}>
                   Continue with Apple
                </Text>
              )}
            </Pressable>
          </FadeInView>
        </View>

        {/* Browse without signing in */}
        <FadeInView delay={400}>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: subtitleColor, fontSize: 15, fontWeight: '500' }}>
              Browse without signing in →
            </Text>
          </Pressable>
        </FadeInView>

        {/* Info note */}
        <FadeInView delay={500}>
          <Text style={{
            color: themeMuted,
            fontSize: 13,
            textAlign: 'center',
            marginTop: 32,
            lineHeight: 20,
          }}>
            Read-only access on sign-in · <Text style={{ color: colors.purple }}>Link X</Text> for write access
          </Text>
        </FadeInView>

        {/* Theme Toggle */}
        <ThemeToggle />
      </View>
    </View>
  );
}
