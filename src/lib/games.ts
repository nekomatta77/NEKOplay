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
    id: 'connect4',
    name: 'Четыре в ряд',
    description: 'Бросай фишки и собери 4 в ряд быстрее соперника.',
    image: 'https://picsum.photos/seed/connect4/400/300?blur=2',
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: 'neko_cards',
    name: 'NEKO Карты (Скоро)',
    description: 'Карточная игра для большой компании. Избавься от карт первым!',
    image: 'https://picsum.photos/seed/cards/400/300?blur=2',
    minPlayers: 2,
    maxPlayers: 8,
  }
];
