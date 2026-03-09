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
    id: 'bunker', 
    name: 'Бункер',
    description: 'Постапокалиптическая игра на выживание. Докажи, что ты достоин места в бункере!',
    image: 'https://picsum.photos/seed/bunker/400/300?blur=2',
    minPlayers: 3,
    maxPlayers: 16,
  },

  {
    id: 'jokebattle', 
    name: 'Смехлыст',
    description: 'Хлесткие шутки, коварные вопросы и голосования! Кто в вашей компании самый остроумный?',
    image: 'https://picsum.photos/seed/smekhlyst/400/300?blur=2',
    minPlayers: 3,
    maxPlayers: 16,
  }
];