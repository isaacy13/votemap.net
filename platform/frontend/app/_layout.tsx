import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../context/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
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
        <Stack.Screen name="auth/login" options={{ title: 'Sign In', presentation: 'modal' }} />
        <Stack.Screen name="auth/link-x" options={{ title: 'Link X', presentation: 'modal' }} />
        <Stack.Screen name="issues/index" options={{ title: 'Issues' }} />
        <Stack.Screen name="issues/[id]" options={{ title: 'Issue Detail' }} />
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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <QueryClientProvider client={queryClient}>
        <StackNavigation />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
