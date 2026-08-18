import { DiaryEntry } from '@/domain/pot';
import { IDiaryRepository } from '../interfaces/IDiaryRepository';
import * as SQLite from 'expo-sqlite';

export class SQLiteDiaryRepository implements IDiaryRepository {
  constructor(private db: SQLite.SQLiteDatabase) {}

  async getDiariesByPotId(potId: number): Promise<{ [level: number]: DiaryEntry }> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM diaries WHERE pot_id = ? ORDER BY level ASC', [potId]);
    const diaries: { [level: number]: DiaryEntry } = {};
    for (const r of rows) {
      diaries[r.level] = {
        id: r.id,
        potId: r.pot_id,
        level: r.level,
        question: r.question,
        content: r.content,
        date: r.date
      };
    }
    return diaries;
  }

  async saveDiary(potId: number, level: number, question: string, content: string, date: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO diaries (pot_id, level, question, content, date) VALUES (?, ?, ?, ?, ?)`,
      [potId, level, question, content, date]
    );
  }

  async clearAllDiaries(): Promise<void> {
    await this.db.runAsync('DELETE FROM diaries');
  }
}
