import * as SQLite from 'expo-sqlite';
import { runV1Migration } from './v1_initial.native';

export async function migrateDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await runV1Migration(db);
    await db.execAsync('PRAGMA user_version = 1');
  }

  if (currentVersion < 2) {
    try {
      await db.execAsync(`ALTER TABLE pots ADD COLUMN step_mandalas TEXT DEFAULT '{}';`);
    } catch {
      // Column may already exist
    }
    try {
      await db.execAsync(`ALTER TABLE archived_plants ADD COLUMN step_mandalas TEXT DEFAULT '{}';`);
    } catch {
      // Column may already exist
    }
    await db.execAsync('PRAGMA user_version = 2');
  }
}
