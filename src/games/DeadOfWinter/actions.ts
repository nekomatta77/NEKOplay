// src/games/DeadOfWinter/actions.ts
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getInitialGameState } from './state';
import { Room } from '../../types';
import { getAllSurvivors } from './data/survivors';

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const GameActions = {
  
  startGame: async (room: Room) => {
    if (!room.players) return;
    const playerIds = room.players.map(p => p.id);
    const initialState = getInitialGameState(playerIds);

    const allSurvivors = getAllSurvivors();
    const shuffledSurvivors = shuffleArray(allSurvivors);
    let survivorIndex = 0;
    
    playerIds.forEach(playerId => {
      const playerSurvivors = [
        shuffledSurvivors[survivorIndex],
        shuffledSurvivors[survivorIndex + 1]
      ];
      survivorIndex += 2; 

      playerSurvivors.sort((a, b) => b.influence - a.influence);
      const survivorIds = playerSurvivors.map(s => s.id);

      initialState.players[playerId].survivors = survivorIds;
      initialState.locations.colony.survivors.push(...survivorIds);
      initialState.players[playerId].actionDice = [];
    });

    await update(ref(db, `rooms/${room.id}/gameState`), initialState);
  },

  // === НОВАЯ ФУНКЦИЯ: Сохраняем физические результаты 3D броска в базу ===
  saveDiceRoll: async (roomId: string, playerId: string, results: number[]) => {
    const updates: any = {};
    
    // 1. Выдаем кубики игроку в инвентарь
    updates[`rooms/${roomId}/gameState/players/${playerId}/actionDice`] = results;
    // 2. Обновляем таймстамп, чтобы у всех сработала 2D-анимация выпрыгивания
    updates[`rooms/${roomId}/gameState/lastRollTimestamp`] = Date.now();

    await update(ref(db), updates);
  }
};