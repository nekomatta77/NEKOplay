// src/games/DeadOfWinter/store/gameState.ts

export type DiceStatus = 'available' | 'spent' | 'rolled';
export type GamePhase = 'lobby' | 'drafting' | 'player_turns' | 'colony_phase';

export interface ActionDice {
  id: string;
  value: number;
  status: DiceStatus;
}

export interface Player {
  id: string;
  name: string;
  isFirstPlayer: boolean;
  survivors: string[]; 
  actionDice: ActionDice[];
}

export interface GameSettings {
  duration: 'short' | 'medium' | 'long';
  difficulty: 'normal' | 'hardcore';
  hasTraitor: boolean;
}

export interface GameState {
  players: Player[];
  activePlayerId: string | null;
  round: number;
  phase: GamePhase;
  settings: GameSettings;
  draftPool: string[]; // ID скрытых карт на столе
  colony: {
    morale: number;
    food: number;
    starvationTokens: number;
    waste: number;
  };
  lastDiceRequest?: {
    playerId: string;
    notation: string;
    results: number[];
    timestamp: number;
  };
}