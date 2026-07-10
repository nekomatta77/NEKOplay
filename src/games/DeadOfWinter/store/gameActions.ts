// src/games/DeadOfWinter/store/gameActions.ts
import { GameState, ActionDice } from './gameState';

// Завершение хода и передача следующему игроку
export const endPlayerTurn = (state: GameState): GameState => {
  if (!state.activePlayerId) return state;

  const currentPlayerIndex = state.players.findIndex(p => p.id === state.activePlayerId);
  const nextPlayerIndex = currentPlayerIndex + 1;

  // Если сходили все игроки, переходим в фазу колонии
  if (nextPlayerIndex >= state.players.length) {
    return {
      ...state,
      activePlayerId: null,
      phase: 'colony_phase'
    };
  }

  // Передача хода следующему
  return {
    ...state,
    activePlayerId: state.players[nextPlayerIndex].id
  };
};

// Расход кубика действия
export const spendDice = (state: GameState, playerId: string, diceId: string): GameState => {
  return {
    ...state,
    players: state.players.map(player => {
      if (player.id !== playerId) return player;
      return {
        ...player,
        actionDice: player.actionDice.map(dice => 
          dice.id === diceId ? { ...dice, status: 'spent' } : dice
        )
      };
    })
  };
};