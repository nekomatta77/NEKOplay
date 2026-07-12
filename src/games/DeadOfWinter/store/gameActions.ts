// src/games/DeadOfWinter/store/gameActions.ts
import { GameState, Player, ActionDice } from './gameState';

// Старт игры после выбора персонажей
export const startGame = (state: GameState, playerId: string, selectedSurvivors: string[]): GameState => {
  return {
    ...state,
    phase: 'player_turns', // Исправление ошибки 2820 (добавлена 's')
    activePlayerId: playerId,
    players: state.players.map((p: Player) => {
      if (p.id === playerId) {
        return {
          ...p,
          survivors: selectedSurvivors,
          actionDice: [] 
        };
      }
      return p;
    })
  };
};

export const endPlayerTurn = (state: GameState): GameState => {
  if (!state.activePlayerId) return state;
  const currentPlayerIndex = state.players.findIndex((p: Player) => p.id === state.activePlayerId);
  const nextPlayerIndex = currentPlayerIndex + 1;

  if (nextPlayerIndex >= state.players.length) {
    return { ...state, activePlayerId: null, phase: 'colony_phase' };
  }
  return { ...state, activePlayerId: state.players[nextPlayerIndex].id };
};

export const spendDice = (state: GameState, playerId: string, diceId: string): GameState => {
  return {
    ...state,
    players: state.players.map((player: Player) => {
      if (player.id !== playerId) return player;
      return {
        ...player,
        actionDice: player.actionDice.map((dice: ActionDice) => 
          dice.id === diceId ? { ...dice, status: 'spent' } : dice
        )
      };
    })
  };
};

export const requestDiceRoll = (state: GameState, playerId: string, diceCount: number): GameState => {
  const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  results.sort((a, b) => b - a);
  return {
    ...state,
    lastDiceRequest: { playerId, notation: `${diceCount}d6`, results, timestamp: Date.now() }
  };
};

export const applyRolledDice = (state: GameState, playerId: string, results: number[]): GameState => {
  return {
    ...state,
    players: state.players.map((player: Player) => {
      if (player.id !== playerId) return player;
      const newDice: ActionDice[] = results.map((val, idx) => ({
        id: `dice_${Date.now()}_${idx}`, value: val, status: 'available'
      }));
      return { ...player, actionDice: [...player.actionDice, ...newDice] };
    })
  };
};