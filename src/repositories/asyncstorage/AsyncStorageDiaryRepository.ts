import { DiaryEntry } from '@/domain/pot';
import { IDiaryRepository } from '../interfaces/IDiaryRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DIARIES_KEY = '@greengrove_diaries_v1';

export class AsyncStorageDiaryRepository implements IDiaryRepository {
  private async getAllDiaries(): Promise<{ [potId: number]: { [level: number]: DiaryEntry } }> {
    try {
      const data = await AsyncStorage.getItem(DIARIES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('AsyncStorageDiaryRepository getAllDiaries error:', e);
    }
    return {};
  }

  async getDiariesByPotId(potId: number): Promise<{ [level: number]: DiaryEntry }> {
    const all = await this.getAllDiaries();
    return all[potId] || {};
  }

  async saveDiary(potId: number, level: number, question: string, content: string, date: string): Promise<void> {
    const all = await this.getAllDiaries();
    const potDiaries = all[potId] || {};
    potDiaries[level] = { potId, level, question, content, date };
    all[potId] = potDiaries;
    await AsyncStorage.setItem(DIARIES_KEY, JSON.stringify(all));
  }

  async clearAllDiaries(): Promise<void> {
    await AsyncStorage.removeItem(DIARIES_KEY);
  }
}
