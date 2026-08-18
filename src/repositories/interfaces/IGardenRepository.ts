import { GardenState } from '@/domain/garden';

export interface IGardenRepository {
  getGardenState(): Promise<GardenState>;
  saveGardenState(state: Partial<GardenState>): Promise<void>;
  resetGardenState(): Promise<void>;
}
