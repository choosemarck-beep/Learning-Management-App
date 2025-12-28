/**
 * Design System - Color Palette
 * Pixel Galaxy Theme Colors
 */

export const colors = {
  primary: {
    purple: "#8B5CF6",
    indigo: "#6366F1",
    dark: "#4C1D95",
    deep: "#5B21B6",
  },
  accent: {
    cyan: "#06B6D4",
    teal: "#0EA5E9",
  },
  star: {
    gold: "#FBBF24",
    goldDark: "#F59E0B",
  },
  crystal: {
    purple: "#A78BFA",
    bright: "#C084FC",
  },
  background: {
    dark: "#0F172A",
    darkSecondary: "#1E1B4B",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#CBD5E1",
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },
} as const;

export type ColorKey = keyof typeof colors;

