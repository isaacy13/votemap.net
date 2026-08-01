import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useTheme } from '../../context/theme';
import { colors, GlowCard, FadeInView } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function EntitiesListScreen() {
  const router = useRouter();
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['entities'],
    queryFn: () => api.getEntities(),
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
        <Text style={{ color: textColor, fontSize: 28, fontWeight: '800' }}>Entities</Text>
        <ThemeToggle />
      </View>
      <Text style={{ color: subtitleColor, paddingHorizontal: 20, marginTop: 6, marginBottom: 12 }}>
        Profiles with links, bounties, and transparent donations.
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.entities ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          renderItem={({ item }) => (
            <FadeInView>
              <Pressable onPress={() => router.push(`/entities/${item.slug ?? item.id}`)}>
                <GlowCard surfaceColor={surfaceBg} borderColorOverride={borderColor}>
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 17 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: subtitleColor, marginTop: 4 }}>{item.type}</Text>
                </GlowCard>
              </Pressable>
            </FadeInView>
          )}
        />
      )}
    </View>
  );
}
