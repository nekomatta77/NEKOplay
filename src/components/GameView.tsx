import React, { useEffect, useRef } from 'react';
import { Room, User } from '../types';
import { X } from 'lucide-react';
import { ref, update, onValue, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';

interface GameViewProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export default function GameView({ room, user, onLeave }: GameViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'game_action') {
        await set(ref(db, `rooms/${room.id}/lastAction`), {
          senderId: user.id,
          action: event.data.action,
          timestamp: Date.now()
        });
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

  const handleLeaveGame = async () => {
    const updatedPlayers = room.players?.filter(p => p.id !== user.id) || [];
    const isHost = room.players?.find(p => p.id === user.id)?.isHost;
    
    // Если хост или последний игрок выходит из игры — закрываем комнату
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

  const getGameUrl = () => {
    switch (room.gameType) {
      case 'tictactoe': return '/games/tictactoe/tictac.html';
      case 'brawl': return '/games/brawl/brawl.html';
      case 'godot_run': return '/games/godot_run/godot_index.html';
      default: return '/games/tictactoe/tictac.html';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-bold">{room.name}</h2>
          <span className="text-zinc-500 text-sm">
            Игроков: {room.players?.length || 0} / {room.maxPlayers}
          </span>
        </div>
        <button 
          onClick={handleLeaveGame}
          className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm"
        >
          <X className="w-4 h-4" />
          Покинуть игру
        </button>
      </div>
      
      <div className="flex-1 w-full bg-zinc-950 relative">
        <iframe
          ref={iframeRef}
          src={getGameUrl()}
          className="absolute inset-0 w-full h-full border-0"
          title="Game Window"
          allow="autoplay; fullscreen; microphone"
        />
      </div>
    </div>
  );
}