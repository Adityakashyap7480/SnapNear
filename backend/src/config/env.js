import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/snapnear',
  jwtSecret: process.env.JWT_SECRET || 'snapnear-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  supportEmail: process.env.SUPPORT_EMAIL || 'support@snapnear.in',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '',
  },
  payoutHoldDays: Number(process.env.PAYOUT_HOLD_DAYS) || 7,
  // Testing only: turns the 1 Hour package into an N-minute shoot. Leave unset in real use.
  shootTestMinutes: Math.max(0, Number(process.env.SHOOT_TEST_MINUTES) || 0),
};

env.isProduction = env.nodeEnv === 'production';

if (env.isProduction && env.jwtSecret === 'snapnear-dev-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

export default env;
