import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const sqlite = openDatabaseSync('pathway.db', { enableChangeListener: true });

/**
 * В SQLite внешние ключи выключены по умолчанию — в каждом соединении.
 * Без этой строки `ON DELETE CASCADE` в entries молча не работает:
 * удаляешь цель, а её записи остаются в базе сиротами.
 */
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export { default as migrations } from './migrations/migrations';
export { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
