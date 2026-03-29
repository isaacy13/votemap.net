import { create } from 'zustand';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../services/api';
import { authConfig } from '../config/auth';

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  displayName: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isWriteEnabled: boolean;
  isXLinked: boolean;
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (idToken: string) => Promise<void>;
  linkXAccount: (code: string, redirectUri: string) => Promise<void>;
  signOut: () => void;
  setAuth: (token: string, user: User, isWriteEnabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isWriteEnabled: false,
  isXLinked: false,
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,

  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.loginGoogle(idToken);
      set({
        isAuthenticated: true,
        accessToken: result.accessToken,
        user: result.user,
        isWriteEnabled: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  signInWithApple: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.loginApple(idToken);
      set({
        isAuthenticated: true,
        accessToken: result.accessToken,
        user: result.user,
        isWriteEnabled: false,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple sign-in failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  linkXAccount: async (code: string, redirectUri: string) => {
    const token = get().accessToken;
    if (!token) throw new Error('Must be authenticated first');

    set({ isLoading: true, error: null });
    try {
      const result = await api.linkX(code, redirectUri, token);
      set({
        accessToken: result.accessToken,
        isWriteEnabled: result.isIdentityVerified,
        isXLinked: true,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'X linking failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  signOut: () => {
    set({
      isAuthenticated: false,
      isWriteEnabled: false,
      isXLinked: false,
      user: null,
      accessToken: null,
      error: null,
    });
  },

  setAuth: (token, user, isWriteEnabled) => {
    set({
      isAuthenticated: true,
      accessToken: token,
      user,
      isWriteEnabled,
      isXLinked: isWriteEnabled,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

/**
 * Hook to get Google Auth request configuration.
 * Must be called at the component level (React hook rules).
 */
export function useGoogleAuth() {
  return Google.useAuthRequest({
    iosClientId: authConfig.google.iosClientId,
    androidClientId: authConfig.google.androidClientId,
    webClientId: authConfig.google.webClientId,
  });
}

