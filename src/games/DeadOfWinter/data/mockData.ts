// src/games/DeadOfWinter/data/mockData.ts
import { GameState } from '../store/gameState';

export const mockSurvivors = {
  'surv_1': { id: 'surv_1', name: 'Майк Чо', attack: 3, search: 4, influence: 60, status: 'healthy' },
  'surv_2': { id: 'surv_2', name: 'Лоретта Клей', attack: 4, search: 3, influence: 50, status: 'healthy' }
};

export const mockInitialState: GameState = {
  players: [
    {
      id: 'player_1',
      name: 'NekoDev',
      isFirstPlayer: true,
      survivors: ['surv_1', 'surv_2'],
      actionDice: [
        { id: 'dice_1', value: 5, status: 'available' },
        { id: 'dice_2', value: 3, status: 'available' },
        { id: 'dice_3', value: 1, status: 'spent' }
      ]
    }
  ],
  activePlayerId: 'player_1',
  round: 1,
  phase: 'player_turns',
  colony: {
    morale: 5,
    food: 2,
    starvationTokens: 0,
    waste: 1,
  },
};