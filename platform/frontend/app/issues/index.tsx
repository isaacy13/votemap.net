import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated from 'react-native-reanimated';
import { api } from '../../services/api';
import { colors, FadeInView, FadeInDown, PulsingDot } from '../../components/ui';
import type { Issue } from '@votemap/shared';

export default function IssuesScreen() {
  const router = useRouter();
  const { data: issuesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.getIssues(),
  });

  const renderIssue = ({ item, index }: { item: Issue; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      <Pressable
        onPress={() => router.push(`/issues/${item.id}`)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.surfaceHover : colors.surface,
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.purple,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: '700',
            flex: 1,
            marginRight: 12,
            letterSpacing: -0.3,
          }}>
            {item.title}
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: item.status === 'open' ? colors.green + '18' : colors.yellow + '18',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: item.status === 'open' ? colors.green + '30' : colors.yellow + '30',
          }}>
            <PulsingDot color={item.status === 'open' ? colors.green : colors.yellow} size={6} />
            <Text style={{
              color: item.status === 'open' ? colors.green : colors.yellow,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.5,
            }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={{
          color: colors.textSecondary,
          fontSize: 14,
          marginTop: 10,
          lineHeight: 20,
        }} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Footer Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <Text style={{
            color: colors.blue,
            fontSize: 17,
            fontWeight: '800',
            letterSpacing: -0.3,
          }}>
            ${item.totalBountyUsdc} USDC
          </Text>
          {item.entity && (
            <View style={{
              backgroundColor: colors.surfaceLight,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                {item.entity.name}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={issuesData?.issues ?? []}
        renderItem={renderIssue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.purple}
            colors={[colors.purple]}
          />
        }
        ListHeaderComponent={
          <FadeInView delay={0} style={{ marginBottom: 16 }}>
            <Text style={{
              color: colors.text,
              fontSize: 13,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginLeft: 4,
            }}>
              {issuesData?.issues?.length ?? 0} Active Issues
            </Text>
          </FadeInView>
        }
        ListEmptyComponent={
          <FadeInView delay={200}>
            <View style={{ alignItems: 'center', marginTop: 80, gap: 12 }}>
              {isLoading ? (
                <>
                  <ActivityIndicator size="large" color={colors.purple} />
                  <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 8 }}>
                    Loading issues...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 48 }}>🗳️</Text>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>
                    No issues yet
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 260 }}>
                    Issues will appear here once they are created. Sign in and link your X account to create one.
                  </Text>
                </>
              )}
            </View>
          </FadeInView>
        }
      />
    </View>
  );
}
