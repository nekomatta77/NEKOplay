import React, { useState, useEffect, Suspense } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Lobby } from './components/Lobby';
import LoadingScreen from './components/LoadingScreen';
import { User, Room } from './types';
import { ref, onValue } from 'firebase/database';
import { db } from './lib/firebase';

// Бронебойный ленивый импорт с защитой от кэша Vercel
const GameView = React.lazy(() => {
  return Promise.all([
    import('./components/GameView').catch((error) => {
      console.warn('Обнаружена новая версия приложения. Сбрасываем кэш...', error);
      // Если файл чанка удален с сервера (Vercel обновил билд), 
      // принудительно перезагружаем страницу у пользователя.
      window.location.reload(); 
      return { default: () => <LoadingScreen /> }; // Возвращаем заглушку, пока идет релоад
    }),
    new Promise(resolve => setTimeout(resolve, 1500))
  ]).then(([module]) => module as any);
});

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nekoplay_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // ИСПРАВЛЕНО: Больше никаких авто-забросов в комнату при обновлении страницы.
  // Теперь все контролируется через Dashboard.
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!currentRoomId) {
      setCurrentRoom(null);
      return;
    }

    const roomRef = ref(db, `rooms/${currentRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (roomData) {
        setCurrentRoom(roomData);
      } else {
        // Комната удалена (хост вышел)
        setCurrentRoomId(null);
        setCurrentRoom(null);
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

  return <Dashboard user={user} onJoinRoom={(room) => setCurrentRoomId(room.id)} />;
}