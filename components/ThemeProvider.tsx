"use client";

import { useEffect } from "react";

// Default theme values from globals.css
const DEFAULT_THEME: Record<string, string> = {
  "--color-primary-purple": "#8b5cf6",
  "--color-primary-indigo": "#6366f1",
  "--color-primary-dark": "#4c1d95",
  "--color-primary-deep": "#5b21b6",
  "--color-accent-cyan": "#06b6d4",
  "--color-accent-teal": "#0ea5e9",
  "--color-star-gold": "#fbbf24",
  "--color-star-gold-dark": "#f59e0b",
  "--color-crystal-purple": "#a78bfa",
  "--color-crystal-bright": "#c084fc",
  "--color-bg-dark": "#0f172a",
  "--color-bg-dark-secondary": "#1e1b4b",
  "--color-text-primary": "#ffffff",
  "--color-text-secondary": "#cbd5e1",
  "--color-status-success": "#10b981",
  "--color-status-warning": "#f59e0b",
  "--color-status-error": "#ef4444",
};

// Map database field names to CSS variable names
const THEME_FIELD_MAP: Record<string, string> = {
  primaryPurple: "--color-primary-purple",
  primaryIndigo: "--color-primary-indigo",
  primaryDark: "--color-primary-dark",
  primaryDeep: "--color-primary-deep",
  accentCyan: "--color-accent-cyan",
  accentTeal: "--color-accent-teal",
  starGold: "--color-star-gold",
  starGoldDark: "--color-star-gold-dark",
  crystalPurple: "--color-crystal-purple",
  crystalBright: "--color-crystal-bright",
  bgDark: "--color-bg-dark",
  bgDarkSecondary: "--color-bg-dark-secondary",
  textPrimary: "--color-text-primary",
  textSecondary: "--color-text-secondary",
  statusSuccess: "--color-status-success",
  statusWarning: "--color-status-warning",
  statusError: "--color-status-error",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const response = await fetch("/api/theme");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const theme = data.data;
            const root = document.documentElement;

            // Apply custom theme values, fallback to defaults
            Object.keys(THEME_FIELD_MAP).forEach((field) => {
              const cssVar = THEME_FIELD_MAP[field];
              const value = theme[field];
              if (value) {
                root.style.setProperty(cssVar, value);
              } else {
                // Use default if not set
                root.style.setProperty(cssVar, DEFAULT_THEME[cssVar]);
              }
            });
            
            // Apply background settings
            const galaxyEnabled = theme.galaxyBackgroundEnabled !== false; // Default to true
            const plainBgColor = theme.plainBackgroundColor || "#000000";
            
            // Store in data attribute for conditional rendering
            root.setAttribute("data-galaxy-enabled", galaxyEnabled.toString());
            root.setAttribute("data-plain-bg-color", plainBgColor);
            
            // Apply plain background if galaxy is disabled
            if (!galaxyEnabled) {
              document.body.style.backgroundColor = plainBgColor;
              root.style.backgroundColor = plainBgColor;
            } else {
              document.body.style.backgroundColor = "";
              root.style.backgroundColor = "";
            }
          } else {
            // Apply defaults if no theme found
            applyDefaults();
          }
        } else {
          // Apply defaults if API fails
          applyDefaults();
        }
      } catch (error) {
        console.error("Error applying theme:", error);
        // Apply defaults on error
        applyDefaults();
      }
    };

    const applyDefaults = () => {
      const root = document.documentElement;
      Object.keys(DEFAULT_THEME).forEach((cssVar) => {
        root.style.setProperty(cssVar, DEFAULT_THEME[cssVar]);
      });
    };

    applyTheme();
  }, []);

  return <>{children}</>;
}

