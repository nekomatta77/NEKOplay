import { Game } from '../types';

export const GAMES: Game[] = [
  {
    id: 'tictactoe',
    name: 'Крестики-нолики',
    description: 'Классическая игра 3x3. Собери 3 в ряд для победы!',
    image: 'https://picsum.photos/seed/tictactoe/400/300?blur=2',
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: 'drawphone',
    name: 'Испорченный телефон',
    description: 'Рисуй и угадывай! Безумная цепочка слов и рисунков.',
    image: 'https://picsum.photos/seed/drawphone/400/300?blur=2',
    minPlayers: 2, 
    maxPlayers: 12,
  },
  {
    // Важно: id должен совпадать с названием папки в public/games/
    id: 'bunker', 
    name: 'Бункер',
    description: 'Постапокалиптическая игра на выживание. Докажи, что ты достоин места в бункере!',
    // Картинка тоже генерируется случайно, но можешь потом заменить на свою
    image: 'https://picsum.photos/seed/bunker/400/300?blur=2',
    minPlayers: 3, // Для бункера лучше минимум 3 игрока
    maxPlayers: 16, // Максимум можно поставить побольше
  }
];