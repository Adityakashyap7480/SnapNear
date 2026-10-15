import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import env from '../config/env.js';
import * as schema from './schema.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../drizzle', import.meta.url));

export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 10 });

// Hosted Postgres (Neon etc.) closes idle connections; the pool reconnects on the next query
pool.on('error', (err) => console.error('[db] Idle connection error:', err.message));

export const db = drizzle(pool, { schema });

/** Connects and applies any pending migrations from /drizzle. */
export async function connectDB() {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  const { rows } = await pool.query('select current_database() as name');
  const host = new URL(env.databaseUrl).hostname;
  console.log(`[db] PostgreSQL connected: ${host}/${rows[0].name}`);
}

export async function disconnectDB() {
  await pool.end();
}
