export interface Creature {
  id: string; // 'butterfly' | 'bee' | 'bird'
  name: string;
  unlocked: boolean;
  unlockedAtSeason?: number;
}
