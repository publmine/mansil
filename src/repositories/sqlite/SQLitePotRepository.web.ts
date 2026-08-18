import { ArchivedPlant, Pot } from '@/domain/pot';
import { IPotRepository } from '../interfaces/IPotRepository';

export class SQLitePotRepository implements IPotRepository {
  constructor(private db: any) {}

  async getAllPots(): Promise<Pot[]> { return []; }
  async getPotById(id: number): Promise<Pot | null> { return null; }
  async savePot(pot: Pot): Promise<void> {}
  async saveAllPots(pots: Pot[]): Promise<void> {}
  async getArchive(): Promise<ArchivedPlant[]> { return []; }
  async addArchive(plant: ArchivedPlant): Promise<void> {}
  async clearAllPotsAndArchive(): Promise<void> {}
}
