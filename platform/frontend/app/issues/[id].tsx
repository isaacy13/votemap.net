import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isWriteEnabled } = useAuthStore();

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.getIssue(id!),
    enabled: !!id,
  });

  if (isLoading || !issue) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#a0a0a0', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#ffffff' }}>
        {issue.title}
      </Text>

      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
      }}>
        <View style={{
          backgroundColor: issue.status === 'open' ? '#22c55e' : '#eab308',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: '#000000', fontWeight: '600' }}>{issue.status.toUpperCase()}</Text>
        </View>
        <Text style={{ color: '#3b82f6', fontSize: 20, fontWeight: '700' }}>
          ${issue.totalBountyUsdc} USDC
        </Text>
      </View>

      {issue.entity && (
        <Text style={{ color: '#a0a0a0', fontSize: 14, marginTop: 8 }}>
          Entity: {issue.entity.name} ({issue.entity.type})
        </Text>
      )}

      <Text style={{ color: '#ffffff', fontSize: 16, marginTop: 20, lineHeight: 24 }}>
        {issue.description}
      </Text>

      <View style={{ backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginTop: 20 }}>
        <Text style={{ color: '#a0a0a0', fontSize: 14, fontWeight: '600' }}>SUCCESS CRITERIA</Text>
        <Text style={{ color: '#ffffff', fontSize: 16, marginTop: 8 }}>
          {issue.successCriteria}
        </Text>
      </View>

      {issue.targetDate && (
        <Text style={{ color: '#eab308', fontSize: 14, marginTop: 12 }}>
          Target: {new Date(issue.targetDate).toLocaleDateString()}
        </Text>
      )}

      {/* Contributions Section */}
      {issue.contributions && issue.contributions.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>
            Contributions ({issue.contributions.length})
          </Text>
          {issue.contributions.map((c) => (
            <View key={c.id} style={{
              backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12, marginTop: 8,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#ffffff' }}>
                  {c.user?.displayName ?? 'Anonymous'}
                </Text>
                <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                  ${c.amountUsdc} USDC
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Deliverables Section */}
      {issue.deliverables && issue.deliverables.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>
            Deliverables ({issue.deliverables.length})
          </Text>
          {issue.deliverables.map((d) => (
            <View key={d.id} style={{
              backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12, marginTop: 8,
            }}>
              <Text style={{ color: '#ffffff' }}>{d.proofText}</Text>
              <Text style={{ color: '#666666', fontSize: 12, marginTop: 4 }}>
                {new Date(d.submittedAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {isWriteEnabled && issue.status === 'open' && (
        <Pressable
          onPress={() => {/* Navigate to contribute flow */}}
          style={{
            backgroundColor: '#3b82f6',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
            Contribute
          </Text>
        </Pressable>
      )}

      {!isWriteEnabled && (
        <Pressable
          onPress={() => router.push('/auth/link-x')}
          style={{
            backgroundColor: '#333333',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text style={{ color: '#a0a0a0', fontSize: 16 }}>
            Link X account for write access
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
