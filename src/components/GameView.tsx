import React, { useEffect, useRef, useState } from 'react';
import { Room, User } from '../types';
import { ref, update, onValue, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import DeadOfWinterGame from '../games/DeadOfWinter/DeadOfWinterGame';
import FlappyNekoGame from '@/src/games/FlappyNeko/FlappyNekoGame';
import NekoStackGame from '@/src/games/StacksNeko/NekoStackGame';
import PixelRopeGame from '../games/PixelRope/PixelRopeGame'; // Импортируем нашу игру

interface GameViewProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export default function GameView({ room, user, onLeave }: GameViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const pendingState = useRef<any>(null);
  const [reactGameState, setReactGameState] = useState<any>(null);

  const handleLeaveGame = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(console.error);
    }
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
    const updateActivity = () => update(ref(db, `rooms/${room.id}`), { lastActive: Date.now() }).catch(() => {});
    updateActivity(); 
    const activityInterval = setInterval(updateActivity, 60000); 
    return () => clearInterval(activityInterval);
  }, [room.id]);

  useEffect(() => {
    // Добавлено исключение pixelrope для предотвращения выполнения логики iframe
    if (room.gameType === 'deadofwinter' || room.gameType === 'flappyneko' || room.gameType === 'nekostack' || room.gameType === 'pixelrope') return; 

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'request_fullscreen') {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); }
      }
      if (event.data?.type === 'start_game') {
        const gamePlayers = room.players || [];
        const playerNames = gamePlayers.reduce((acc: any, p) => ({...acc, [p.id]: p.name}), {});
        const playerAvatars = gamePlayers.reduce((acc: any, p) => ({...acc, [p.id]: p.avatar}), {});

        await update(ref(db, `rooms/${room.id}/gameState`), {
          status: 'playing', round: 1, totalRounds: gamePlayers.length > 0 ? gamePlayers.length : 2,
          players: gamePlayers.map(p => p.id), playerNames: playerNames, playerAvatars: playerAvatars,
          settings: event.data.settings || { mode: 'classic', time: 90 }, submissions: null 
        });
      }
      if (event.data?.type === 'play_again') {
        const updates: any = {}; updates[`rooms/${room.id}/gameState`] = null; updates[`rooms/${room.id}/status`] = 'waiting'; 
        await update(ref(db), updates);
      }
      if (event.data?.type === 'game_action') {
        await set(ref(db, `rooms/${room.id}/lastAction`), { senderId: user.id, action: event.data.action, timestamp: Date.now() });
      }
      if (event.data?.type === 'update_state' && event.data.updates) {
        await update(ref(db, `rooms/${room.id}/gameState`), event.data.updates);
      }
      if (event.data?.type === 'leave_game') { handleLeaveGame(); }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [room.id, user.id, room.players, room.gameType]);

  useEffect(() => {
    const stateRef = ref(db, `rooms/${room.id}/gameState`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const state = snapshot.val() || {};
      pendingState.current = state; 
      setReactGameState(state);
      
      // Исключаем отправку postMessage в iframe для pixelrope
      if (
        isIframeLoaded && 
        iframeRef.current?.contentWindow && 
        room.gameType !== 'deadofwinter' && 
        room.gameType !== 'flappyneko' &&
        room.gameType !== 'nekostack' &&
        room.gameType !== 'pixelrope'
      ) {
        iframeRef.current.contentWindow.postMessage({ type: 'sync_state', state: state, roomPlayers: room.players }, '*');
      }
    });
    return () => unsubscribe();
  }, [room.id, room.players, isIframeLoaded, room.gameType]);

  useEffect(() => {
    // Добавлено исключение pixelrope для экшенов
    if (room.gameType === 'deadofwinter' || room.gameType === 'flappyneko' || room.gameType === 'nekostack' || room.gameType === 'pixelrope') return;
    const actionRef = ref(db, `rooms/${room.id}/lastAction`);
    const unsubscribe = onValue(actionRef, (snapshot) => {
      const actionData = snapshot.val();
      if (isIframeLoaded && actionData && actionData.senderId !== user.id && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'game_action', action: actionData.action }, '*');
      }
    });
    return () => unsubscribe();
  }, [room.id, user.id, isIframeLoaded, room.gameType]);

  // Секция рендеринга встроенных React-компонентов игр
  if (room.gameType === 'deadofwinter') {
    return <DeadOfWinterGame room={room} user={user} gameState={reactGameState} onLeave={handleLeaveGame} />;
  }
  if (room.gameType === 'flappyneko') {
    return <FlappyNekoGame room={room} user={user} gameState={reactGameState} onLeave={handleLeaveGame} />;
  }
  if (room.gameType === 'nekostack') {
    return <NekoStackGame room={room} user={user} gameState={reactGameState} onLeave={handleLeaveGame} />;
  }
  
  // Добавляем рендеринг PixelRope
  if (room.gameType === 'pixelrope') {
    return <PixelRopeGame room={room} user={user} gameState={reactGameState} onLeave={handleLeaveGame} />;
  }

  const getGameUrl = () => {
    const playersCount = room.players?.length || 2;
    const isHost = room.players?.find(p => p.id === user.id)?.isHost || false;
    const gameId = room.gameType || 'tictactoe'; 
    const fileName = gameId === 'tictactoe' ? 'tictac.html' : 'index.html';
    return `/games/${gameId}/${fileName}?players=${playersCount}&name=${encodeURIComponent(user.name)}&userId=${user.id}&isHost=${isHost}`;
  };

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (pendingState.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'sync_state', state: pendingState.current, roomPlayers: room.players }, '*');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <iframe ref={iframeRef} onLoad={handleIframeLoad} src={getGameUrl()} className="w-full h-full border-0 block" title="Game Window" allow="autoplay; fullscreen; microphone" />
    </div>
  );
}