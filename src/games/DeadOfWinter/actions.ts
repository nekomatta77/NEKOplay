import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { getInitialGameState } from './state';
import { Room } from '../../types';

// Экспортируем все игровые действия как методы одного объекта
export const GameActions = {
  
  // Старт игры
  startGame: async (room: Room) => {
    if (!room.players) return;
    const playerIds = room.players.map(p => p.id);
    const initialState = getInitialGameState(playerIds);
    await update(ref(db, `rooms/${room.id}/gameState`), initialState);
  },

  // В будущем здесь появятся:
  // movePlayer: async (roomId, playerId, targetLocation) => { ... }
  // attackZombie: async (roomId, playerId, location) => { ... }
  // searchLocation: async (roomId, playerId, location) => { ... }
};