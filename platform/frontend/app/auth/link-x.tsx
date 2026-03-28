import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth';

export default function LinkXScreen() {
  const router = useRouter();
  const { linkXAccount, isXLinked } = useAuthStore();

  const handleLinkX = async () => {
    try {
      await linkXAccount();
      router.back();
    } catch (error) {
      console.error('X linking failed:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>
        Link X Account
      </Text>
      <Text style={{ fontSize: 16, color: '#a0a0a0', textAlign: 'center', marginTop: 8 }}>
        Required for write access: creating issues, contributing, and voting
      </Text>

      {isXLinked ? (
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Text style={{ color: '#22c55e', fontSize: 18, fontWeight: '600' }}>
            ✓ X Account Linked & Verified
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 40, gap: 16 }}>
          <Pressable
            onPress={handleLinkX}
            style={{
              backgroundColor: '#000000',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#333333',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
              Link X Account
            </Text>
          </Pressable>
          <Text style={{ color: '#666666', fontSize: 12, textAlign: 'center' }}>
            Identity verification via X API (gold/blue checkmark or ID upload)
          </Text>
        </View>
      )}
    </View>
  );
}
