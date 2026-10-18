import dotenv from 'dotenv';
import { DEFAULT_SESSION_PRICES } from '../constants/session-packages.js';

dotenv.config({ quiet: true });

const missing: string[] = [];
const invalid: string[] = [];

const read = (name: string) => process.env[name]?.trim() ?? '';

/** Must be set. Secrets keep their exact value (no trimming), like before. */
function required(name: string, { trim = true } = {}): string {
  const value = trim ? read(name) : (process.env[name] ?? '');
  if (!value.trim()) missing.push(name);
  return value;
}

const text = (name: string, fallback: string) => read(name) || fallback;

const flag = (name: string, fallback: boolean) => (read(name) ? read(name) === 'true' : fallback);

function number(name: string, fallback: number, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = true } = {}): number {
  const value = read(name);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    invalid.push(`${name} must be a ${integer ? 'whole number' : 'number'} from ${min} to ${max}`);
    return fallback;
  }
  return parsed;
}

// DATABASE_URL wins; otherwise the URL is built from the separate DB_* values
function databaseUrl(): string {
  const url = read('DATABASE_URL');
  if (url) return url;
  const user = encodeURIComponent(required('DB_USER'));
  const password = encodeURIComponent(required('DB_PASSWORD'));
  const host = required('DB_HOST');
  const port = number('DB_PORT', 5432, { min: 1, max: 65535 });
  const name = encodeURIComponent(required('DB_NAME'));
  const ssl = flag('DB_SSL', false) ? '?sslmode=verify-full' : '';
  return `postgres://${user}:${password}@${host}:${port}/${name}${ssl}`;
}

const price = (name: string, fallback: number) => number(name, fallback, { min: 1 });

const nodeEnv = text('NODE_ENV', 'development');

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: number('PORT', 5000, { min: 1, max: 65535 }),

  databaseUrl: databaseUrl(),
  dbPoolMax: number('DB_POOL_MAX', 10, { min: 1, max: 100 }),

  jwtSecret: required('JWT_SECRET', { trim: false }),
  jwtExpiresIn: text('JWT_EXPIRES_IN', '7d'),
  bcryptRounds: number('BCRYPT_ROUNDS', 10, { min: 4, max: 15 }),
  authRateLimit: {
    windowMinutes: number('AUTH_RATE_LIMIT_WINDOW_MINUTES', 15, { min: 1 }),
    max: number('AUTH_RATE_LIMIT_MAX', 50, { min: 1 }),
  },

  // Super Admin is not stored in the database
  superAdmin: {
    email: required('SUPER_ADMIN_EMAIL').toLowerCase(),
    password: required('SUPER_ADMIN_PASSWORD', { trim: false }),
  },

  clientOrigins: text('CLIENT_ORIGIN', 'http://localhost:8081,http://localhost:5173,http://localhost:5175')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  supportEmail: text('SUPPORT_EMAIL', 'supportsnear@gmail.com'),

  /** Public web app URL used in password-reset emails (Vercel). */
  appPublicUrl: text('APP_PUBLIC_URL', 'https://snap-near.vercel.app').replace(/\/$/, ''),

  /**
   * Brevo (HTTPS) on Render — verify your Gmail as sender so From stays your address.
   * Free hosts often block outbound SMTP (587/465); local can keep using SMTP_*.
   */
  brevo: {
    apiKey: read('BREVO_API_KEY'),
  },

  /** Optional Resend fallback (needs a verified domain for custom From). */
  resend: {
    apiKey: read('RESEND_API_KEY'),
    from: text('RESEND_FROM', ''),
  },

  /** Optional SMTP for local/dev. Without any provider, OTPs are logged in development only. */
  smtp: {
    host: read('SMTP_HOST'),
    port: number('SMTP_PORT', 587, { min: 1, max: 65535 }),
    user: read('SMTP_USER'),
    pass: process.env.SMTP_PASS ?? '',
    from: text('SMTP_FROM', ''),
  },

  /** Google OAuth client IDs allowed to mint ID tokens (web / Android / iOS). Comma-separated. */
  googleClientIds: text('GOOGLE_CLIENT_IDS', '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),

  /** Optional Expo push access token (https://expo.dev/accounts/_/settings/access-tokens). */
  expoAccessToken: read('EXPO_ACCESS_TOKEN'),

  razorpay: {
    keyId: read('RAZORPAY_KEY_ID'),
    keySecret: read('RAZORPAY_KEY_SECRET'),
    webhookSecret: read('RAZORPAY_WEBHOOK_SECRET'),
    timeoutMs: number('RAZORPAY_TIMEOUT_MS', 15000, { min: 1000 }),
  },

  platformFeePercent: number('PLATFORM_FEE_PERCENT', 20, { max: 100, integer: false }),
  /** Defaults from constants/session-packages.ts; optional PRICE_* env overrides. */
  prices: {
    photo: {
      '1hr': price('PRICE_PHOTO_1HR', DEFAULT_SESSION_PRICES.photo['1hr']),
      '2hr': price('PRICE_PHOTO_2HR', DEFAULT_SESSION_PRICES.photo['2hr']),
      '4hr': price('PRICE_PHOTO_4HR', DEFAULT_SESSION_PRICES.photo['4hr']),
      '1day': price('PRICE_PHOTO_1DAY', DEFAULT_SESSION_PRICES.photo['1day']),
    },
    video: {
      '1hr': price('PRICE_VIDEO_1HR', DEFAULT_SESSION_PRICES.video['1hr']),
      '2hr': price('PRICE_VIDEO_2HR', DEFAULT_SESSION_PRICES.video['2hr']),
      '4hr': price('PRICE_VIDEO_4HR', DEFAULT_SESSION_PRICES.video['4hr']),
      '1day': price('PRICE_VIDEO_1DAY', DEFAULT_SESSION_PRICES.video['1day']),
    },
  },
  payoutHoldDays: number('PAYOUT_HOLD_DAYS', 7),
  maxActiveBookings: number('MAX_ACTIVE_BOOKINGS', 3, { min: 1 }),
  /** Max distance (km) between customer shoot coords and partner current location. */
  matchRadiusKm: number('MATCH_RADIUS_KM', 10, { min: 1, max: 50, integer: false }),
  startOtp: {
    length: number('START_OTP_LENGTH', 4, { min: 4, max: 8 }),
    maxAttempts: number('START_OTP_MAX_ATTEMPTS', 5, { min: 1 }),
  },
  // Bump when the partner terms text changes: every partner must accept the new version again
  partnerTermsVersion: text('PARTNER_TERMS_VERSION', '2026-10-15'),
  // Testing only: turns the 1 Hour package into an N-minute shoot. Leave unset in real use.
  shootTestMinutes: number('SHOOT_TEST_MINUTES', 0),
};

if (missing.length || invalid.length) {
  const lines = [
    ...missing.map((name) => `${name} is missing`),
    ...invalid,
  ];
  throw new Error(`Fix these environment variables in backend/.env (or on the host):\n  - ${lines.join('\n  - ')}`);
}

export type Env = typeof env;
