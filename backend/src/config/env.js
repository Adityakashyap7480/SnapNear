import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snapnear',
  jwtSecret: process.env.JWT_SECRET || 'snapnear-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  supportEmail: process.env.SUPPORT_EMAIL || 'support@snapnear.in',
};

env.isProduction = env.nodeEnv === 'production';

if (env.isProduction && env.jwtSecret === 'snapnear-dev-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

export default env;
