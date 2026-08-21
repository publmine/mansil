import { GardenState } from '@/domain/garden';
import { IGardenRepository } from '../interfaces/IGardenRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GARDEN_KEY = '@greengrove_garden_v1';

export class AsyncStorageGardenRepository implements IGardenRepository {
  async getGardenState(): Promise<GardenState> {
    try {
      const data = await AsyncStorage.getItem(GARDEN_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('AsyncStorageGardenRepository getGardenState error:', e);
    }
    return {
      score: 250,
      currentPotIndex: 0,
      shownMessages: [],
      usedTemplateIds: []
    };
  }

  async saveGardenState(state: Partial<GardenState>): Promise<void> {
    const current = await this.getGardenState();
    const updated = { ...current, ...state };
    await AsyncStorage.setItem(GARDEN_KEY, JSON.stringify(updated));
  }

  async resetGardenState(preservePremium: boolean = false): Promise<void> {
    const current = await this.getGardenState();
    const isPremium = preservePremium && current.isPremiumUnlocked;
    if (isPremium) {
      await AsyncStorage.setItem(GARDEN_KEY, JSON.stringify({ score: 250, currentPotIndex: 0, shownMessages: [], usedTemplateIds: [], isPremiumUnlocked: true }));
    } else {
      await AsyncStorage.removeItem(GARDEN_KEY);
    }
  }
}
