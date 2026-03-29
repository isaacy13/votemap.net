import React, { useEffect } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuth from 'expo-apple-authentication';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuthStore, useGoogleAuth } from '../../store/auth';
import { colors, FadeInView } from '../../components/ui';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, isLoading, error, isAuthenticated } = useAuthStore();

  // Google Auth setup
  const [request, response, promptAsync] = useGoogleAuth();

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      signInWithGoogle(response.authentication.idToken)
        .then(() => router.replace('/'))
        .catch(() => {});
    }
  }, [response]);

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
      if (Platform.OS === 'ios') {
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
      } else {
        useAuthStore.getState().setError('Apple Sign-In is only available on iOS devices');
      }
    } catch (err) {
      console.error('Apple login failed:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      {/* Logo */}
      <FadeInView delay={0} style={{ alignItems: 'center', marginBottom: 40 }}>
        <Svg width={200} height={50} viewBox="0 0 200 50">
          <Defs>
            <SvgGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={colors.gradient.start} />
              <Stop offset="50%" stopColor={colors.gradient.middle} />
              <Stop offset="100%" stopColor={colors.gradient.end} />
            </SvgGradient>
          </Defs>
          <SvgText
            x="100"
            y="36"
            textAnchor="middle"
            fill="url(#loginGrad)"
            fontSize="36"
            fontWeight="800"
          >
            votemap
          </SvgText>
        </Svg>
      </FadeInView>

      <FadeInView delay={100}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          letterSpacing: -0.5,
        }}>
          Welcome
        </Text>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 22,
        }}>
          Sign in to contribute and vote on bounties
        </Text>
      </FadeInView>

      {/* Error Message */}
      {error && (
        <FadeInView delay={0}>
          <View style={{
            backgroundColor: colors.red + '15',
            borderRadius: 12,
            padding: 12,
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

      {/* Auth Buttons */}
      <View style={{ marginTop: 36, gap: 14 }}>
        <FadeInView delay={200}>
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#f0f0f0' : '#ffffff',
              padding: 16,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              opacity: isLoading ? 0.6 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Text style={{ fontSize: 20 }}>G</Text>
                <Text style={{ color: '#000000', fontSize: 17, fontWeight: '600' }}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </FadeInView>

        <FadeInView delay={300}>
          <Pressable
            onPress={handleAppleLogin}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.surfaceHover : colors.surface,
              padding: 16,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isLoading ? 0.6 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={{ color: '#ffffff', fontSize: 20 }}></Text>
                <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '600' }}>
                  Continue with Apple
                </Text>
              </>
            )}
          </Pressable>
        </FadeInView>
      </View>

      {/* Skip / Browse without signing in */}
      <FadeInView delay={400}>
        <Pressable
          onPress={() => router.replace('/')}
          style={({ pressed }) => ({
            marginTop: 20,
            padding: 14,
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '500' }}>
            Browse without signing in →
          </Text>
        </Pressable>
      </FadeInView>

      {/* Footer Note */}
      <FadeInView delay={500}>
        <View style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
            Read-only access granted on sign-in.{'\n'}
            <Text style={{ color: colors.purple }}>Link your X account</Text> for write access.
          </Text>
        </View>
      </FadeInView>
    </View>
  );
}
