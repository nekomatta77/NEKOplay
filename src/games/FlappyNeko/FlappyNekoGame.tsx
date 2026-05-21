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
  const isHost = room.players?.find((p: any) => p.id === user.id)?.isHost || false;

  const myCatRef = useRef({
    y: 300,
    velocity: 0,
    isGhost: false,
    score: 0,
    rotation: 0
  });

  // Хранилище сглаженных координат других игроков для интерполяции
  const interpolatedPlayersRef = useRef<Record<string, number>>({});

  // Физические коэффициенты оригинальной Flappy Bird
  const GRAVITY = 0.35;
  const JUMP_FORCE = -7.0;
  const CAT_RADIUS = 16;
  const PIPE_WIDTH = 68;
  const PIPE_GAP = 150;
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 640;
  const X_POSITION = 160; // Фиксированная позиция игроков по оси X

  const gameStatus = gameState?.status || 'waiting';
  const pipes = gameState?.pipes || [];
  const networkPlayers = gameState?.players || {};

  useEffect(() => {
    const playerGameRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
    update(playerGameRef, {
      name: user.name,
      y: 300,
      isGhost: false,
      score: 0
    });
  }, [room.id, user.id, user.name]);

  const handleJump = () => {
    if (gameStatus !== 'playing' || myCatRef.current.isGhost) return;
    myCatRef.current.velocity = JUMP_FORCE;
    myCatRef.current.rotation = -0.4; // Наклоняем кота вверх при прыжке
    
    const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
    update(myRef, { y: Math.floor(myCatRef.current.y) });
  };

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

  const handleStartGame = async () => {
    const startRef = ref(db, `rooms/${room.id}/gameState`);
    await update(startRef, {
      status: 'playing',
      pipes: [],
      startTime: Date.now()
    });
  };

  // ДВИЖОК ХОСТА: Работает на независимом таймере Delta Time
  useEffect(() => {
    if (!isHost || gameStatus !== 'playing') return;

    let lastTime = performance.now();
    let pipeSpeed = 3.2;

    const hostTicker = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTime) / (1000 / 60); // Нормализация под 60 FPS
      lastTime = now;

      if (dt > 3) return; // Игнорируем сильные скачки лагов

      const stateRef = ref(db, `rooms/${room.id}/gameState`);
      let currentPipes = [...pipes];

      if (currentPipes.length === 0 || currentPipes[currentPipes.length - 1].x < CANVAS_WIDTH - 240) {
        const topHeight = Math.floor(Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 160)) + 80;
        currentPipes.push({ x: CANVAS_WIDTH, top: topHeight });
      }

      let nextPipes = currentPipes
        .map(p => ({ ...p, x: p.x - pipeSpeed * dt }))
        .filter(p => p.x > -PIPE_WIDTH);

      // Проверка набора очков при пролете центра трубы
      currentPipes.forEach(p => {
        if (p.x >= X_POSITION && p.x - pipeSpeed * dt < X_POSITION) {
          Object.keys(networkPlayers).forEach(pId => {
            if (!networkPlayers[pId].isGhost) {
              const pRef = ref(db, `rooms/${room.id}/gameState/players/${pId}`);
              update(pRef, { score: (networkPlayers[pId].score || 0) + 1 });
            }
          });
        }
      });

      update(stateRef, { pipes: nextPipes });
    }, 1000 / 60);

    return () => clearInterval(hostTicker);
  }, [isHost, gameStatus, pipes, networkPlayers, room.id]);

  // КЛИЕНТСКИЙ ЦИКЛ РЕНДЕРА И ИНТЕРПОЛЯЦИИ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = () => {
      const now = performance.now();
      const dt = (now - lastTime) / (1000 / 60);
      lastTime = now;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Отрисовка бэкграунда (Неоновое ночное небо)
      ctx.fillStyle = '#111216';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Сетка на фоне для ощущения скорости
      ctx.strokeStyle = '#1d2026';
      ctx.lineWidth = 1;
      for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
      }

      if (gameStatus === 'playing') {
        // Расчет физики локального кота
        myCatRef.current.velocity += GRAVITY * dt;
        myCatRef.current.y += myCatRef.current.velocity * dt;

        // Плавное вращение носом вниз при падении
        if (myCatRef.current.velocity > 3) {
          myCatRef.current.rotation = Math.min(Math.PI / 2, myCatRef.current.rotation + 0.08 * dt);
        } else {
          myCatRef.current.rotation = Math.max(-0.4, myCatRef.current.rotation + 0.02 * dt);
        }

        if (myCatRef.current.y > CANVAS_HEIGHT - CAT_RADIUS) {
          myCatRef.current.y = CANVAS_HEIGHT - CAT_RADIUS;
          myCatRef.current.velocity = 0;
        }
        if (myCatRef.current.y < CAT_RADIUS) {
          myCatRef.current.y = CAT_RADIUS;
          myCatRef.current.velocity = 0;
        }

        // Сетевой троттлинг позиции Y
        if (Math.random() < 0.2) {
          const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
          update(myRef, { y: Math.floor(myCatRef.current.y) });
        }

        // Проверка точных коллизий
        const serverMe = networkPlayers[user.id];
        if (serverMe && !serverMe.isGhost) {
          myCatRef.current.isGhost = false;
          
          for (let p of pipes) {
            const insideX = (X_POSITION + CAT_RADIUS - 3 > p.x) && (X_POSITION - CAT_RADIUS + 3 < p.x + PIPE_WIDTH);
            const hitTop = myCatRef.current.y - CAT_RADIUS + 3 < p.top;
            const hitBottom = myCatRef.current.y + CAT_RADIUS - 3 > p.top + PIPE_GAP;

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

      // ОТРИСОВКА ТРУБ (Скругленный неоновый стиль)
      pipes.forEach((p: any) => {
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;

        // Верхняя труба
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.top);

        // Нижная труба
        ctx.fillRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - p.top - PIPE_GAP);
        ctx.strokeRect(p.x, p.top + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - p.top - PIPE_GAP);
      });

      // ОТРИСОВКА И ИНТЕРПОЛЯЦИЯ ИГРОКОВ
      Object.keys(networkPlayers).forEach(pId => {
        const p = networkPlayers[pId];
        const isMe = pId === user.id;

        // Алгоритм LERP (Линейная интерполяция) для сглаживания лагов сети
        if (!isMe) {
          if (interpolatedPlayersRef.current[pId] === undefined) {
            interpolatedPlayersRef.current[pId] = p.y || 300;
          }
          // Плавно подтягиваем координату на 15% ближе к серверной каждую итерацию
          interpolatedPlayersRef.current[pId] += ((p.y || 300) - interpolatedPlayersRef.current[pId]) * 0.15 * dt;
        }

        const drawY = isMe ? myCatRef.current.y : interpolatedPlayersRef.current[pId];
        const currentRotation = isMe ? myCatRef.current.rotation : (p.y > drawY ? 0.4 : -0.2);

        ctx.save();
        ctx.translate(X_POSITION, drawY);
        ctx.rotate(currentRotation);

        if (p.isGhost) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#9ca3af';
        } else {
          ctx.fillStyle = isMe ? '#2563eb' : '#d97706';
          ctx.strokeStyle = isMe ? '#3b82f6' : '#f59e0b';
          ctx.lineWidth = 2;
        }

        // Рисуем птицу-кота
        ctx.beginPath();
        ctx.arc(0, 0, CAT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        if (!p.isGhost) ctx.stroke();

        // Глаз направления полета
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(6, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(7, -4, 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        // Никнейм пишем без учета вращения матрицы
        ctx.save();
        ctx.fillStyle = isMe ? '#60a5fa' : '#fbbf24';
        ctx.font = 'bold 12px font-sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.name || 'Кот'} (${p.score || 0})`, X_POSITION, drawY - 24);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, pipes, networkPlayers, room.id, user.id]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleJump();
  };

  const handleStartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleStartGame();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center select-none text-white font-sans z-50">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-slate-900/90 backdrop-blur px-5 py-3 rounded-2xl max-w-md mx-auto border border-slate-800 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Режим</span>
          <span className={`text-sm font-black ${networkPlayers[user.id]?.isGhost ? 'text-slate-400' : 'text-emerald-400'}`}>
            {networkPlayers[user.id]?.isGhost ? '👻 ПРИЗРАК ПОЛЕТА' : '🐱 ЖИВОЙ КОТ'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Счет комнат</span>
          <span className="text-xl font-black text-amber-400 animate-pulse">{networkPlayers[user.id]?.score || 0}</span>
        </div>
      </div>

      <div 
        onClick={handleJump}
        onTouchStart={handleTouchStart}
        className="relative border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl bg-slate-950"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />

        {gameStatus === 'waiting' && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30 mb-4 animate-bounce">
              <span className="text-2xl">🐱</span>
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Flappy NEKO Engine
            </h2>
            <p className="text-xs text-slate-400 mb-8 max-w-xs leading-relaxed">
              Мультиплеерная физическая синхронизация. Управляйте высотой кликом, тапом или Пробелом. Выжившие получают очки за каждую трубу.
            </p>

            {isHost ? (
              <button
                onClick={handleStartClick}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all text-white px-10 py-3.5 rounded-2xl font-extrabold text-base shadow-lg shadow-blue-900/30 border border-blue-400/20"
              >
                ЗАПУСТИТЬ СИНХРОНИЗАЦИЮ
              </button>
            ) : (
              <div className="flex items-center space-x-3 bg-slate-900/80 px-5 py-2.5 rounded-xl border border-slate-800">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                <span className="text-xs text-slate-400 font-bold tracking-wide">Хост подготавливает шлюз...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onLeave}
        className="mt-5 px-6 py-2.5 bg-slate-900 hover:bg-rose-950/50 hover:text-rose-400 text-slate-500 border border-slate-800 hover:border-rose-900/30 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95"
      >
        ВЫЙТИ ИЗ ИГРЫ
      </button>
    </div>
  );
}