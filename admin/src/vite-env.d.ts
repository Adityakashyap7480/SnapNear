/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin, e.g. https://api.snapnear.in. Empty = same origin (dev proxy / Vercel rewrite). */
  readonly VITE_API_URL?: string;
  /** Where the customer & partner app lives. Empty = same domain as this admin. */
  readonly VITE_APP_URL?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
