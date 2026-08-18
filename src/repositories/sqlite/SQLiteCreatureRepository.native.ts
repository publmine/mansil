import { Creature } from '@/domain/creature';
import { ICreatureRepository } from '../interfaces/ICreatureRepository';
import * as SQLite from 'expo-sqlite';

export class SQLiteCreatureRepository implements ICreatureRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getCreatures(): Promise<Creature[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM creatures');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      unlocked: r.unlocked === 1
    }));
  }

  async setCreatureUnlocked(id: string, unlocked: boolean): Promise<void> {
    await this.db.runAsync(
      `UPDATE creatures SET unlocked = ? WHERE id = ?`,
      [unlocked ? 1 : 0, id]
    );
  }

  async resetCreatures(): Promise<void> {
    await this.db.runAsync(`UPDATE creatures SET unlocked = 0`);
  }
}
