import { DiaryEntry } from '@/domain/pot';

export interface IDiaryRepository {
  getDiariesByPotId(potId: number): Promise<{ [level: number]: DiaryEntry }>;
  saveDiary(potId: number, level: number, question: string, content: string, date: string): Promise<void>;
  clearAllDiaries(): Promise<void>;
}
