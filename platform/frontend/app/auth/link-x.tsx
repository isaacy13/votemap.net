import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../store/auth';
import { authConfig } from '../../config/auth';
import { colors, FadeInView } from '../../components/ui';
import { useTheme } from '../../context/theme';
import { ThemeToggle } from '../../components/ThemeToggle';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
  tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
};

export default function LinkXScreen() {
  const router = useRouter();
  const { linkXAccount, isXLinked, isLoading, error } = useAuthStore();
  const { darkMode, bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted: themeMuted } = useTheme();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'votemap' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: authConfig.x.clientId,
      redirectUri,
      scopes: ['users.read', 'tweet.read'],
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      linkXAccount(response.params.code, redirectUri)
        .then(() => router.back())
        .catch(() => {});
    }
  }, [response]);

  const handleLinkX = async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error('X linking failed:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 420, alignItems: 'center' }}>
        <FadeInView delay={0}>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: textColor,
            textAlign: 'center',
            letterSpacing: -0.3,
          }}>
            Link X Account
          </Text>
          <Text style={{
            fontSize: 16,
            color: subtitleColor,
            textAlign: 'center',
            marginTop: 6,
            lineHeight: 22,
          }}>
            required for write access
          </Text>
        </FadeInView>

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

        {isXLinked ? (
          <FadeInView delay={200}>
            <View style={{ alignItems: 'center', gap: 12, marginTop: 32 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.green + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 28 }}>✓</Text>
              </View>
              <Text style={{ color: colors.green, fontSize: 20, fontWeight: '700' }}>
                Verified
              </Text>
              <Text style={{ color: subtitleColor, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                Your X account is linked and identity verified.{'\n'}You now have full write access.
              </Text>
            </View>
          </FadeInView>
        ) : (
          <View style={{ marginTop: 32, gap: 16, width: '100%', alignItems: 'center' }}>
            <FadeInView delay={200}>
              <View style={{ gap: 16, width: '100%' }}>
                {[
                  { icon: '📝', title: 'Create Issues', desc: 'Propose new bounties for entities' },
                  { icon: '💰', title: 'Contribute', desc: 'Fund bounties with USDC' },
                  { icon: '🗳️', title: 'Vote', desc: 'Approve, reject, or pullout' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
                      <Text style={{ color: themeMuted, fontSize: 13 }}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </FadeInView>

            <FadeInView delay={400}>
              <Pressable
                onPress={handleLinkX}
                disabled={isLoading || !request}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? (darkMode ? colors.surfaceHover : '#e2e8f0') : surfaceBg,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  paddingHorizontal: 40,
                  height: 58,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: isLoading ? 0.6 : 1,
                  width: '100%',
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
                    𝕏  Link X Account
                  </Text>
                )}
              </Pressable>
            </FadeInView>

            <FadeInView delay={500}>
              <Text style={{
                color: themeMuted,
                fontSize: 13,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 20,
              }}>
                Identity verified via X API · gold/blue checkmark or ID verification
              </Text>
            </FadeInView>
          </View>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />
      </View>
    </View>
  );
}
