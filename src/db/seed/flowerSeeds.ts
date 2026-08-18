import { ALL_MANDALA_20, ALL_BUTTERFLY_MANDALA_45, ALL_BEE_BIRD_MANDALA_45, isEn } from '@/constants/healing-data';
import { Pot } from '@/domain/pot';

export const initialPotsSeed = (season = 1): Pot[] => {
  const templatePool = season >= 3 ? ALL_BEE_BIRD_MANDALA_45 : season === 2 ? ALL_BUTTERFLY_MANDALA_45 : ALL_MANDALA_20;
  const en = isEn();

  const pots: Pot[] = [
    {
      id: 1,
      name: en ? "First Empty Soil" : "첫 번째 빈 흙",
      adj: "",
      noun: "",
      level: 0,
      status: "unlocked",
      type: "neutral",
      desc: "",
      templateId: templatePool[0].id
    }
  ];

  for (let i = 2; i <= 9; i++) {
    const tempId = templatePool[((i - 1) * 5) % templatePool.length].id;
    pots.push({
      id: i,
      name: en ? "New Seed Empty Soil" : "새씨앗 비어있는 흙",
      adj: "",
      noun: "",
      level: 0,
      status: "locked",
      type: "neutral",
      desc: "",
      templateId: tempId
    });
  }

  return pots;
};

export const initialCreaturesSeed = [
  { id: 'butterfly', name: '나비', unlocked: 0 },
  { id: 'bee', name: '꿀벌', unlocked: 0 },
  { id: 'bird', name: '새', unlocked: 0 },
];
