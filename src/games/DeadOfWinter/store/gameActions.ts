// src/games/DeadOfWinter/store/gameActions.ts
import { GameState, Player, ActionDice } from './gameState';

// Завершение хода и передача следующему игроку
export const endPlayerTurn = (state: GameState): GameState => {
  if (!state.activePlayerId) return state;

  const currentPlayerIndex = state.players.findIndex((p: Player) => p.id === state.activePlayerId);
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

// Запрос на бросок 3D-кубиков
export const requestDiceRoll = (state: GameState, playerId: string, diceCount: number): GameState => {
  // Генерируем результаты кубиков (от 1 до 6)
  const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  
  // Сортируем по убыванию (от большего к меньшему), чтобы сильные кубики были первыми
  results.sort((a, b) => b - a);

  // Возвращаем обновленный стейт с запросом на анимацию
  return {
    ...state,
    lastDiceRequest: {
      playerId,
      notation: `${diceCount}d6`,
      results,
      timestamp: Date.now()
    }
  };
};

// Добавление брошенных кубиков в инвентарь игрока после завершения 3D анимации
export const applyRolledDice = (state: GameState, playerId: string, results: number[]): GameState => {
  return {
    ...state,
    players: state.players.map((player: Player) => {
      if (player.id !== playerId) return player;
      
      const newDice: ActionDice[] = results.map((val, idx) => ({
        id: `dice_${Date.now()}_${idx}`,
        value: val,
        status: 'available'
      }));

      return {
        ...player,
        // Заменяем старые (или пустые) кубики на новые выпавшие
        actionDice: [...player.actionDice, ...newDice]
      };
    })
  };
};