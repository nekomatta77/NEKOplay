// src/games/DeadOfWinter/DeadOfWinterGame.tsx
import React from 'react';
import { Room, User } from '../../types';
import { DeadOfWinterState } from './state';
import { GameActions } from './actions';
import LobbyScreen from './components/LobbyScreen';
import BoardScreen from './components/BoardScreen';

interface Props {
  room: Room;
  user: User;
  gameState: DeadOfWinterState | null;
  onLeave: () => void;
}

export default function DeadOfWinterGame({ room, user, gameState, onLeave }: Props) {
  const isPlaying = gameState?.status === 'playing';

  const handleStartGame = () => {
    GameActions.startGame(room);
  };

  // Если игра еще не началась, показываем лобби
  if (!isPlaying || !gameState) {
    return (
      <LobbyScreen 
        room={room} 
        user={user} 
        onStart={handleStartGame} // <-- Исправили название на onStart!
        onLeave={onLeave} 
      />
    );
  }

  // Если статус 'playing', показываем игровой стол
  return (
    <BoardScreen 
      gameState={gameState}
      user={user}
      room={room}
      onLeave={onLeave}
    />
  );
}