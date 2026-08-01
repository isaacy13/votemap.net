import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/theme';
import { colors, FadeInView } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor } = useTheme();
  const { accessToken, isIdentityVerified, displayName, logout } = useAuthStore();

  const links = [
    { label: 'Outcomes', href: '/outcomes', hint: 'Stake with personal deadlines' },
    { label: 'Entities', href: '/entities', hint: 'Profiles, bounties, donations' },
    { label: 'Public ledger', href: '/ledger', hint: 'Radical transparency' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <ThemeToggle />
      </View>
      <FadeInView>
        <Text
          style={{
            color: textColor,
            fontSize: 42,
            fontWeight: '800',
            letterSpacing: -1,
            marginTop: 24,
          }}
        >
          votemap
        </Text>
        <Text style={{ color: subtitleColor, fontSize: 18, marginTop: 8, lineHeight: 26 }}>
          vote + roadmap — stake real money on outcomes you want delivered.
        </Text>
      </FadeInView>

      <View style={{ marginTop: 28, gap: 12 }}>
        {links.map((l) => (
          <Pressable
            key={l.href}
            onPress={() => router.push(l.href as `/outcomes`)}
            style={{
              backgroundColor: surfaceBg,
              borderWidth: 1,
              borderColor,
              borderRadius: 16,
              padding: 18,
            }}
          >
            <Text style={{ color: textColor, fontWeight: '700', fontSize: 17 }}>{l.label}</Text>
            <Text style={{ color: subtitleColor, marginTop: 4 }}>{l.hint}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 32 }}>
        {accessToken ? (
          <>
            <Text style={{ color: subtitleColor, marginBottom: 8 }}>
              Signed in as {displayName ?? 'voter'}
              {isIdentityVerified ? ' · verified' : ' · needs ZKPassport'}
            </Text>
            {!isIdentityVerified && (
              <Pressable
                onPress={() => router.push('/auth/verify')}
                style={{
                  backgroundColor: colors.purple,
                  paddingVertical: 14,
                  borderRadius: 999,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Verify identity</Text>
              </Pressable>
            )}
            <Pressable onPress={() => logout()}>
              <Text style={{ color: colors.red, textAlign: 'center' }}>Log out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={{
              backgroundColor: colors.purple,
              paddingVertical: 16,
              borderRadius: 999,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sign in</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
