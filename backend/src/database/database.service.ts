import { fileURLToPath } from 'node:url';
import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** The shared connection or an open transaction. */
export type Executor = Database | Transaction;

const MIGRATIONS_DIR = fileURLToPath(new URL('../../drizzle', import.meta.url));

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  readonly pool = new pg.Pool({ connectionString: env.databaseUrl, max: env.dbPoolMax });
  readonly db: Database = drizzle(this.pool, { schema });

  constructor() {
    // Hosted Postgres (Neon etc.) closes idle connections; the pool reconnects on the next query
    this.pool.on('error', (err) => console.error('[db] Idle connection error:', err.message));
  }

  /** Connects and applies any pending migrations from /drizzle. */
  async onModuleInit() {
    await migrate(this.db, { migrationsFolder: MIGRATIONS_DIR });
    await this.pool.query('select 1');
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
