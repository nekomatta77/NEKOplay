// src/games/DeadOfWinter/data/mockData.ts
import { GameState } from '../store/gameState';

export const mockInitialState: GameState = {
  phase: 'player_turns',
  round: 1,
  activePlayerId: 'player_1',
  settings: {
    duration: 'medium', // Исправлено: изменено с 'normal' на 'medium'
    difficulty: 'normal',
    hasTraitor: false
  },
  draftPool: [],
  colony: {
    morale: 5,
    food: 0,
    starvationTokens: 0,
    waste: 0
  },
  players: [
    {
      id: 'player_1',
      name: 'Игрок 1',
      isFirstPlayer: true,
      survivors: ['mike_cho', 'olivia_brown'],
      actionDice: [
        { id: 'dice_1', value: 5, status: 'available' },
        { id: 'dice_2', value: 3, status: 'available' },
        { id: 'dice_3', value: 1, status: 'available' }
      ]
    }
  ]
};

// Заглушка, чтобы старые импорты не ломали сборку (если где-то еще используется)
export const mockSurvivors = {};