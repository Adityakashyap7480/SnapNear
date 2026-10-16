import type { ViewStyle } from 'react-native';

/** The web app's custom shadows (shadow-glow, shadow-card, ...) as RN boxShadow styles. */
export const shadows = {
  glow: { boxShadow: '0px 0px 25px -5px rgba(255, 128, 8, 0.45)' },
  glowViolet: { boxShadow: '0px 0px 25px -5px rgba(99, 102, 241, 0.45)' },
  card: { boxShadow: '0px 8px 30px rgba(15, 23, 42, 0.06)' },
  sm: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' },
  md: { boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)' },
  lg: { boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)' },
  xl: { boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  '2xl': { boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  emerald: { boxShadow: '0px 4px 6px -1px rgba(5, 150, 105, 0.25), 0px 2px 4px -2px rgba(5, 150, 105, 0.25)' },
} satisfies Record<string, ViewStyle>;
