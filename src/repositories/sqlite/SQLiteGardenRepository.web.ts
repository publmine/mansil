import { GardenState } from '@/domain/garden';
import { IGardenRepository } from '../interfaces/IGardenRepository';

export class SQLiteGardenRepository implements IGardenRepository {
  constructor(private db: any) {}

  async getGardenState(): Promise<GardenState> {
    return { score: 250, currentPotIndex: 0, shownMessages: [], usedTemplateIds: [] };
  }
  async saveGardenState(state: Partial<GardenState>): Promise<void> {}
  async resetGardenState(): Promise<void> {}
}
