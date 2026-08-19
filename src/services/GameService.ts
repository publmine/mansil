import {
  ALL_BEE_BIRD_MANDALA_45,
  ALL_BUTTERFLY_MANDALA_45,
  ALL_MANDALA_20,
  getHealingColors,
  getPlantNames,
  getStepDetailsForSeason,
  getTherapeuticMessages,
  isEn
} from '@/constants/healing-data';
import { initialCreaturesSeed, initialPotsSeed } from '@/db/seed/flowerSeeds';
import { GameState } from '@/domain/game';
import { ArchivedPlant } from '@/domain/pot';
import { ICreatureRepository } from '@/repositories/interfaces/ICreatureRepository';
import { IDiaryRepository } from '@/repositories/interfaces/IDiaryRepository';
import { IGardenRepository } from '@/repositories/interfaces/IGardenRepository';
import { IPotRepository } from '@/repositories/interfaces/IPotRepository';

const getRandomFlowerMessage = (color: string, shownMessages: string[] = []): string => {
  const messages = getTherapeuticMessages();
  const pool = (messages as any)[color] || (messages as any)['green'] || [];
  if (Array.isArray(pool) && pool.length > 0) {
    const unshown = pool.filter((msg: string) => !shownMessages.includes(msg));
    const availablePool = unshown.length > 0 ? unshown : pool;
    return availablePool[Math.floor(Math.random() * availablePool.length)];
  }
  if (pool && pool.openers && pool.middles) {
    const opener = pool.openers[Math.floor(Math.random() * pool.openers.length)];
    const middle = pool.middles[Math.floor(Math.random() * pool.middles.length)];
    const ending = pool.endings && pool.endings.length > 0
      ? pool.endings[Math.floor(Math.random() * pool.endings.length)]
      : '';
    return ending ? `${opener} ${middle} ${ending}` : `${opener} ${middle}`;
  }
  return isEn()
    ? 'The flower in bloom today holds your own unique beauty.'
    : '오늘 피어난 꽃은 당신만의 아름다움을 품고 있습니다.';
};

export class GameService {
  constructor(
    private potRepo: IPotRepository,
    private diaryRepo: IDiaryRepository,
    private gardenRepo: IGardenRepository,
    private creatureRepo: ICreatureRepository
  ) { }

  async loadFullState(): Promise<GameState> {
    const gardenState = await this.gardenRepo.getGardenState();
    let pots = await this.potRepo.getAllPots();
    const archive = await this.potRepo.getArchive();
    const creatures = await this.creatureRepo.getCreatures();

    const butterfly = !!creatures.find(c => c.id === 'butterfly')?.unlocked || archive.length >= 9;
    const bee = !!creatures.find(c => c.id === 'bee')?.unlocked || archive.length >= 18;
    const bird = !!creatures.find(c => c.id === 'bird')?.unlocked || archive.length >= 27;

    const season = (bee || bird) ? 3 : butterfly ? 2 : 1;

    if (pots.length === 0) {
      pots = initialPotsSeed(season);
      await this.potRepo.saveAllPots(pots);
    } else if (pots.length < 9) {
      const templatePool = season >= 3 ? ALL_BEE_BIRD_MANDALA_45 : season === 2 ? ALL_BUTTERFLY_MANDALA_45 : ALL_MANDALA_20;
      for (let i = pots.length + 1; i <= 9; i++) {
        const tempId = templatePool[((i - 1) * 5) % templatePool.length].id;
        pots.push({
          id: i,
          name: isEn() ? "New Seed Empty Soil" : "새씨앗 비어있는 흙",
          adj: "",
          noun: "",
          level: 0,
          status: "locked",
          type: "neutral",
          desc: "",
          templateId: tempId
        });
      }
      await this.potRepo.saveAllPots(pots);
    }

    if (season >= 3) {
      let potsChanged = false;
      pots = pots.map(p => {
        const expectedTempId = ALL_BEE_BIRD_MANDALA_45[((p.id - 1) * 5 + p.level) % ALL_BEE_BIRD_MANDALA_45.length].id;
        if (p.templateId !== expectedTempId) {
          potsChanged = true;
          return { ...p, templateId: expectedTempId };
        }
        return p;
      });
      if (potsChanged) {
        await this.potRepo.saveAllPots(pots);
      }
    } else if (season === 2) {
      let potsChanged = false;
      pots = pots.map(p => {
        const expectedTempId = ALL_BUTTERFLY_MANDALA_45[((p.id - 1) * 5 + p.level) % ALL_BUTTERFLY_MANDALA_45.length].id;
        if (p.templateId !== expectedTempId) {
          potsChanged = true;
          return { ...p, templateId: expectedTempId };
        }
        return p;
      });
      if (potsChanged) {
        await this.potRepo.saveAllPots(pots);
      }
    }

    // Attach diaries to pots and sanitize trailing numbers (e.g. 개나리 2 -> 개나리)
    pots = pots.map(p => ({
      ...p,
      name: p.name ? p.name.replace(/\s+\d+$/, '') : p.name,
      noun: p.noun ? p.noun.replace(/\s+\d+$/, '') : p.noun,
    }));

    for (const pot of pots) {
      pot.diaries = await this.diaryRepo.getDiariesByPotId(pot.id);
    }

    const cleanArchive = archive.map(a => ({
      ...a,
      name: a.name ? a.name.replace(/\s+\d+$/, '') : a.name,
    }));

    return {
      score: gardenState.score,
      currentPotIndex: gardenState.currentPotIndex,
      selectedColors: [],
      currentColor: '',
      mandalaColors: {},
      bottleRatios: [0, 0, 0],
      pots,
      archive: cleanArchive,
      shownMessages: gardenState.shownMessages,
      usedTemplateIds: gardenState.usedTemplateIds,
      hasButterfly: butterfly,
      hasBee: bee,
      hasBird: bird,
    };
  }

  async completeColoring(state: GameState): Promise<{ newState: GameState; resultType: 'mind-card' | null }> {
    const targetPot = state.pots[state.currentPotIndex];
    if (!targetPot || targetPot.status === 'locked' || targetPot.level >= 5) {
      return { newState: state, resultType: null };
    }

    const activeTemplateId = targetPot.templateId || 'lotus_core';

    let maxIdx = 0;
    let maxVal = state.bottleRatios[0] || 0;
    for (let i = 1; i < state.bottleRatios.length; i++) {
      if ((state.bottleRatios[i] || 0) > maxVal) {
        maxVal = state.bottleRatios[i] || 0;
        maxIdx = i;
      }
    }

    const dominantColor = state.selectedColors[maxIdx] || getHealingColors()[0];
    const dominantType = dominantColor.type;
    const nextLevel = Math.min(5, targetPot.level + 1);

    let finalName = targetPot.name;
    let finalAdj = targetPot.adj;
    let finalNoun = targetPot.noun;

    const season = state.hasBee || state.hasBird ? 3 : (state.hasButterfly ? 2 : 1);
    const stepDetailsObj = getStepDetailsForSeason(season);

    const currentMsgIdx = targetPot.messageIndex ?? 0;

    const pickMessage = (step: any, idx: number): string => {
      if (!step) return '';
      if (step.messages && Array.isArray(step.messages) && step.messages.length > 0) {
        return step.messages[idx % step.messages.length];
      }
      return step.message || '';
    };

    let newShownMessages = [...(state.shownMessages || [])];

    const STEP_DESC_MAP: { [key: number]: string } = {
      1: pickMessage(stepDetailsObj?.[1] || stepDetailsObj?.['1'], currentMsgIdx),
      2: pickMessage(stepDetailsObj?.[2] || stepDetailsObj?.['2'], currentMsgIdx),
      3: pickMessage(stepDetailsObj?.[3] || stepDetailsObj?.['3'], currentMsgIdx),
      4: pickMessage(stepDetailsObj?.[4] || stepDetailsObj?.['4'], currentMsgIdx),
      5: getRandomFlowerMessage(dominantType, newShownMessages)
    };

    let finalDesc = STEP_DESC_MAP[nextLevel] || targetPot.desc;

    if (nextLevel === 5 && !newShownMessages.includes(finalDesc)) {
      newShownMessages.push(finalDesc);
      await this.gardenRepo.saveGardenState({ shownMessages: newShownMessages });
    }

    if (nextLevel === 1) {
      const plantNames = getPlantNames();
      const adjs = plantNames?.adjectives?.[dominantType] || plantNames?.adjectives?.['green'] || [];
      finalAdj = adjs.length > 0 ? adjs[Math.floor(Math.random() * adjs.length)] : '';
      const nns = plantNames?.nouns?.[dominantType] || plantNames?.nouns?.['green'] || [];
      finalNoun = nns.length > 0 ? nns[Math.floor(Math.random() * nns.length)] : '';
      finalName = finalAdj && finalNoun ? `${finalAdj} ${finalNoun}` : (finalAdj || finalNoun || (isEn() ? 'Lotus' : '연꽃'));
    }

    let maxStepIdx = 0;
    let maxStepVal = state.bottleRatios[0] || 0;
    for (let i = 1; i < state.bottleRatios.length; i++) {
      if ((state.bottleRatios[i] || 0) > maxStepVal) {
        maxStepVal = state.bottleRatios[i] || 0;
        maxStepIdx = i;
      }
    }
    const stepDominantColor = state.selectedColors[maxStepIdx] || getHealingColors()[0];

    const updatedColors = [...(targetPot.colors || [])];
    if (updatedColors.length < nextLevel) {
      updatedColors.push(stepDominantColor.hex);
    }

    const templatePool = (state.hasBee || state.hasBird || targetPot.templateId?.startsWith('beebird_'))
      ? ALL_BEE_BIRD_MANDALA_45
      : (state.hasButterfly || targetPot.templateId?.startsWith('butterfly_'))
        ? ALL_BUTTERFLY_MANDALA_45
        : ALL_MANDALA_20;

    const nextTempId = templatePool[(state.currentPotIndex * 5 + nextLevel) % templatePool.length].id;

    const emptySoilName = isEn() ? "Empty Soil" : "비어있는 흙";
    const emptySoilDesc = "";

    const updatedPots = state.pots.map((p, idx) => {
      if (idx === state.currentPotIndex) {
        return {
          ...p,
          level: nextLevel,
          name: finalName,
          adj: finalAdj,
          noun: finalNoun,
          type: dominantType,
          desc: finalDesc,
          colors: updatedColors,
          templateId: nextLevel < 5 ? nextTempId : p.templateId
          // messageIndex stays the same for all levels of this pot
        };
      }

      if (idx === state.currentPotIndex + 1 && nextLevel === 5 && idx < 9) {
        const nextPotTemplateId = templatePool[(idx * 5) % templatePool.length].id;
        return {
          ...p,
          status: 'unlocked' as const,
          name: emptySoilName,
          level: 0,
          desc: emptySoilDesc,
          templateId: nextPotTemplateId,
          messageIndex: currentMsgIdx + 1  // next pot advances to next message
        };
      }
      return p;
    });

    let finalPots = [...updatedPots];
    if (state.currentPotIndex === state.pots.length - 1 && nextLevel === 5 && finalPots.length < 9) {
      const nextId = state.pots.length + 1;
      const nextIndex = finalPots.length;
      const newPotTempId = templatePool[(nextIndex * 5) % templatePool.length].id;

      finalPots.push({
        id: nextId,
        name: emptySoilName,
        adj: "",
        noun: "",
        level: 0,
        status: "unlocked" as const,
        type: "neutral" as const,
        desc: emptySoilDesc,
        colorRatios: {},
        colors: [],
        templateId: newPotTempId
      });
    }

    let newArchive = [...state.archive];
    if (nextLevel === 5 && targetPot.level < 5) {
      const newItem: ArchivedPlant = {
        name: finalName,
        date: new Date().toLocaleDateString(),
        type: dominantType,
        desc: finalDesc,
        colors: updatedColors,
        templateId: activeTemplateId,
        diaries: targetPot.diaries
      };
      newArchive = [newItem, ...newArchive];
      await this.potRepo.addArchive(newItem);
    }

    await this.potRepo.saveAllPots(finalPots);

    const newState: GameState = {
      ...state,
      pots: finalPots,
      archive: newArchive,
      shownMessages: newShownMessages
    };

    return { newState, resultType: 'mind-card' };
  }

  async writeDiary(state: GameState, potId: number, level: number, question: string, content: string): Promise<GameState> {
    const dateStr = new Date().toLocaleDateString();
    await this.diaryRepo.saveDiary(potId, level, question, content, dateStr);

    const updatedPots = state.pots.map(p => {
      if (p.id === potId) {
        const currentDiaries = p.diaries || {};
        return {
          ...p,
          diaries: {
            ...currentDiaries,
            [level]: {
              question,
              content,
              date: dateStr
            }
          }
        };
      }
      return p;
    });

    return {
      ...state,
      pots: updatedPots
    };
  }

  async resetGame(): Promise<GameState> {
    await this.potRepo.clearAllPotsAndArchive();
    await this.diaryRepo.clearAllDiaries();
    await this.gardenRepo.resetGardenState();
    await this.creatureRepo.resetCreatures();

    const initialPots = initialPotsSeed();
    await this.potRepo.saveAllPots(initialPots);

    for (const c of initialCreaturesSeed) {
      await this.creatureRepo.setCreatureUnlocked(c.id, c.unlocked === 1);
    }

    return this.loadFullState();
  }

  async startGardenSeason(season: 2 | 3 | 4, currentArchive: ArchivedPlant[]): Promise<GameState> {
    const initialPots = initialPotsSeed(season);
    await this.potRepo.clearAllPotsAndArchive();

    for (const arch of currentArchive) {
      await this.potRepo.addArchive(arch);
    }

    await this.potRepo.saveAllPots(initialPots);
    await this.gardenRepo.saveGardenState({ currentPotIndex: 0 });

    if (season >= 2) await this.creatureRepo.setCreatureUnlocked('butterfly', true);
    if (season >= 3) await this.creatureRepo.setCreatureUnlocked('bee', true);
    if (season >= 4) await this.creatureRepo.setCreatureUnlocked('bird', true);

    return this.loadFullState();
  }
}
