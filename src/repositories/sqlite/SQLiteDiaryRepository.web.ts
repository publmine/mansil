import { DiaryEntry } from '@/domain/pot';
import { IDiaryRepository } from '../interfaces/IDiaryRepository';

export class SQLiteDiaryRepository implements IDiaryRepository {
  constructor(private db: any) {}

  async getDiariesByPotId(potId: number): Promise<{ [level: number]: DiaryEntry }> { return {}; }
  async saveDiary(potId: number, level: number, question: string, content: string, date: string): Promise<void> {}
  async clearAllDiaries(): Promise<void> {}
}
