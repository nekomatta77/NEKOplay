// src/App.tsx
import React, { useState, useEffect, Suspense } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Lobby } from './components/Lobby';
import LoadingScreen from './components/LoadingScreen';
import { User, Room } from './types';
import { ref, onValue } from 'firebase/database';
import { db } from './lib/firebase';

const GameView = React.lazy(() => {
  return Promise.all([
    import('./components/GameView'),
    new Promise(resolve => setTimeout(resolve, 1500))
  ]).then(([module]) => module);
});

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nekoplay_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // ИСПРАВЛЕНО 1: Восстанавливаем ID комнаты при перезагрузке
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return localStorage.getItem('nekoplay_room_id') || null;
  });
  
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!currentRoomId) {
      setCurrentRoom(null);
      localStorage.removeItem('nekoplay_room_id');
      return;
    }

    const roomRef = ref(db, `rooms/${currentRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (roomData) {
        setCurrentRoom(roomData);
      } else {
        // Если комната удалена - сбрасываем стейт и хранилище
        setCurrentRoomId(null);
        setCurrentRoom(null);
        localStorage.removeItem('nekoplay_room_id');
      }
    });

    return () => unsubscribe();
  }, [currentRoomId]);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (currentRoom) {
    if (currentRoom.status === 'playing') {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <GameView room={currentRoom} user={user} onLeave={() => setCurrentRoomId(null)} />
        </Suspense>
      );
    }
    return <Lobby room={currentRoom} user={user} onLeave={() => setCurrentRoomId(null)} />;
  }

  const handleJoin = (room: Room) => {
    localStorage.setItem('nekoplay_room_id', room.id);
    setCurrentRoomId(room.id);
  };

  return <Dashboard user={user} onJoinRoom={handleJoin} />;
}