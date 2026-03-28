import { create } from 'zustand';

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

  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  linkXAccount: () => Promise<void>;
  signOut: () => void;
  setAuth: (token: string, user: User, isWriteEnabled: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isWriteEnabled: false,
  isXLinked: false,
  user: null,
  accessToken: null,

  signInWithGoogle: async () => {
    // In production: Use expo-auth-session to get Google ID token,
    // then POST to /auth/google with the token.
    // For now, this is a placeholder that will be wired up with Expo Auth Session.
    console.log('Google sign-in initiated');
  },

  signInWithApple: async () => {
    // In production: Use expo-auth-session to get Apple ID token,
    // then POST to /auth/apple with the token.
    console.log('Apple sign-in initiated');
  },

  linkXAccount: async () => {
    // In production: Use expo-auth-session with X OAuth 2.0,
    // then POST callback to /auth/link-x
    console.log('X account linking initiated');
  },

  signOut: () => {
    set({
      isAuthenticated: false,
      isWriteEnabled: false,
      isXLinked: false,
      user: null,
      accessToken: null,
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
}));
