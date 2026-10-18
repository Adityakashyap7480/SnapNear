/**
 * Canonical public SnapNear links (production).
 * Edit here → env defaults + emails/catalog origins pick these up.
 * Also keep app/eas.json and app/src/config/site.ts in sync for mobile builds.
 *
 * Override on the host with env (Render / Vercel):
 *   APP_PUBLIC_URL, CLIENT_ORIGIN, SUPPORT_EMAIL, SMTP_FROM
 */
export const SITE = {
  /** Primary web app (www preferred). */
  webUrl: 'https://www.snapnear.in',
  /** Apex domain (CORS / redirects). */
  webUrlApex: 'https://snapnear.in',
  /** Nest API on Render. */
  apiUrl: 'https://snapnear-api.onrender.com',
  /** Public support inbox. */
  supportEmail: 'support@snapnear.in',
  /** Default transactional From (Brevo-verified domain). */
  mailFrom: 'SnapNear <noreply@snapnear.in>',
} as const;

/** Production browser origins allowed by CORS (comma-join for CLIENT_ORIGIN). */
export const PRODUCTION_CLIENT_ORIGINS = [SITE.webUrl, SITE.webUrlApex] as const;

/** Local dev origins for CLIENT_ORIGIN default. */
export const DEV_CLIENT_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:5175',
] as const;
