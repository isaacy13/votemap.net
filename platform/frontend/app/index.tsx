import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ padding: 20 }}
    >
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#ffffff' }}>
          votemap
        </Text>
        <Text style={{ fontSize: 18, color: '#a0a0a0', marginTop: 8 }}>
          democratize everything
        </Text>
      </View>

      <View style={{ marginTop: 40, gap: 16 }}>
        {!isAuthenticated ? (
          <>
            <Pressable
              onPress={() => router.push('/auth/login')}
              style={{
                backgroundColor: '#3b82f6',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                Sign In
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ color: '#ffffff', fontSize: 16 }}>
              Welcome, {user?.displayName ?? 'Voter'}
            </Text>
            <Pressable
              onPress={() => router.push('/issues')}
              style={{
                backgroundColor: '#3b82f6',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                Browse Issues
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}
