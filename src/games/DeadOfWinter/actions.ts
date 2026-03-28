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

// Функция для случайного числа от min до max
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
      
      // В начале игры каждый игрок получает кубики действий.
      // Формула оригинала: Количество выживших у игрока (2) + 1 = 3 кубика.
      // Пока просто зададим пустой массив, они будут брошены в Фазу Игроков
      initialState.players[playerId].actionDice = [];
    });

    await update(ref(db, `rooms/${room.id}/gameState`), initialState);
  },

  // === НОВАЯ МЕХАНИКА: БРОСОК КУБИКОВ ДЕЙСТВИЙ ===
  rollActionDice: async (roomId: string, playerId: string, diceCount: number) => {
    const rolledDice = [];
    for (let i = 0; i < diceCount; i++) {
      rolledDice.push(getRandomInt(1, 6)); // Бросаем обычный d6
    }
    
    // Сортируем от большего к меньшему для красоты и отправляем в базу
    rolledDice.sort((a, b) => b - a);
    
    await update(ref(db, `rooms/${roomId}/gameState/players/${playerId}/actionDice`), rolledDice);
  },

  // === НОВАЯ МЕХАНИКА: БРОСОК КУБИКА ПОВРЕЖДЕНИЙ ===
  rollExposureDie: async (roomId: string, playerId: string, survivorId: string) => {
    // Математика 12-гранного кубика повреждений:
    // 1-6 = Пусто (Blank)
    // 7-9 = Рана (Wound)
    // 10-11 = Обморожение (Frostbite)
    // 12 = Укус (Bite)
    
    const roll = getRandomInt(1, 12);
    let result = 'blank';
    
    if (roll >= 7 && roll <= 9) result = 'wound';
    if (roll >= 10 && roll <= 11) result = 'frostbite';
    if (roll === 12) result = 'bite';

    // Записываем результат в специальное поле, чтобы UI поймал его и запустил 3D анимацию
    await update(ref(db, `rooms/${roomId}/gameState/lastExposureRoll`), {
      playerId,
      survivorId,
      result,
      timestamp: Date.now() // Чтобы всегда срабатывало как новое событие
    });
  }
};