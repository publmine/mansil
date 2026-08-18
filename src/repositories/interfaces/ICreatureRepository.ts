import { Creature } from '@/domain/creature';

export interface ICreatureRepository {
  getCreatures(): Promise<Creature[]>;
  setCreatureUnlocked(id: string, unlocked: boolean): Promise<void>;
  resetCreatures(): Promise<void>;
}
