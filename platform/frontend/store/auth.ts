import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from '../services/api';

const TOKEN_KEY = 'votemap_access_token';

async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  displayName: string | null;
  isIdentityVerified: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (opts: {
    accessToken: string;
    userId: string;
    displayName: string | null;
    isIdentityVerified: boolean;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userId: null,
  displayName: null,
  isIdentityVerified: false,
  hydrated: false,
  hydrate: async () => {
    const token = await loadToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    try {
      const me = await api.me(token);
      set({
        accessToken: token,
        userId: me.id,
        displayName: me.displayName,
        isIdentityVerified: me.isIdentityVerified,
        hydrated: true,
      });
    } catch {
      await saveToken(null);
      set({ accessToken: null, hydrated: true });
    }
  },
  setSession: async ({ accessToken, userId, displayName, isIdentityVerified }) => {
    await saveToken(accessToken);
    set({ accessToken, userId, displayName, isIdentityVerified });
  },
  refreshMe: async () => {
    const token = get().accessToken;
    if (!token) return;
    const me = await api.me(token);
    set({
      userId: me.id,
      displayName: me.displayName,
      isIdentityVerified: me.isIdentityVerified,
    });
  },
  logout: async () => {
    await saveToken(null);
    set({
      accessToken: null,
      userId: null,
      displayName: null,
      isIdentityVerified: false,
    });
  },
}));
