import { type AnyColumn, type SQL, sql } from 'drizzle-orm';

const filtered = (where?: SQL) => (where ? sql` filter (where ${where})` : sql``);

/** sum(column), optionally only over rows matching `where`; 0 when nothing matches. */
export const sumOf = (column: AnyColumn, where?: SQL) =>
  sql<number>`coalesce(sum(${column})${filtered(where)}, 0)`.mapWith(Number);

/** count(*), optionally only over rows matching `where`. */
export const countOf = (where?: SQL) => sql<number>`count(*)${filtered(where)}`.mapWith(Number);

/** min(column) / max(column), decoded like the column itself (e.g. timestamps become Dates). */
export const minOf = <T extends AnyColumn>(column: T, where?: SQL) =>
  sql`min(${column})${filtered(where)}`.mapWith(column);
export const maxOf = <T extends AnyColumn>(column: T, where?: SQL) =>
  sql`max(${column})${filtered(where)}`.mapWith(column);

/** Escapes % and _ so user input is matched literally by (i)like. */
export const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;
