// src/games/DeadOfWinter/state.ts

export interface PlayerState {
  survivors: string[]; 
  hand: string[];      
  actionDice: number[]; 
  secretObjective: string | null;
  isTraitor: boolean;
}

export interface LocationState {
  survivors: string[]; 
  zombies: number;     
  barricades: number;  
  noise: number;       
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
  
  // === ЕДИНЫЙ ЦЕНТР СИНХРОНИЗАЦИИ БРОСКОВ ===
  lastDiceRequest?: {
    playerId: string;
    notation: string;
    results: number[];
    timestamp: number;
  };
}

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
    activePlayerId: playerIds[0], 
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