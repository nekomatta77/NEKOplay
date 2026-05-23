// src/lib/games.ts
import { Game } from '../types';

export const GAMES: Game[] = [
  {
    id: 'flappyneko',
    name: 'Флэппи Птичка',
    description: 'Кроссплатформенный мультиплеерный заезд! Летите одновременно с 20 игроками, уворачивайтесь от труб. После падения вы становитесь призраком и продолжаете полет!',
    image: 'https://picsum.photos/seed/flappyneko/400/300?blur=1',
    minPlayers: 1, 
    maxPlayers: 20,
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
    id: 'deadofwinter', 
    name: 'Мертвые сезоны',
    description: 'Сложная кооперативная игра на выживание с предателем. Собирайте ресурсы, убивайте зомби и не дайте колонии пасть!',
    image: 'https://picsum.photos/seed/deadofwinter/400/300?blur=2',
    minPlayers: 2, 
    maxPlayers: 5,
  },
  {
    id: 'nekostack',
    name: 'NEKO Stack',
    description: 'Строительный онлайн-баттл на устойчивость! Сбрасывайте раскачивающиеся модерн-домики друг на друга по очереди. Удерживайте идеальный баланс башни и не дайте её каркасу рухнуть!',
    image: 'https://picsum.photos/seed/nekostack/400/300?blur=2',
    minPlayers: 1,
    maxPlayers: 10,
  },
];