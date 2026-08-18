import { GardenState } from '@/domain/garden';
import { IGardenRepository } from '../interfaces/IGardenRepository';
import * as SQLite from 'expo-sqlite';

export class SQLiteGardenRepository implements IGardenRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getGardenState(): Promise<GardenState> {
    const row = await this.db.getFirstAsync<any>('SELECT * FROM game_state WHERE id = 1');
    if (!row) {
      return {
        score: 250,
        currentPotIndex: 0,
        shownMessages: [],
        usedTemplateIds: []
      };
    }
    return {
      score: row.score ?? 250,
      currentPotIndex: row.current_pot_index ?? 0,
      shownMessages: row.shown_messages ? JSON.parse(row.shown_messages) : [],
      usedTemplateIds: row.used_template_ids ? JSON.parse(row.used_template_ids) : []
    };
  }

  async saveGardenState(state: Partial<GardenState>): Promise<void> {
    const current = await this.getGardenState();
    const updated = { ...current, ...state };

    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids)
       VALUES (1, ?, ?, ?, ?)`,
      [
        updated.score,
        updated.currentPotIndex,
        JSON.stringify(updated.shownMessages || []),
        JSON.stringify(updated.usedTemplateIds || [])
      ]
    );
  }

  async resetGardenState(): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids)
       VALUES (1, 250, 0, '[]', '[]')`
    );
  }
}
