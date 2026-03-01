import React, { useEffect, useRef } from 'react';
import { Room, User } from '../types';
import { ref, update, onValue, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';

interface GameViewProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export default function GameView({ room, user, onLeave }: GameViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLeaveGame = async () => {
    const updatedPlayers = room.players?.filter(p => p.id !== user.id) || [];
    const isHost = room.players?.find(p => p.id === user.id)?.isHost;
    
    if (isHost || updatedPlayers.length === 0) {
      await remove(ref(db, `rooms/${room.id}`));
    } else {
      await update(ref(db, `rooms/${room.id}`), { 
        players: updatedPlayers,
        status: 'waiting' 
      });
    }
    onLeave();
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // 1. НАДЕЖНЫЙ СТАРТ: Передаем аватарки и настройки режима
      if (event.data?.type === 'start_game') {
        const gamePlayers = room.players || [];
        const playerNames = gamePlayers.reduce((acc, p) => ({...acc, [p.id]: p.name}), {});
        const playerAvatars = gamePlayers.reduce((acc, p) => ({...acc, [p.id]: p.avatar}), {});

        await update(ref(db, `rooms/${room.id}/gameState`), {
          status: 'playing',
          round: 1,
          totalRounds: gamePlayers.length > 0 ? gamePlayers.length : 2,
          players: gamePlayers.map(p => p.id),
          playerNames: playerNames,
          playerAvatars: playerAvatars, // ДОБАВЛЕНО: Аватарки для финала
          settings: event.data.settings || { mode: 'classic', time: 90 }, // ДОБАВЛЕНО: Режимы
          submissions: null // Очищаем историю при новом старте
        });
      }

      // 2. Игровые действия Tictactoe
      if (event.data?.type === 'game_action') {
        await set(ref(db, `rooms/${room.id}/lastAction`), {
          senderId: user.id,
          action: event.data.action,
          timestamp: Date.now()
        });
      }
      
      // 3. Обновления Drawphone
      if (event.data?.type === 'update_state' && event.data.updates) {
        await update(ref(db, `rooms/${room.id}/gameState`), event.data.updates);
      }
      
      if (event.data?.type === 'leave_game') {
        handleLeaveGame();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [room.id, user.id, room.players]);

  // Синхронизация gameState
  useEffect(() => {
    const stateRef = ref(db, `rooms/${room.id}/gameState`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const state = snapshot.val() || {};
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'sync_state',
          state: state
        }, '*');
      }
    });
    return () => unsubscribe();
  }, [room.id]);

  // Синхронизация lastAction (Крестики-нолики)
  useEffect(() => {
    const actionRef = ref(db, `rooms/${room.id}/lastAction`);
    const unsubscribe = onValue(actionRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.senderId !== user.id) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'game_action',
            action: data.action
          }, '*');
        }
      }
    });
    return () => unsubscribe();
  }, [room.id, user.id]);

  const getGameUrl = () => {
    const playersCount = room.players?.length || 2;
    const isHost = room.players?.find(p => p.id === user.id)?.isHost || false;
    const gameId = room.gameType || 'tictactoe'; 
    const fileName = gameId === 'tictactoe' ? 'tictac.html' : 'index.html';
    
    return `/games/${gameId}/${fileName}?players=${playersCount}&name=${encodeURIComponent(user.name)}&userId=${user.id}&isHost=${isHost}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <iframe
        ref={iframeRef}
        src={getGameUrl()}
        className="w-full h-full border-0 block"
        title="Game Window"
        allow="autoplay; fullscreen; microphone"
      />
    </div>
  );
}