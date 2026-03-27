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
  const isHost = room.players?.find(p => p.id === user.id)?.isHost || false;
  const isPlaying = gameState?.status === 'playing';

  const handleStartGame = () => {
    GameActions.startGame(room);
  };

  if (!isPlaying || !gameState) {
    return (
      <LobbyScreen 
        room={room} 
        user={user} 
        isHost={isHost} 
        onStartGame={handleStartGame} 
        onLeave={onLeave} 
      />
    );
  }

  return (
    <BoardScreen 
      gameState={gameState}
      user={user}
      room={room}
      onLeave={onLeave}
    />
  );
}