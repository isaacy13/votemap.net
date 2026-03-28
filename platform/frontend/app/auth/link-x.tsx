import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth';
import { authConfig } from '../../config/auth';
import { colors, FadeInView, GlowCard } from '../../components/ui';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
  tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
};

export default function LinkXScreen() {
  const router = useRouter();
  const { linkXAccount, isXLinked, isLoading, error } = useAuthStore();

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
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' }}>
      <FadeInView delay={0}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          letterSpacing: -0.5,
        }}>
          Link X Account
        </Text>
        <Text style={{
          fontSize: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 22,
        }}>
          Required for write access
        </Text>
      </FadeInView>

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

      {isXLinked ? (
        <FadeInView delay={200}>
          <GlowCard style={{ marginTop: 32 }}>
            <View style={{ alignItems: 'center', gap: 12 }}>
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
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
                Your X account is linked and identity verified.{'\n'}You now have full write access.
              </Text>
            </View>
          </GlowCard>
        </FadeInView>
      ) : (
        <View style={{ marginTop: 32, gap: 16 }}>
          <FadeInView delay={200}>
            <GlowCard>
              <View style={{ gap: 16 }}>
                {[
                  { icon: '📝', title: 'Create Issues', desc: 'Propose new bounties for entities' },
                  { icon: '💰', title: 'Contribute', desc: 'Fund bounties with USDC' },
                  { icon: '🗳️', title: 'Vote', desc: 'Approve, reject, or pullout' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlowCard>
          </FadeInView>

          <FadeInView delay={400}>
            <Pressable
              onPress={handleLinkX}
              disabled={isLoading || !request}
              style={({ pressed }) => ({
                overflow: 'hidden',
                borderRadius: 14,
                opacity: isLoading ? 0.6 : pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <LinearGradient
                colors={[colors.surface, colors.surfaceHover]}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>𝕏</Text>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                      Link X Account
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </FadeInView>

          <FadeInView delay={500}>
            <Text style={{
              color: colors.textMuted,
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 18,
            }}>
              Identity verified via X API{'\n'}(gold/blue checkmark or ID verification)
            </Text>
          </FadeInView>
        </View>
      )}
    </View>
  );
}
