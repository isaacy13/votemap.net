import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useTheme } from '../../context/theme';
import { colors, GlowCard, FadeInView } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function OutcomesListScreen() {
  const router = useRouter();
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['outcomes'],
    queryFn: () => api.getOutcomes(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, paddingTop: 20 }}>
      <View
        style={{
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: textColor, fontSize: 28, fontWeight: '800' }}>Outcomes</Text>
        <ThemeToggle />
      </View>
      <Text style={{ color: subtitleColor, paddingHorizontal: 20, marginTop: 6, marginBottom: 12 }}>
        Stake with personal deadlines. Money returns if delivery misses your clock.
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.outcomes ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <FadeInView>
              <Pressable onPress={() => router.push(`/outcomes/${item.id}`)}>
                <GlowCard surfaceColor={surfaceBg} borderColorOverride={borderColor}>
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 17 }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: colors.blue, marginTop: 8, fontWeight: '700' }}>
                    ${item.totalBountyUsdc} USDC · {item.status}
                  </Text>
                  {item.entity && (
                    <Text style={{ color: subtitleColor, marginTop: 4 }}>{item.entity.name}</Text>
                  )}
                </GlowCard>
              </Pressable>
            </FadeInView>
          )}
          ListEmptyComponent={
            <Text style={{ color: subtitleColor, textAlign: 'center', marginTop: 40 }}>
              No outcomes yet.
            </Text>
          }
        />
      )}
    </View>
  );
}
