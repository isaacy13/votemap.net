import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '../context/theme';
import { useAuthStore } from '../store/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function StackNavigation() {
  const { darkMode, bgColor, textColor } = useTheme();

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: bgColor },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="auth/verify" options={{ title: 'Verify identity' }} />
        <Stack.Screen name="outcomes/index" options={{ title: 'Outcomes' }} />
        <Stack.Screen name="outcomes/[id]" options={{ title: 'Outcome' }} />
        <Stack.Screen name="entities/index" options={{ title: 'Entities' }} />
        <Stack.Screen name="entities/[id]" options={{ title: 'Entity' }} />
        <Stack.Screen name="ledger/index" options={{ title: 'Ledger' }} />
        <Stack.Screen name="vote-confirm/[id]" options={{ title: 'Confirm vote' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}

function LayoutInner() {
  const { bgColor } = useTheme();
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <QueryClientProvider client={queryClient}>
        <StackNavigation />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
