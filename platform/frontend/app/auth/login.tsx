import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithApple();
      router.replace('/');
    } catch (error) {
      console.error('Apple login failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
        Sign In
      </Text>
      <Text style={{ fontSize: 16, color: '#a0a0a0', textAlign: 'center', marginTop: 8 }}>
        Sign in with Google or Apple to browse issues
      </Text>

      <View style={{ marginTop: 40, gap: 16 }}>
        <Pressable
          onPress={handleGoogleLogin}
          style={{
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Text style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>
            Continue with Google
          </Text>
        </Pressable>

        <Pressable
          onPress={handleAppleLogin}
          style={{
            backgroundColor: '#000000',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: '#333333',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
            Continue with Apple
          </Text>
        </Pressable>
      </View>

      <Text style={{ color: '#666666', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
        Read-only access. Link your X account for write access.
      </Text>
    </View>
  );
}
