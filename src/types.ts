// src/types.ts

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Player extends User {
  socketId: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  players: Player[];
  status: "waiting" | "playing";
  lastActive?: number; // Поле для отслеживания АФК-комнат
}

export interface Game {
  id: string;
  name: string;
  description: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
}