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

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

  // === МАГИЯ СИНХРОНИЗАЦИИ ===
  requestDiceRoll: async (roomId: string, playerId: string, notation: string) => {
    // 1. Придумываем цифры заранее
    const results: number[] = [];
    if (notation === '3d6') {
      results.push(getRandomInt(1, 6), getRandomInt(1, 6), getRandomInt(1, 6));
    } else {
      results.push(1); 
    }
    // Сортируем для красоты
    results.sort((a, b) => b - a);

    const updates: any = {};
    
    // 2. Даем команду всем 3D-движкам в комнате: "БРОСАЙТЕ!"
    updates[`rooms/${roomId}/gameState/lastDiceRequest`] = {
      playerId,
      notation,
      results,
      timestamp: Date.now()
    };
    
    // 3. Выдаем кубики в 2D-руку игроку (они появятся, когда 3D-поднос закроется)
    updates[`rooms/${roomId}/gameState/players/${playerId}/actionDice`] = results;

    await update(ref(db), updates);
  }
};