import { HealingColor } from '@/constants/healing-data';
import { ArchivedPlant, Pot } from './pot';

export interface GameState {
  score: number;
  currentPotIndex: number;
  selectedColors: HealingColor[];
  currentColor: string;
  mandalaColors: { [segmentId: string]: string };
  bottleRatios: number[]; // [redRatio, greenRatio, purpleRatio]
  pots: Pot[];
  archive: ArchivedPlant[];
  shownMessages: string[];
  usedTemplateIds: string[];
  hasButterfly?: boolean;
  hasBee?: boolean;
  hasBird?: boolean;
  isPremiumUnlocked?: boolean;
  paperTexture?: string;
  cottonColor?: string;
}
