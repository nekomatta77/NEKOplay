import React, { useState, useEffect, Suspense } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Lobby } from './components/Lobby';
import LoadingScreen from './components/LoadingScreen';
import { User, Room } from './types';
import { socket } from './lib/socket';

// Lazy load the GameView with an artificial delay to show the beautiful loading screen
const GameView = React.lazy(() => {
  return Promise.all([
    import('./components/GameView'),
    new Promise(resolve => setTimeout(resolve, 1500))
  ]).then(([module]) => module);
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (user) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleRoomUpdated = (room: Room) => {
      setCurrentRoom(room);
    };

    const handleGameStarted = (room: Room) => {
      setCurrentRoom(room);
    };

    const handleError = (error: { message: string }) => {
      alert(error.message);
    };

    socket.on('room_updated', handleRoomUpdated);
    socket.on('game_started', handleGameStarted);
    socket.on('error', handleError);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
      socket.off('game_started', handleGameStarted);
      socket.off('error', handleError);
    };
  }, []);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (currentRoom) {
    if (currentRoom.status === 'playing') {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <GameView
            room={currentRoom}
            user={user}
            onLeave={() => setCurrentRoom(null)}
          />
        </Suspense>
      );
    }
    
    return (
      <Lobby
        room={currentRoom}
        user={user}
        onLeave={() => setCurrentRoom(null)}
      />
    );
  }

  return <Dashboard user={user} onJoinRoom={setCurrentRoom} />;
}

