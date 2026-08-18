import { ArchivedPlant, Pot } from '@/domain/pot';

export interface IPotRepository {
  getAllPots(): Promise<Pot[]>;
  getPotById(id: number): Promise<Pot | null>;
  savePot(pot: Pot): Promise<void>;
  saveAllPots(pots: Pot[]): Promise<void>;
  getArchive(): Promise<ArchivedPlant[]>;
  addArchive(plant: ArchivedPlant): Promise<void>;
  clearAllPotsAndArchive(): Promise<void>;
}
