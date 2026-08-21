import { GardenState } from '@/domain/garden';
import { IGardenRepository } from '../interfaces/IGardenRepository';
import * as SQLite from 'expo-sqlite';

export class SQLiteGardenRepository implements IGardenRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  private async ensureColumn(): Promise<void> {
    try {
      await this.db.execAsync('ALTER TABLE game_state ADD COLUMN is_premium_unlocked INTEGER DEFAULT 0;');
    } catch {
      // Column might already exist
    }
  }

  async getGardenState(): Promise<GardenState> {
    await this.ensureColumn();
    const row = await this.db.getFirstAsync<any>('SELECT * FROM game_state WHERE id = 1');
    if (!row) {
      return {
        score: 250,
        currentPotIndex: 0,
        shownMessages: [],
        usedTemplateIds: [],
        isPremiumUnlocked: false,
      };
    }
    return {
      score: row.score ?? 250,
      currentPotIndex: row.current_pot_index ?? 0,
      shownMessages: row.shown_messages ? JSON.parse(row.shown_messages) : [],
      usedTemplateIds: row.used_template_ids ? JSON.parse(row.used_template_ids) : [],
      isPremiumUnlocked: row.is_premium_unlocked === 1 || row.is_premium_unlocked === true,
    };
  }

  async saveGardenState(state: Partial<GardenState>): Promise<void> {
    await this.ensureColumn();
    const current = await this.getGardenState();
    const updated = { ...current, ...state };

    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids, is_premium_unlocked)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [
        updated.score,
        updated.currentPotIndex,
        JSON.stringify(updated.shownMessages || []),
        JSON.stringify(updated.usedTemplateIds || []),
        updated.isPremiumUnlocked ? 1 : 0,
      ]
    );
  }

  async resetGardenState(preservePremium: boolean = false): Promise<void> {
    await this.ensureColumn();
    let isPremium = 0;
    if (preservePremium) {
      const current = await this.getGardenState();
      if (current.isPremiumUnlocked) isPremium = 1;
    }
    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, score, current_pot_index, shown_messages, used_template_ids, is_premium_unlocked)
       VALUES (1, 250, 0, '[]', '[]', ?)`,
      [isPremium]
    );
  }
}
