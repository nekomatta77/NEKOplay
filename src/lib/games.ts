// src/lib/games.ts
import { Game } from '../types';

export const GAMES: Game[] = [
  {
    id: 'pixelrope',
    name: 'Перелетики',
    description: 'Динамичная гонка на кошках-зацепах! Цепляйся за качающиеся неоновые платформы, рассчитывай инерцию и приди к финишу первым, оставив друзей позади.',
    image: 'https://picsum.photos/seed/pixelrope/400/300?blur=1',
    minPlayers: 1, 
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
    id: 'quiplash', 
    name: 'Смехлыст',
    description: 'Битва шуток! Придумай самый смешной ответ на каверзный вопрос. Нейросеть генерирует уникальные вопросы каждую игру!',
    image: 'https://picsum.photos/seed/quiplash/400/300?blur=2',
    minPlayers: 3, 
    maxPlayers: 8,
  },
  {
    id: 'castlequiz', 
    name: 'Битва Умов',
    description: 'Стратегическая викторина с захватом замков. Выберите любую тему, и нейросеть сгенерирует уникальные вопросы для вашей битвы!',
    image: 'https://picsum.photos/seed/castlequiz/400/300?blur=2', 
    minPlayers: 2, 
    maxPlayers: 4,
  }
];