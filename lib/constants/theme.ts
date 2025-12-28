/**
 * Design System - Theme Constants
 * Duolingo-inspired playful interactions
 */

export const theme = {
  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    full: "9999px",
  },
  transitions: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
  },
  touchTarget: {
    min: "44px",
  },
  breakpoints: {
    mobile: "375px",
    tablet: "768px",
    desktop: "1024px",
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

