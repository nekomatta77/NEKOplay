// src/games/DeadOfWinter/state.ts

export interface PlayerState {
  survivors: string[]; // ID выживших под контролем игрока
  hand: string[];      // ID карт предметов в руке
  actionDice: number[]; // Значения брошенных кубиков действий
  secretObjective: string | null;
  isTraitor: boolean;
}

export interface LocationState {
  survivors: string[]; // Кто находится здесь
  zombies: number;     // Количество зомби
  barricades: number;  // Количество баррикад
  noise: number;       // Жетоны шума (кроме колонии)
}

export interface DeadOfWinterState {
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  phase: 'colony' | 'playerTurns' | 'crisis';
  activePlayerId: string | null;
  morale: number;
  food: number;
  waste: number;
  locations: {
    colony: LocationState;
    policeStation: LocationState;
    groceryStore: LocationState;
    school: LocationState;
    library: LocationState;
    hospital: LocationState;
    gasStation: LocationState;
  };
  players: Record<string, PlayerState>;
  mainObjective: string;
  currentCrisis: string | null;
  
  // === ДОБАВЛЕНО ДЛЯ СИНХРОНИЗАЦИИ КУБИКОВ ===
  lastDiceRequest?: {
    playerId: string;
    notation: string;
    results: number[];
    timestamp: number;
  };
}

// Функция для генерации начального состояния при старте игры
export const getInitialGameState = (playerIds: string[]): DeadOfWinterState => {
  const initialPlayersState: Record<string, PlayerState> = {};
  
  playerIds.forEach(id => {
    initialPlayersState[id] = {
      survivors: [], 
      hand: [],      
      actionDice: [], 
      secretObjective: null, 
      isTraitor: false 
    };
  });

  return {
    status: 'playing',
    round: 1,
    phase: 'playerTurns',
    activePlayerId: playerIds[0], // Первый игрок начинает
    morale: 5,
    food: 0,
    waste: 0,
    locations: {
      colony: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      policeStation: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      groceryStore: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      school: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      library: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      hospital: { survivors: [], zombies: 0, barricades: 0, noise: 0 },
      gasStation: { survivors: [], zombies: 0, barricades: 0, noise: 0 }
    },
    players: initialPlayersState,
    mainObjective: 'survive_winter_1',
    currentCrisis: null,
  };
};