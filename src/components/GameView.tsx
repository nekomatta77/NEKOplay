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

  // Обработка выхода из игры
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
      // 1. Игровые действия (крестики, прыжки и т.д.)
      if (event.data?.type === 'game_action') {
        await set(ref(db, `rooms/${room.id}/lastAction`), {
          senderId: user.id,
          action: event.data.action,
          timestamp: Date.now()
        });
      }
      
      // 2. НОВОЕ: Если сама игра просит нас закрыть её
      if (event.data?.type === 'leave_game') {
        handleLeaveGame();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [room.id, user.id]);

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
    return `/games/tictactoe/tictac.html?players=${playersCount}&name=${encodeURIComponent(user.name)}`;
  };

  // ТЕПЕРЬ ТУТ ТОЛЬКО IFRAME НА ВЕСЬ ЭКРАН! Никаких шапок!
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