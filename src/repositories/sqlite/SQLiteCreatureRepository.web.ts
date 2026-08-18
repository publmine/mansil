import { Creature } from '@/domain/creature';
import { ICreatureRepository } from '../interfaces/ICreatureRepository';

export class SQLiteCreatureRepository implements ICreatureRepository {
  constructor(private db: any) {}

  async getCreatures(): Promise<Creature[]> { return []; }
  async setCreatureUnlocked(id: string, unlocked: boolean): Promise<void> {}
  async resetCreatures(): Promise<void> {}
}
