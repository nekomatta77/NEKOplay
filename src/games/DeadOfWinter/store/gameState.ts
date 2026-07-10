// src/games/DeadOfWinter/store/gameState.ts

export type DiceStatus = 'available' | 'spent' | 'rolled';

export interface ActionDice {
  id: string;
  value: number;
  status: DiceStatus;
}

export interface Player {
  id: string;
  name: string;
  isFirstPlayer: boolean;
  survivors: string[]; // ID выживших под контролем игрока
  actionDice: ActionDice[];
}

export interface GameState {
  players: Player[];
  activePlayerId: string | null;
  round: number;
  phase: 'player_turns' | 'colony_phase';
  // Базовые ресурсы колонии
  colony: {
    morale: number;
    food: number;
    starvationTokens: number;
    waste: number;
  };
}

// Инициализация стартового состояния
export const initialGameState: GameState = {
  players: [],
  activePlayerId: null,
  round: 1,
  phase: 'player_turns',
  colony: {
    morale: 5,
    food: 0,
    starvationTokens: 0,
    waste: 0,
  },
};