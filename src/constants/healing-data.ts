import i18n from '../i18n';

// Korean Localized Data
import healingColorsKo from '../locales/ko/colors.json';
import plantNamesKo from '../locales/ko/plant-names.json';
import messagesKo from '../locales/ko/messages.json';
import stepDetailsKo from '../locales/ko/step-details.json';
import stepDetailsSeason2Ko from '../locales/ko/step-details-season2.json';
import stepDetailsSeason3Ko from '../locales/ko/step-details-season3.json';
import mandalaNamesKo from '../locales/ko/mandala-templates-names.json';

// English Localized Data
import healingColorsEn from '../locales/en/colors.json';
import plantNamesEn from '../locales/en/plant-names.json';
import messagesEn from '../locales/en/messages.json';
import stepDetailsEn from '../locales/en/step-details.json';
import stepDetailsSeason2En from '../locales/en/step-details-season2.json';
import stepDetailsSeason3En from '../locales/en/step-details-season3.json';
import mandalaNamesEn from '../locales/en/mandala-templates-names.json';

import { ALL_MANDALA_20, ALL_BUTTERFLY_MANDALA_45, ALL_BEE_BIRD_MANDALA_45, getTemplateById } from './mandala-templates';

export interface HealingColor {
  hex: string;
  name: string;
  meaning: string;
  type: 'red' | 'green' | 'purple' | 'blue' | 'yellow';
}

export const isEn = () => i18n.language?.startsWith('en');

export const getHealingColors = (): HealingColor[] => (isEn() ? healingColorsEn : healingColorsKo) as HealingColor[];
export const HEALING_COLORS_24: HealingColor[] = healingColorsKo as HealingColor[];

export const getPlantNames = () => (isEn() ? plantNamesEn : plantNamesKo);
export const ADJECTIVES = plantNamesKo.adjectives;
export const NOUNS = plantNamesKo.nouns;

export const getTherapeuticMessages = () => (isEn() ? messagesEn : messagesKo);
export const THERAPEUTIC_MESSAGES = messagesKo;

export const getMandalaTemplateNames = () => (isEn() ? mandalaNamesEn : mandalaNamesKo);

export { ALL_MANDALA_20, ALL_BUTTERFLY_MANDALA_45, ALL_BEE_BIRD_MANDALA_45, getTemplateById };

export const STEP_DETAILS_JSON = stepDetailsKo;
export const STEP_DETAILS_SEASON2_JSON = stepDetailsSeason2Ko;
export const STEP_DETAILS_SEASON3_JSON = stepDetailsSeason3Ko;

export const getStepDetailsForSeason = (season: number): Record<number, any> => {
  const en = isEn();
  if (season >= 3) return (en ? stepDetailsSeason3En : stepDetailsSeason3Ko) as Record<number, any>;
  if (season === 2) return (en ? stepDetailsSeason2En : stepDetailsSeason2Ko) as Record<number, any>;
  return (en ? stepDetailsEn : stepDetailsKo) as Record<number, any>;
};
