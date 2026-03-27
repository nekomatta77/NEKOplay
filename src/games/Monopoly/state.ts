import { useEffect, useState } from 'react';
import { ref, onValue, update, set, get } from 'firebase/database';
import { db } from '../../lib/firebase';
import { MonopolyGameState, MonopolyPlayer } from './types';

export const useMonopolyState = (roomId: string, userId: string, userName: string, userAvatar: string) => {
  const [gameState, setGameState] = useState<MonopolyGameState | null>(null);

  useEffect(() => {
    const gameRef = ref(db, `rooms/${roomId}/monopoly`);

    // 1. При входе в комнату проверяем, существует ли игра
    get(gameRef).then((snapshot) => {
      if (!snapshot.exists()) {
        // Если игры нет, мы первый игрок (Хост) - создаем базовую структуру
        const initialState: MonopolyGameState = {
          status: 'lobby',
          players: {
            [userId]: {
              id: userId,
              name: userName,
              avatar: userAvatar,
              balance: 1500,
              position: 0,
              isReady: false,
              isHost: true,
              equippedSkins: {}
            }
          },
          turnOrder: [],
          currentTurnIndex: 0,
          properties: {},
          log: ['Лобби создано.']
        };
        set(gameRef, initialState);
      } else {
        // Если игра есть, но нас в ней нет - добавляемся как обычный игрок
        const state = snapshot.val() as MonopolyGameState;
        if (!state.players?.[userId]) {
          update(ref(db, `rooms/${roomId}/monopoly/players/${userId}`), {
            id: userId,
            name: userName,
            avatar: userAvatar,
            balance: 1500,
            position: 0,
            isReady: false,
            isHost: false,
            equippedSkins: {}
          });
        }
      }
    });

    // 2. Подписываемся на изменения в реальном времени
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    // Отписываемся при выходе
    return () => unsubscribe();
  }, [roomId, userId, userName, userAvatar]);

  // Функция переключения статуса "Готов"
  const toggleReady = () => {
    if (!gameState || !gameState.players[userId]) return;
    const currentReadyStatus = gameState.players[userId].isReady;
    update(ref(db, `rooms/${roomId}/monopoly/players/${userId}`), {
      isReady: !currentReadyStatus
    });
  };

  // Функция запуска игры (доступна только хосту)
  const startGame = () => {
    if (!gameState) return;
    const playerIds = Object.keys(gameState.players);
    // Простейшая рандомизация очереди хода
    const shuffledOrder = playerIds.sort(() => 0.5 - Math.random());
    
    update(ref(db, `rooms/${roomId}/monopoly`), {
      status: 'playing',
      turnOrder: shuffledOrder,
      currentTurnIndex: 0,
      log: [...(gameState.log || []), 'Игра началась!']
    });
  };

  return { gameState, toggleReady, startGame };
};