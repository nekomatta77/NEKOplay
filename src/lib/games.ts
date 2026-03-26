// src/lib/games.ts
import { Game } from '../types';

export const GAMES: Game[] = [
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
    id: 'quiplash', 
    name: 'Смехлыст',
    description: 'Битва шуток! Придумай самый смешной ответ на каверзный вопрос. Нейросеть генерирует уникальные вопросы каждую игру!',
    image: 'https://picsum.photos/seed/quiplash/400/300?blur=2',
    minPlayers: 3, // Минимум 3, чтобы было кому голосовать
    maxPlayers: 8,
  }
];