import { Creature } from '@/domain/creature';
import { ICreatureRepository } from '../interfaces/ICreatureRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialCreaturesSeed } from '@/db/seed/flowerSeeds';

const CREATURES_KEY = '@greengrove_creatures_v1';

export class AsyncStorageCreatureRepository implements ICreatureRepository {
  async getCreatures(): Promise<Creature[]> {
    try {
      const data = await AsyncStorage.getItem(CREATURES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('AsyncStorageCreatureRepository error:', e);
    }
    const initial: Creature[] = initialCreaturesSeed.map(c => ({
      id: c.id,
      name: c.name,
      unlocked: c.unlocked === 1
    }));
    await AsyncStorage.setItem(CREATURES_KEY, JSON.stringify(initial));
    return initial;
  }

  async setCreatureUnlocked(id: string, unlocked: boolean): Promise<void> {
    const creatures = await this.getCreatures();
    const target = creatures.find(c => c.id === id);
    if (target) {
      target.unlocked = unlocked;
    } else {
      creatures.push({ id, name: id, unlocked });
    }
    await AsyncStorage.setItem(CREATURES_KEY, JSON.stringify(creatures));
  }

  async resetCreatures(): Promise<void> {
    await AsyncStorage.removeItem(CREATURES_KEY);
  }
}
