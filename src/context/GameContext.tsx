import {
  ALL_MANDALA_20,
  ALL_BUTTERFLY_MANDALA_45,
  ALL_BEE_BIRD_MANDALA_45,
  getHealingColors,
  HealingColor
} from '@/constants/healing-data';
import { GameState } from '@/domain/game';
import { Pot } from '@/domain/pot';
import { ICreatureRepository } from '@/repositories/interfaces/ICreatureRepository';
import { IDiaryRepository } from '@/repositories/interfaces/IDiaryRepository';
import { IGardenRepository } from '@/repositories/interfaces/IGardenRepository';
import { IPotRepository } from '@/repositories/interfaces/IPotRepository';
import { AsyncStorageCreatureRepository } from '@/repositories/asyncstorage/AsyncStorageCreatureRepository';
import { AsyncStorageDiaryRepository } from '@/repositories/asyncstorage/AsyncStorageDiaryRepository';
import { AsyncStorageGardenRepository } from '@/repositories/asyncstorage/AsyncStorageGardenRepository';
import { AsyncStoragePotRepository } from '@/repositories/asyncstorage/AsyncStoragePotRepository';
import { playSoundEffect, triggerHaptic } from '@/services/feedback';
import { GameService } from '@/services/GameService';
import { checkHasPurchased, initPurchaseService } from '@/services/purchaseService';
import { resetReviewPromptFlag } from '@/services/reviewService';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type { ArchivedPlant, DiaryEntry, Pot } from '@/domain/pot';

interface GameContextType {
  state: GameState;
  isLoaded: boolean;

  // Modal popups state
  isModalOpen: boolean;
  modalTitle: string;
  modalContent: string;

  // Game Actions
  selectColor: (color: HealingColor) => void;
  removeSelectedColor: (hex: string) => void;
  selectBrush: (hex: string) => void;
  colorSegment: (segmentId: string) => void;
  completeColoring: (extra?: { paperTexture?: string; cottonColor?: string }) => 'mind-card' | null;
  resetCanvas: () => void;
  resetSelection: () => void;
  collectParticle: (id: number) => void;
  setCurrentPotIndex: (index: number) => void;
  randomizeActivePotTemplate: () => void;
  showModal: (title: string, content: string) => void;
  closeModal: () => void;
  resetGame: () => Promise<void>;
  startSecondGarden: () => Promise<void>;
  startThirdGarden: () => Promise<void>;
  startFourthGarden: () => Promise<void>;
  unlockPremiumGarden: () => Promise<void>;
  lockPremiumGarden: () => Promise<void>;
  writeDiary: (potId: number, level: number, question: string, content: string) => void;
  updateSelectedColorsTone: (tone: 'pastel' | 'vivid') => void;
}

const defaultState = (): GameState => ({
  score: 250,
  currentPotIndex: 0,
  selectedColors: [],
  currentColor: '',
  mandalaColors: {},
  bottleRatios: [0, 0, 0],
  pots: [],
  archive: [],
  shownMessages: [],
  usedTemplateIds: [],
});

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(defaultState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameService, setGameService] = useState<GameService | null>(null);

  // Systemic modal popup state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  // Initialize Repositories (SQLite for Native, AsyncStorage for Web/fallback)
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        let potRepo: IPotRepository;
        let diaryRepo: IDiaryRepository;
        let gardenRepo: IGardenRepository;
        let creatureRepo: ICreatureRepository;

        if (Platform.OS !== 'web') {
          try {
            const { getDatabase } = require('@/db/client.native');
            const { SQLitePotRepository } = require('@/repositories/sqlite/SQLitePotRepository.native');
            const { SQLiteDiaryRepository } = require('@/repositories/sqlite/SQLiteDiaryRepository.native');
            const { SQLiteGardenRepository } = require('@/repositories/sqlite/SQLiteGardenRepository.native');
            const { SQLiteCreatureRepository } = require('@/repositories/sqlite/SQLiteCreatureRepository.native');

            const db = await getDatabase();
            if (db) {
              potRepo = new SQLitePotRepository(db);
              diaryRepo = new SQLiteDiaryRepository(db);
              gardenRepo = new SQLiteGardenRepository(db);
              creatureRepo = new SQLiteCreatureRepository(db);
            } else {
              potRepo = new AsyncStoragePotRepository();
              diaryRepo = new AsyncStorageDiaryRepository();
              gardenRepo = new AsyncStorageGardenRepository();
              creatureRepo = new AsyncStorageCreatureRepository();
            }
          } catch (dbErr) {
            console.warn('SQLite init failed, falling back to AsyncStorage:', dbErr);
            potRepo = new AsyncStoragePotRepository();
            diaryRepo = new AsyncStorageDiaryRepository();
            gardenRepo = new AsyncStorageGardenRepository();
            creatureRepo = new AsyncStorageCreatureRepository();
          }
        } else {
          potRepo = new AsyncStoragePotRepository();
          diaryRepo = new AsyncStorageDiaryRepository();
          gardenRepo = new AsyncStorageGardenRepository();
          creatureRepo = new AsyncStorageCreatureRepository();
        }

        const service = new GameService(potRepo, diaryRepo, gardenRepo, creatureRepo);
        const currentArchive = await potRepo.getArchive();
        let fullState: GameState;
        if (currentArchive.some(p => p.templateId === 'flower_8' || p.templateId === 'butterfly_8' || p.templateId === 'beebird_8')) {
          fullState = await service.resetGame();
        } else {
          fullState = await service.loadFullState();
        }

        // ==========================================
        // [IN-APP PURCHASE] IAP 모듈 초기화 및 백그라운드 자동 복원
        // 기기 변경 / 재설치 시에도 구글 계정에 구매 이력이 있으면 자동 언락됩니다.
        // ==========================================
        await initPurchaseService();
        try {
          const hasPurchased = await checkHasPurchased();
          if (hasPurchased && !fullState.isPremiumUnlocked) {
            fullState = await service.unlockPremiumGarden(fullState);
          } else if (!hasPurchased && fullState.isPremiumUnlocked) {
            fullState = await service.lockPremiumGarden(fullState);
          }
        } catch (restoreErr) {
          console.warn('Silent sync failed:', restoreErr);
        }

        if (isMounted) {
          setGameService(service);
          setState(fullState);
          setIsLoaded(true);
        }
      } catch (e) {
        console.error('Failed to initialize GameService:', e);
        if (isMounted) setIsLoaded(true);
      }
    };
    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const selectColor = (color: HealingColor) => {
    if (state.selectedColors.some(c => c.name === color.name || c.hex === color.hex)) return;

    const completedCount = state.archive.length;
    const unlockedCount =
      completedCount < 2 ? 18 :
        completedCount < 4 ? 24 : 36;

    const colorIndex = getHealingColors().findIndex(c => c.name === color.name || c.hex === color.hex || c.vividHex === color.hex);
    if (colorIndex >= unlockedCount) {
      triggerHaptic('error');
      playSoundEffect(150, 'square', 0.5);
      return;
    }

    if (state.selectedColors.length < 5) {
      triggerHaptic('light');
      playSoundEffect(320 + (state.selectedColors.length * 80), 'sine', 0.5);

      const updated = [...state.selectedColors, color];
      setState(prev => ({
        ...prev,
        selectedColors: updated,
        currentColor: updated.length === 1 ? color.hex : prev.currentColor,
      }));
    }
  };

  const removeSelectedColor = (hex: string) => {
    playSoundEffect(220, 'triangle', 0.3);

    const updated = state.selectedColors.filter(c => c.hex !== hex);
    setState(prev => {
      const nextBrush = prev.currentColor === hex ? (updated[0]?.hex || '') : prev.currentColor;
      return {
        ...prev,
        selectedColors: updated,
        currentColor: nextBrush,
        bottleRatios: [0, 0, 0, 0, 0]
      };
    });
  };

  const updateSelectedColorsTone = (tone: 'pastel' | 'vivid') => {
    const allColors = getHealingColors();
    setState(prev => {
      const updated = prev.selectedColors.map(c => {
        const found = allColors.find(item => item.name === c.name || item.hex === c.hex || (item.vividHex && item.vividHex === c.hex));
        if (!found) return c;
        const targetHex = (tone === 'vivid' && found.vividHex) ? found.vividHex : found.hex;
        return { ...c, hex: targetHex };
      });
      const activeFound = allColors.find(item => item.hex === prev.currentColor || (item.vividHex && item.vividHex === prev.currentColor));
      const nextCurrentColor = activeFound
        ? ((tone === 'vivid' && activeFound.vividHex) ? activeFound.vividHex : activeFound.hex)
        : (updated[0]?.hex || prev.currentColor);

      return {
        ...prev,
        selectedColors: updated,
        currentColor: nextCurrentColor,
      };
    });
  };

  const selectBrush = (hex: string) => {
    playSoundEffect(440, 'sine', 0.4);
    setState(prev => ({
      ...prev,
      currentColor: hex,
    }));
  };

  const colorSegment = (segmentId: string) => {
    if (!state.currentColor) return;

    const oldColor = state.mandalaColors[segmentId];
    if (oldColor === state.currentColor) return;

    triggerHaptic('light');
    playSoundEffect(120, 'triangle', 0.12);
    setTimeout(() => playSoundEffect(554.37, 'sine', 0.7), 40);

    setState(prev => {
      const newColors = { ...prev.mandalaColors, [segmentId]: prev.currentColor };
      const colorIndex = prev.selectedColors.findIndex(c => c.hex === prev.currentColor);
      const nextRatios = [...prev.bottleRatios];
      while (nextRatios.length < prev.selectedColors.length) {
        nextRatios.push(0);
      }

      if (colorIndex !== -1 && !oldColor) {
        nextRatios[colorIndex] = Math.min(100, (nextRatios[colorIndex] || 0) + 15);
      }

      return {
        ...prev,
        mandalaColors: newColors,
        bottleRatios: nextRatios,
      };
    });
  };

  const completeColoring = (extra?: { paperTexture?: string; cottonColor?: string }): 'mind-card' | null => {
    if (gameService) {
      gameService.completeColoring(state, extra).then(({ newState }) => {
        setState(newState);
      }).catch(e => console.error('completeColoring error:', e));
    }

    playSoundEffect(987.77, 'sine', 1.5);
    return 'mind-card';
  };

  const resetCanvas = () => {
    playSoundEffect(200, 'triangle', 0.6);
    setState(prev => ({
      ...prev,
      mandalaColors: {},
      bottleRatios: [0, 0, 0, 0, 0],
    }));
  };

  const resetSelection = () => {
    setState(prev => ({
      ...prev,
      selectedColors: [],
      currentColor: '',
      mandalaColors: {},
      bottleRatios: [0, 0, 0, 0, 0],
    }));
  };

  const collectParticle = (id: number) => {
    playSoundEffect(1174.66, 'sine', 0.5);
  };

  const setCurrentPotIndex = (index: number) => {
    setState(prev => ({
      ...prev,
      currentPotIndex: index,
    }));
  };

  const randomizeActivePotTemplate = () => {
    setState(prev => {
      const activePot = prev.pots[prev.currentPotIndex];
      if (!activePot) return prev;
      const templatePool = (prev.hasBee || prev.hasBird || activePot.templateId?.startsWith('beebird_'))
        ? ALL_BEE_BIRD_MANDALA_45
        : (prev.hasButterfly || activePot.templateId?.startsWith('butterfly_'))
          ? ALL_BUTTERFLY_MANDALA_45
          : ALL_MANDALA_20;
      const nextId = templatePool[(prev.currentPotIndex * 5 + activePot.level) % templatePool.length].id;

      const updatedPots = prev.pots.map((p, idx) => {
        if (idx === prev.currentPotIndex && p.level < 5) {
          return {
            ...p,
            templateId: nextId
          };
        }
        return p;
      });

      return {
        ...prev,
        pots: updatedPots,
      };
    });
  };

  const writeDiary = (potId: number, level: number, question: string, content: string) => {
    if (!gameService) return;
    gameService.writeDiary(state, potId, level, question, content).then(newState => {
      setState(newState);
    });
  };

  const resetGame = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.resetGame();
      setState(newState);
      await resetReviewPromptFlag();
    } catch (e) {
      console.error('Failed to reset game:', e);
    }
  };

  const startSecondGarden = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.startGardenSeason(2, state.archive);
      setState(newState);
    } catch (e) {
      console.error('Failed to start second garden:', e);
    }
  };

  const startThirdGarden = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.startGardenSeason(3, state.archive);
      setState(newState);
    } catch (e) {
      console.error('Failed to start third garden:', e);
    }
  };

  const startFourthGarden = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.startGardenSeason(4, state.archive);
      setState(newState);
    } catch (e) {
      console.error('Failed to start fourth garden:', e);
    }
  };

  const unlockPremiumGarden = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.unlockPremiumGarden(state);
      setState(newState);
    } catch (e) {
      console.error('Failed to unlock premium garden:', e);
    }
  };

  const lockPremiumGarden = async () => {
    if (!gameService) return;
    try {
      const newState = await gameService.lockPremiumGarden(state);
      setState(newState);
    } catch (e) {
      console.error('Failed to lock premium garden:', e);
    }
  };

  return (
    <GameContext.Provider
      value={{
        state,
        isLoaded,
        isModalOpen,
        modalTitle,
        modalContent,
        selectColor,
        removeSelectedColor,
        selectBrush,
        colorSegment,
        completeColoring,
        resetCanvas,
        resetSelection,
        collectParticle,
        setCurrentPotIndex,
        randomizeActivePotTemplate,
        showModal,
        closeModal,
        resetGame,
        startSecondGarden,
        startThirdGarden,
        startFourthGarden,
        unlockPremiumGarden,
        lockPremiumGarden,
        writeDiary,
        updateSelectedColorsTone,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
