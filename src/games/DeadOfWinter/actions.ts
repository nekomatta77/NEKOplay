// src/games/DeadOfWinter/actions.ts
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getInitialGameState } from './state';
import { Room } from '../../types';
import { getAllSurvivors } from './data/survivors'; // Подключаем нашу базу персонажей

// Вспомогательная функция для перемешивания массива (Алгоритм Фишера-Йетса)
// Это как тщательно перетасовать колоду карт перед раздачей
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const GameActions = {
  
  // Старт игры
  startGame: async (room: Room) => {
    if (!room.players) return;
    const playerIds = room.players.map(p => p.id);
    
    // 1. Получаем базовый пустой шаблон состояния игры из state.ts
    const initialState = getInitialGameState(playerIds);

    // 2. Достаем всех выживших из нашей базы и хорошенько их перемешиваем
    const allSurvivors = getAllSurvivors();
    const shuffledSurvivors = shuffleArray(allSurvivors);

    // Индекс, чтобы знать, какие карты мы уже раздали
    let survivorIndex = 0;
    
    // 3. Проходимся по каждому игроку в комнате и раздаем персонажей
    playerIds.forEach(playerId => {
      // Берем двух следующих выживших из "колоды"
      const playerSurvivors = [
        shuffledSurvivors[survivorIndex],
        shuffledSurvivors[survivorIndex + 1]
      ];
      survivorIndex += 2; // Сдвигаем индекс для следующего игрока

      // В игре лидером группы становится тот, у кого больше значение "Влияния".
      // Сортируем полученных выживших так, чтобы персонаж с наибольшим влиянием был первым в массиве
      playerSurvivors.sort((a, b) => b.influence - a.influence);
      
      // Нам в базу данных нужны только их ID (например, 'Sparky', 'OliviaBrown')
      const survivorIds = playerSurvivors.map(s => s.id);

      // Записываем этих персонажей в листинг игрока
      initialState.players[playerId].survivors = survivorIds;

      // И сразу физически размещаем их в стартовой локации "Колония"
      initialState.locations.colony.survivors.push(...survivorIds);
    });

    // 4. Отправляем обновленное и заполненное состояние игры в Firebase
    await update(ref(db, `rooms/${room.id}/gameState`), initialState);
  },

  // В будущем здесь появятся:
  // movePlayer: async (roomId, playerId, targetLocation) => { ... }
  // attackZombie: async (roomId, playerId, location) => { ... }
};