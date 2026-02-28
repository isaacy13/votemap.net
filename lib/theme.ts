import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          blue:   { value: "#3b82f6" },
          purple: { value: "#8b5cf6" },
          red:    { value: "#ef4444" },
        },
      },
    },
    semanticTokens: {
      colors: {
        "bounty.open":      { value: { base: "#3b82f6", _dark: "#60a5fa" } },
        "bounty.in_review": { value: { base: "#f59e0b", _dark: "#fbbf24" } },
        "bounty.resolved":  { value: { base: "#8b5cf6", _dark: "#a78bfa" } },
        "bounty.cancelled": { value: { base: "#ef4444", _dark: "#f87171" } },
        "card.bg":          { value: { base: "white",   _dark: "gray.900" } },
        "card.border":      { value: { base: "gray.100", _dark: "gray.800" } },
        "nav.bg":           { value: { base: "rgba(255,255,255,0.85)", _dark: "rgba(10,10,10,0.85)" } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
