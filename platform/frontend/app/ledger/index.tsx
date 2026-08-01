import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useTheme } from '../../context/theme';
import { colors, GlowCard } from '../../components/ui';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function LedgerScreen() {
  const { bgColor, textColor, subtitleColor, surfaceBg, borderColor, textMuted } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['ledger'],
    queryFn: () => api.getLedger(50),
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
        <Text style={{ color: textColor, fontSize: 28, fontWeight: '800' }}>Public ledger</Text>
        <ThemeToggle />
      </View>
      <Text style={{ color: subtitleColor, paddingHorizontal: 20, marginTop: 6, marginBottom: 12 }}>
        Every stake, release, refund, and donation — radical transparency.
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.entries ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          renderItem={({ item }) => (
            <GlowCard surfaceColor={surfaceBg} borderColorOverride={borderColor} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.purple, fontWeight: '700' }}>{item.type}</Text>
                <Text style={{ color: colors.blue, fontWeight: '700' }}>${item.amountUsdc}</Text>
              </View>
              <Text style={{ color: textMuted, marginTop: 6, fontSize: 12 }}>
                {new Date(item.createdAt).toLocaleString()}
                {item.memo ? ` · ${item.memo}` : ''}
              </Text>
            </GlowCard>
          )}
          ListEmptyComponent={
            <Text style={{ color: subtitleColor, textAlign: 'center', marginTop: 40 }}>
              No ledger entries yet.
            </Text>
          }
        />
      )}
    </View>
  );
}
