// Структура игрока в комнате
export interface MonopolyPlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  position: number;       // На какой клетке стоит (от 0 до 39)
  isReady: boolean;       // Нажал ли "Готов" в лобби
  isHost: boolean;
  equippedSkins: Record<string, string>; // ID категории -> ID скина (бренда)
}

// Состояние клетки на доске (улицы)
export interface PropertyState {
  ownerId: string | null; // Кто купил
  houses: number;         // Количество домиков (0-5, где 5 - отель)
  isMortgaged: boolean;   // Заложена ли
}

// Главный объект состояния игры в Firebase
export interface MonopolyGameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Record<string, MonopolyPlayer>;
  turnOrder: string[];    // Массив ID игроков в порядке хода
  currentTurnIndex: number; // Чей сейчас ход (индекс массива turnOrder)
  properties: Record<string, PropertyState>; // ID клетки -> Состояние
  log: string[];          // Массив строк для отображения в логе действий
}