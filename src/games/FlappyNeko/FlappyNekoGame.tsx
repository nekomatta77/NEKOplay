import React, { useEffect, useRef } from 'react';
import { Room, User } from '../../types';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';

interface FlappyNekoGameProps {
  room: Room;
  user: User;
  gameState: any;
  onLeave: () => void;
}

export default function FlappyNekoGame({ room, user, gameState, onLeave }: FlappyNekoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Определяем, является ли локальный пользователь создателем (хостом) комнаты
  const isHost = room.players?.find((p: any) => p.id === user.id)?.isHost || false;

  // Локальные физические параметры птицы (кота) текущего игрока
  const myCatRef = useRef({
    y: 300,
    velocity: 0,
    isGhost: false,
    score: 0
  });

  // Константы физического движка игры
  const GRAVITY = 0.24;
  const JUMP_FORCE = -5.2;
  const CAT_RADIUS = 15;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 145;
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 600;

  // Извлекаем безопасный статус игры, список труб и игроков из Firebase gameState
  const gameStatus = gameState?.status || 'waiting';
  const pipes = gameState?.pipes || [];
  const networkPlayers = gameState?.players || {};

  // Инициализируем запись текущего игрока в структуре комнаты при первой загрузке компонента
  useEffect(() => {
    const playerGameRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
    update(playerGameRef, {
      name: user.name,
      y: 300,
      isGhost: false,
      score: 0
    });
  }, [room.id, user.id, user.name]);

  // Обработчик импульса прыжка (вызывается при тапе, клике или нажатии Пробела)
  const handleJump = () => {
    if (gameStatus !== 'playing' || myCatRef.current.isGhost) return;
    myCatRef.current.velocity = JUMP_FORCE;
    
    // Мгновенно пушим новую скорость в Firebase для синхронизации анимации прыжка
    const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
    update(myRef, { y: myCatRef.current.y });
  };

  // Слушатель клавиатуры на Пробел
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  // Функция старта игры (доступна только хосту)
  const handleStartGame = async () => {
    const startRef = ref(db, `rooms/${room.id}/gameState`);
    await update(startRef, {
      status: 'playing',
      pipes: [],
      startTime: Date.now()
    });
  };

  // СЕРВЕРНАЯ ЛОГИКА ХОСТА: Generation и продвижение труб по таймеру
  useEffect(() => {
    if (!isHost || gameStatus !== 'playing') return;

    const hostInterval = setInterval(() => {
      const stateRef = ref(db, `rooms/${room.id}/gameState`);
      let currentPipes = [...pipes];

      // Если труб нет или крайняя правая труба отдалилась — генерируем новую
      if (currentPipes.length === 0 || currentPipes[currentPipes.length - 1].x < CANVAS_WIDTH - 220) {
        const topHeight = Math.floor(Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 120)) + 60;
        currentPipes.push({ x: CANVAS_WIDTH, top: topHeight });
      }

      // Сдвигаем трубы влево на 3 пикселя и фильтруем вышедшие за экран
      let nextPipes = currentPipes
        .map(p => ({ ...p, x: p.x - 3 }))
        .filter(p => p.x > -PIPE_WIDTH);

      // Если труба успешно пересекла черту кота (x=200), начисляем выжившим очки
      if (nextPipes.length < currentPipes.length) {
        Object.keys(networkPlayers).forEach(pId => {
          if (!networkPlayers[pId].isGhost) {
            const pRef = ref(db, `rooms/${room.id}/gameState/players/${pId}`);
            update(pRef, { score: (networkPlayers[pId].score || 0) + 1 });
          }
        });
      }

      update(stateRef, { pipes: nextPipes });
    }, 1000 / 60); // 60 тиков в секунду для плавной физики

    return () => clearInterval(hostInterval);
  }, [isHost, gameStatus, pipes, networkPlayers, room.id]);

  // ОСНОВНОЙ ЦИКЛ КЛИЕНТСКОГО РЕНДЕРА (requestAnimationFrame)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Фон игрового Canvas
      ctx.fillStyle = '#1e1e24';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Слой симуляции локальной гравитации
      if (gameStatus === 'playing') {
        myCatRef.current.velocity += GRAVITY;
        myCatRef.current.y += myCatRef.current.velocity;

        // Валидация выхода за рамки экрана
        if (myCatRef.current.y > CANVAS_HEIGHT - CAT_RADIUS) {
          myCatRef.current.y = CANVAS_HEIGHT - CAT_RADIUS;
          myCatRef.current.velocity = 0;
        }
        if (myCatRef.current.y < CAT_RADIUS) {
          myCatRef.current.y = CAT_RADIUS;
          myCatRef.current.velocity = 0;
        }

        // Синхронизируем локальную координату Y в сеть
        if (Math.random() < 0.25) {
          const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
          update(myRef, { y: Math.floor(myCatRef.current.y) });
        }

        // Проверка коллизий локального игрока с трубами
        const serverMe = networkPlayers[user.id];
        if (serverMe && !serverMe.isGhost) {
          myCatRef.current.isGhost = false;
          
          for (let p of pipes) {
            const insideX = (200 + CAT_RADIUS > p.x) && (200 - CAT_RADIUS < p.x + PIPE_WIDTH);
            const hitTop = myCatRef.current.y - CAT_RADIUS < p.top;
            const hitBottom = myCatRef.current.y + CAT_RADIUS > p.top + PIPE_GAP;

            if (insideX && (hitTop || hitBottom)) {
              myCatRef.current.isGhost = true;
              const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
              update(myRef, { isGhost: true });
              break;
            }
          }
        } else if (serverMe?.isGhost) {
          myCatRef.current.isGhost = true;
        }
      }

      // Отрисовка труб зеленого цвета
      ctx.fillStyle = '#10b981';
      pipes.forEach((p: any) => {
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - p.top - PIPE_GAP);
      });

      // Отрисовка всех игроков из Firebase
      Object.keys(networkPlayers).forEach(pId => {
        const p = networkPlayers[pId];
        const isMe = pId === user.id;
        const drawY = isMe ? myCatRef.current.y : (p.y || 300);

        ctx.save();
        if (p.isGhost) {
          ctx.globalAlpha = 0.35; // Призраки полупрозрачные
          ctx.fillStyle = '#e5e7eb';
        } else {
          ctx.fillStyle = isMe ? '#3b82f6' : '#f59e0b'; // Синий — я, Желтый — соперники
        }

        // Рисуем тело круглого кота
        ctx.beginPath();
        ctx.arc(200, drawY, CAT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Отрисовка никнейма и очков над каждым персонажем
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.name || 'Кот'} (${p.score || 0})`, 200, drawY - 20);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, pipes, networkPlayers, room.id, user.id]);

  // Типизированные ивенты для предотвращения ошибок TS
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleJump();
  };

  const handleStartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleStartGame();
  };

  // Рендерим реактивный UI поверх Canvas с использованием Tailwind CSS
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center select-none text-white font-sans z-50">
      
      {/* Верхняя статус-панель */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-slate-800/80 backdrop-blur px-4 py-2 rounded-xl max-w-md mx-auto border border-slate-700/50">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Ваш Статус</span>
          <span className={`text-sm font-bold ${networkPlayers[user.id]?.isGhost ? 'text-slate-400' : 'text-emerald-400'}`}>
            {networkPlayers[user.id]?.isGhost ? '👻 ПРИЗРАК' : '🐱 ЖИВ'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Очки</span>
          <span className="text-lg font-black text-amber-400">{networkPlayers[user.id]?.score || 0}</span>
        </div>
      </div>

      {/* Основной контейнер Canvas */}
      <div 
        onClick={handleJump}
        onTouchStart={handleTouchStart}
        className="relative border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl cursor-pointer bg-slate-950 max-w-full"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="block w-full h-full"
        />

        {/* Экран ожидания старта */}
        {gameStatus === 'waiting' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Flappy NEKO
            </h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Нажимайте на экран, кликайте мышкой или жмите Пробел, чтобы взлетать. Не задевайте трубы!
            </p>

            {isHost ? (
              <button
                onClick={handleStartClick}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/40"
              >
                ЗАПУСТИТЬ ИГРУ
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                <span className="text-xs text-amber-400 font-semibold">Ожидание запуска хостом...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Нижняя кнопка выхода */}
      <button
        onClick={onLeave}
        className="mt-4 px-6 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-900/50 rounded-xl text-xs font-bold tracking-wide transition active:scale-95 shadow-md"
      >
        ПОКИНУТЬ КОМНАТУ
      </button>
    </div>
  );
}