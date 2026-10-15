import { sql } from 'drizzle-orm';

const filtered = (where) => (where ? sql` filter (where ${where})` : sql``);

/** sum(column), optionally only over rows matching `where`; 0 when nothing matches. */
export const sumOf = (column, where) => sql`coalesce(sum(${column})${filtered(where)}, 0)`.mapWith(Number);

/** count(*), optionally only over rows matching `where`. */
export const countOf = (where) => sql`count(*)${filtered(where)}`.mapWith(Number);

/** min(column) / max(column), decoded like the column itself (e.g. timestamps become Dates). */
export const minOf = (column, where) => sql`min(${column})${filtered(where)}`.mapWith(column);
export const maxOf = (column, where) => sql`max(${column})${filtered(where)}`.mapWith(column);

/** Escapes % and _ so user input is matched literally by (i)like. */
export const likePattern = (text) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;
