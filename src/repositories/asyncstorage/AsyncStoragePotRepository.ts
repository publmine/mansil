import { ArchivedPlant, Pot } from '@/domain/pot';
import { IPotRepository } from '../interfaces/IPotRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialPotsSeed } from '@/db/seed/flowerSeeds';

const POTS_KEY = '@greengrove_pots_v1';
const ARCHIVE_KEY = '@greengrove_archive_v1';

export class AsyncStoragePotRepository implements IPotRepository {
  async getAllPots(): Promise<Pot[]> {
    try {
      const data = await AsyncStorage.getItem(POTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('AsyncStoragePotRepository getAllPots error:', e);
    }
    const initial = initialPotsSeed();
    await this.saveAllPots(initial);
    return initial;
  }

  async getPotById(id: number): Promise<Pot | null> {
    const pots = await this.getAllPots();
    return pots.find(p => p.id === id) || null;
  }

  async savePot(pot: Pot): Promise<void> {
    const pots = await this.getAllPots();
    const index = pots.findIndex(p => p.id === pot.id);
    if (index !== -1) {
      pots[index] = pot;
    } else {
      pots.push(pot);
    }
    await this.saveAllPots(pots);
  }

  async saveAllPots(pots: Pot[]): Promise<void> {
    await AsyncStorage.setItem(POTS_KEY, JSON.stringify(pots));
  }

  async getArchive(): Promise<ArchivedPlant[]> {
    try {
      const data = await AsyncStorage.getItem(ARCHIVE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('AsyncStorageArchive error:', e);
    }
    return [];
  }

  async addArchive(plant: ArchivedPlant): Promise<void> {
    const archive = await this.getArchive();
    const updated = [plant, ...archive];
    await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
  }

  async clearAllPotsAndArchive(): Promise<void> {
    await AsyncStorage.removeItem(POTS_KEY);
    await AsyncStorage.removeItem(ARCHIVE_KEY);
  }
}
