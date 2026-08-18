import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('greengrove.db');
    await migrateDatabase(dbInstance);
  }
  return dbInstance;
}
