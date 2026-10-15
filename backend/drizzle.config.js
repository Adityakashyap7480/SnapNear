import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ quiet: true });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.js',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/snapnear' },
});
