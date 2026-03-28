import { View, Text, Pressable, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Issue } from '@votemap/shared';

export default function IssuesScreen() {
  const router = useRouter();
  const { data: issuesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssues(),
  });

  const renderIssue = ({ item }: { item: Issue }) => (
    <Pressable
      onPress={() => router.push(`/issues/${item.id}`)}
      style={{
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', flex: 1 }}>
          {item.title}
        </Text>
        <View style={{
          backgroundColor: item.status === 'open' ? '#22c55e' : '#eab308',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: '#000000', fontSize: 12, fontWeight: '600' }}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={{ color: '#a0a0a0', fontSize: 14, marginTop: 8 }} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '700' }}>
          ${item.totalBountyUsdc} USDC
        </Text>
        {item.entity && (
          <Text style={{ color: '#666666', fontSize: 14 }}>
            {item.entity.name}
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <FlatList
        data={issuesData?.issues ?? []}
        renderItem={renderIssue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ color: '#a0a0a0', fontSize: 16 }}>
              {isLoading ? 'Loading issues...' : 'No issues yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
