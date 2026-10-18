/**
 * Production public links for the Expo app.
 * Keep in sync with backend/src/constants/site.ts and app/eas.json.
 * Runtime prefers EXPO_PUBLIC_* env (EAS / Vercel); these are fallbacks.
 */
export const SITE = {
  webUrl: 'https://www.snapnear.in',
  webUrlApex: 'https://snapnear.in',
  apiUrl: 'https://snapnear-api.onrender.com',
  supportEmail: 'support@snapnear.in',
} as const;
