import React from 'react';
import { View, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context/theme';

/** Compact dark/light mode toggle — placed in page footers for consistency */
export function ThemeToggle() {
  const { darkMode, setDarkMode, footerGray } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <Pressable
        onPress={() => setDarkMode(!darkMode)}
        style={({ pressed }) => ({
          padding: 10,
          borderRadius: 9999,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <FontAwesome
          name={darkMode ? 'sun-o' : 'moon-o'}
          size={18}
          color={footerGray}
        />
      </Pressable>
    </View>
  );
}
