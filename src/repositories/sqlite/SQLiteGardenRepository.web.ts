import { GardenState } from '@/domain/garden';
import { IGardenRepository } from '../interfaces/IGardenRepository';

const GARDEN_KEY = '@greengrove_garden_web_v1';

export class SQLiteGardenRepository implements IGardenRepository {
  constructor(private db: any) {}

  async getGardenState(): Promise<GardenState> {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(GARDEN_KEY);
        if (item) return JSON.parse(item);
      }
    } catch (e) {
      console.warn('getGardenState web error:', e);
    }
    return { score: 250, currentPotIndex: 0, shownMessages: [], usedTemplateIds: [], isPremiumUnlocked: false };
  }

  async saveGardenState(state: Partial<GardenState>): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const current = await this.getGardenState();
        const updated = { ...current, ...state };
        localStorage.setItem(GARDEN_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('saveGardenState web error:', e);
    }
  }

  async resetGardenState(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(GARDEN_KEY);
      }
    } catch (e) {
      console.warn('resetGardenState web error:', e);
    }
  }
}
