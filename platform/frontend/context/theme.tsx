import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  /** Computed colors based on current theme */
  bgColor: string;
  textColor: string;
  subtitleColor: string;
  surfaceBg: string;
  borderColor: string;
  footerGray: string;
  textMuted: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(() => {
    if (Platform.OS === 'web') {
      try {
        const stored = localStorage.getItem('votemap-theme');
        if (stored === 'light') return false;
        if (stored === 'dark') return true;
      } catch {}
    }
    return true; // default dark
  });

  /** Sync the document background with the theme */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const bg = darkMode ? '#0a0a0a' : '#ffffff';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    const rootViews = document.querySelectorAll('#root > div, #root > div > div');
    rootViews.forEach((el) => {
      if (el instanceof HTMLElement && el.style.backgroundColor) {
        el.style.backgroundColor = bg;
      }
    });
  }, [darkMode]);

  const setDarkMode = useCallback((v: boolean) => {
    setDarkModeState(v);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('votemap-theme', v ? 'dark' : 'light');
      } catch {}
    }
  }, []);

  const bgColor = darkMode ? '#0a0a0a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#1a202c';
  const subtitleColor = darkMode ? '#d1d5db' : '#718096';
  const surfaceBg = darkMode ? '#111118' : '#f7fafc';
  const borderColor = darkMode ? '#2a2a3e' : '#e2e8f0';
  const footerGray = darkMode ? '#a0aec0' : '#718096';
  const textMuted = darkMode ? '#666680' : '#a0aec0';

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        setDarkMode,
        bgColor,
        textColor,
        subtitleColor,
        surfaceBg,
        borderColor,
        footerGray,
        textMuted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
