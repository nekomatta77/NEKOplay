import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, update } from 'firebase/database';
import { db } from '@/src/lib/firebase';
import { Room, User } from '@/src/types';
import { Trophy, RotateCcw, LogOut, Zap, Users, Play } from 'lucide-react';

interface PixelRopeGameProps {
  room: Room;
  user: User;
  gameState: any;
  onLeave: () => void;
}

interface HookPlatform {
  x: number;
  y: number;
  baseX: number;
  amplitude: number;
  speed: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
}

// 12 Премиальных неоновых цветов для кастомного лобби
const COLOR_PALETTE = [
  { hex: '#00FFCC', name: 'Циан' },
  { hex: '#FF0055', name: 'Рубин' },
  { hex: '#9900FF', name: 'Аметист' },
  { hex: '#FFCC00', name: 'Янтарь' },
  { hex: '#00FF66', name: 'Неон Грин' },
  { hex: '#FF6600', name: 'Вулкан' },
  { hex: '#00CCFF', name: 'Лазурь' },
  { hex: '#FF00FF', name: 'Фуксия' },
  { hex: '#DFFF00', name: 'Лайм' },
  { hex: '#FF3333', name: 'Искра' },
  { hex: '#FBBF24', scheme: 'Золото' },
  { hex: '#E0E7FF', name: 'Плазма' },
];

export default function PixelRopeGame({ room, user, gameState, onLeave }: PixelRopeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSolo = (room.players || []).length <= 1;
  const isHost = room.players?.find(p => p.id === user.id)?.isHost;

  // Локальное состояние для соло-лобби, мультиплеер синхронизируется через Firebase
  const [localLobbyStarted, setLocalLobbyStarted] = useState(false);
  const isRaceStarted = isSolo ? localLobbyStarted : gameState?.lobbyStatus === 'started';

  const [gameStatus, setGameStatus] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [currentDistance, setCurrentDistance] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);

  const finishLine = 10000;
  const virtualWidth = 1080;
  const virtualHeight = 1920;
  const grabRadius = 550; // Радиус бесконечного зацепа

  // Текущий цвет игрока (из Firebase или дефолтный циан)
  const myColor = gameState?.playerColors?.[user.id]?.color || '#00FFCC';

  // Физика игрока
  const playerRef = useRef({
    x: 150,
    y: 700,
    vx: 14, 
    vy: -2,
    isAttached: false,
    hookIndex: -1,
    ropeLength: 0, // Динамическая длина троса без ограничений!
  });

  const cameraX = useRef(0);
  const lastFirebaseUpdate = useRef(0);
  const particles = useRef<Particle[]>([]);
  const activeTargetIndex = useRef<number>(-1);

  const hooks = useRef<HookPlatform[]>(
    Array.from({ length: 55 }, (_, i) => ({
      x: 450 + i * 220,
      y: 550 + (i % 5) * 130, 
      baseX: 450 + i * 220,
      amplitude: 45 + (i % 2) * 25,
      speed: 0.012 + (i % 3) * 0.006,
      phase: i * 0.6,
    }))
  );

  const resetLocalPlayer = () => {
    playerRef.current = {
      x: 150,
      y: 700,
      vx: 14,
      vy: -2,
      isAttached: false,
      hookIndex: -1,
      ropeLength: 0,
    };
    cameraX.current = 0;
    particles.current = [];
    activeTargetIndex.current = -1;
    setGameStatus('playing');
  };

  // Механика выбора цвета в лобби
  const handleSelectColor = (colorHex: string) => {
    if (isSolo) {
      update(ref(db, `rooms/${room.id}/gameState/playerColors/${user.id}`), { color: colorHex });
    } else {
      update(ref(db, `rooms/${room.id}/gameState/playerColors/${user.id}`), {
        color: colorHex,
        name: user.name,
        avatar: user.avatar
      });
    }
  };

  const handleStartRace = () => {
    if (isSolo) {
      setLocalLobbyStarted(true);
      resetLocalPlayer();
    } else if (isHost) {
      update(ref(db, `rooms/${room.id}/gameState`), { lobbyStatus: 'started' });
    }
  };

  const attachRope = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault();
    if (!isRaceStarted || gameStatus !== 'playing') return;
    
    const p = playerRef.current;
    if (p.isAttached) {
      p.isAttached = false;
      p.hookIndex = -1;
      return;
    }

    if (activeTargetIndex.current !== -1) {
      const hook = hooks.current[activeTargetIndex.current];
      const dx = p.x - hook.x;
      const dy = p.y - hook.y;
      
      // БЕСКОНЕЧНЫЙ КАНАТ: Длина фиксируется строго по расстоянию в момент клика
      p.ropeLength = Math.sqrt(dx * dx + dy * dy); 
      p.isAttached = true;
      p.hookIndex = activeTargetIndex.current;
    }
  };

  const detachRope = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault();
    const p = playerRef.current;
    p.isAttached = false;
    p.hookIndex = -1;
  };

  useEffect(() => {
    if (!isRaceStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    let timeCounter = 0;

    const mainLoop = (currentTime: number) => {
      let elapsed = currentTime - lastTime;
      lastTime = currentTime;

      if (elapsed > 100) elapsed = 16.66;
      const dt = elapsed / (1000 / 60);
      timeCounter += dt;

      const p = playerRef.current;

      if (gameStatus === 'playing') {
        hooks.current.forEach((hook) => {
          hook.x = hook.baseX + Math.sin(timeCounter * hook.speed + hook.phase) * hook.amplitude;
        });

        const gravity = 0.42;

        if (p.isAttached && p.hookIndex !== -1) {
          const hook = hooks.current[p.hookIndex];
          p.vy += gravity * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const dx = p.x - hook.x;
          const dy = p.y - hook.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Физика ограничений по динамическому радиусу БЕЗ ТЕЛЕПОРТАЦИЙ
          if (dist > p.ropeLength) {
            const nx = dx / dist;
            const ny = dy / dist;
            p.x = hook.x + nx * p.ropeLength;
            p.y = hook.y + ny * p.ropeLength;

            const velProj = p.vx * nx + p.vy * ny;
            if (velProj > 0) {
              p.vx -= nx * velProj * 1.08; 
              p.vy -= ny * velProj * 1.08;
            }
          }
          p.vx += 0.1 * dt; 
        } else {
          p.vy += gravity * dt;
          p.vx *= Math.pow(0.996, dt);
          p.vy *= Math.pow(0.996, dt);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }

        // Поиск таргета
        let bestIndex = -1;
        let minDist = grabRadius;
        hooks.current.forEach((hook, idx) => {
          const dx = hook.x - p.x;
          const dy = hook.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist && hook.x > p.x - 50) {
            minDist = dist;
            bestIndex = idx;
          }
        });
        activeTargetIndex.current = bestIndex;

        // Эффектные шлейф-частицы
        if (Math.random() < 0.6 * dt) {
          particles.current.push({
            x: p.x,
            y: p.y,
            size: 6 + Math.random() * 8,
            alpha: 1.0,
            color: p.isAttached ? myColor : '#6366F1'
          });
        }
        particles.current.forEach(part => {
          part.alpha -= 0.02 * dt;
          part.size *= Math.pow(0.96, dt);
        });
        particles.current = particles.current.filter(part => part.alpha > 0);

        setSpeedKmh(Math.floor(Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 4.5));

        if (p.x >= finishLine) setGameStatus('victory');
        if (p.y > virtualHeight - 150) setGameStatus('gameover');
        if (p.y < 40) { p.y = 40; p.vy = 0; }

        setCurrentDistance(Math.floor(p.x));

        const camLerpFactor = 1 - Math.pow(1 - 0.08, dt);
        cameraX.current += (p.x - cameraX.current - 280) * camLerpFactor;

        if (!isSolo && currentTime - lastFirebaseUpdate.current > 50) {
          lastFirebaseUpdate.current = currentTime;
          update(ref(db, `rooms/${room.id}/gameState/syncPlayers/${user.id}`), {
            x: p.x, y: p.y, isAttached: p.isAttached, hookIndex: p.hookIndex,
            name: user.name, avatar: user.avatar, color: myColor
          }).catch(() => {});
        }
      }

      // ОТРИСОВКА ПОЛЯ
      ctx.clearRect(0, 0, virtualWidth, virtualHeight);
      const camX = cameraX.current;
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, virtualWidth, virtualHeight);

      // Сетка
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
      ctx.lineWidth = 4;
      const step = 140;
      const startX = -(camX % step);
      for (let x = startX; x < virtualWidth; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, virtualHeight); ctx.stroke();
      }

      // Частицы
      particles.current.forEach(part => {
        ctx.fillStyle = part.color; ctx.globalAlpha = part.alpha;
        ctx.fillRect(part.x - camX - part.size / 2, part.y - part.size / 2, part.size, part.size);
      });
      ctx.globalAlpha = 1.0;

      // Отрисовка финиша
      if (finishLine - camX < virtualWidth) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.fillRect(finishLine - camX, 0, 80, virtualHeight);
        ctx.fillStyle = '#00FFCC'; ctx.font = 'black 48px sans-serif';
        ctx.fillText("ФИНИШ", finishLine - camX - 60, 250);
      }

      // Отрисовка зацепов
      hooks.current.forEach((hook, idx) => {
        const screenX = hook.x - camX;
        if (screenX > -120 && screenX < virtualWidth + 120) {
          const isTargeted = idx === activeTargetIndex.current;
          ctx.save();
          if (isTargeted && gameStatus === 'playing') {
            ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
            ctx.beginPath(); ctx.arc(screenX, hook.y, 45 + Math.sin(timeCounter * 0.1) * 8, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.shadowBlur = isTargeted ? 30 : 15;
          ctx.shadowColor = isTargeted ? '#FBBF24' : '#00FFCC';
          ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(hook.baseX - camX, 0); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke();
          ctx.fillStyle = isTargeted ? '#FBBF24' : '#00FFCC';
          ctx.beginPath(); ctx.arc(screenX, hook.y, isTargeted ? 24 : 18, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });

      // Отрисовка соперников мультиплеера
      if (!isSolo && gameState?.syncPlayers) {
        Object.entries(gameState.syncPlayers).forEach(([id, data]: [string, any]) => {
          if (id === user.id) return;
          const oppX = data.x - camX; const oppY = data.y;
          const opponentColor = data.color || '#EF4444';

          if (data.isAttached && data.hookIndex !== -1 && hooks.current[data.hookIndex]) {
            const hook = hooks.current[data.hookIndex];
            ctx.strokeStyle = opponentColor + '80'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(oppX, oppY); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke();
          }
          ctx.fillStyle = opponentColor;
          ctx.beginPath(); ctx.arc(oppX, oppY, 18, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '20px sans-serif';
          ctx.fillText(data.name || 'Игрок', oppX, oppY - 35);
        });
      }

      // Отрисовка себя
      const localX = p.x - camX;
      const localY = p.y;

      if (p.isAttached && p.hookIndex !== -1) {
        const hook = hooks.current[p.hookIndex];
        ctx.save(); ctx.strokeStyle = myColor; ctx.lineWidth = 7; ctx.shadowBlur = 20; ctx.shadowColor = myColor;
        ctx.beginPath(); ctx.moveTo(localX, localY); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke(); ctx.restore();
      }

      ctx.save(); ctx.fillStyle = myColor; ctx.shadowBlur = 30; ctx.shadowColor = myColor;
      ctx.beginPath(); ctx.arc(localX, localY, 24, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(user.name, localX, localY - 40);

      // Пол лавы
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)'; ctx.fillRect(0, virtualHeight - 140, virtualWidth, 140);
      ctx.fillStyle = '#EF4444'; ctx.fillRect(0, virtualHeight - 140, virtualWidth, 6);

      animationId = requestAnimationFrame(mainLoop);
    };

    animationId = requestAnimationFrame(mainLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameStatus, isSolo, gameState, isRaceStarted, myColor]);

  // ЭКРАН КЛАССРЕДАКТОРА: КАСТОМНОЕ ЛОББИ С ВЫБОРОМ ИЗ 12 ЦВЕТОВ
  if (!isRaceStarted) {
    return (
      <div className="w-full h-screen bg-[#07080e] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md backdrop-blur-2xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 relative shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" /> Подготовка к гонке
            </h1>
            <p className="text-sm text-zinc-400">Выберите цвет вашего неонового шара</p>
          </div>

          {/* Сетка выбора 12 цветов */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {COLOR_PALETTE.map((c) => {
              const isSelected = myColor === c.hex;
              return (
                <button
                  key={c.hex}
                  onClick={() => handleSelectColor(c.hex)}
                  className={`aspect-square rounded-2xl border transition-all duration-200 relative flex items-center justify-center`}
                  style={{ 
                    backgroundColor: c.hex + '15',
                    borderColor: isSelected ? c.hex : 'rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 15px ${c.hex}40` : 'none'
                  }}
                >
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.hex, boxShadow: `0 0 10px ${c.hex}` }} />
                </button>
              );
            })}
          </div>

          {/* Список готовых игроков в комнате */}
          <div className="bg-black/40 border border-zinc-800/60 rounded-xl p-4 mb-6 max-h-40 overflow-y-auto space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Участники заезда</span>
            {room.players?.map((p) => {
              const pColor = gameState?.playerColors?.[p.id]?.color || '#00FFCC';
              return (
                <div key={p.id} className="flex items-center gap-3 text-sm text-white font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pColor, boxShadow: `0 0 8px ${pColor}` }} />
                  <img src={p.avatar} className="w-6 h-6 rounded-full bg-zinc-800 object-cover" alt="" />
                  <span className="truncate flex-1">{p.name} {p.id === user.id && <span className="text-[10px] text-zinc-500 font-normal">(Вы)</span>}</span>
                </div>
              );
            })}
          </div>

          {/* Кнопка запуска */}
          {isSolo || isHost ? (
            <button onClick={handleStartRace} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">
              <Play className="w-4 h-4 fill-white" /> {isSolo ? 'Начать соло заезд' : 'Запустить гонку'}
            </button>
          ) : (
            <div className="w-full bg-zinc-800/40 border border-zinc-800 text-zinc-400 py-4 rounded-xl font-bold uppercase text-center text-xs tracking-wider animate-pulse">
              Ожидание запуска хостом...
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen bg-[#030406] flex items-center justify-center overflow-hidden touch-none select-none"
      onTouchStart={(e) => attachRope(e)}
      onTouchEnd={(e) => detachRope(e)}
      onMouseDown={(e) => attachRope(e)}
      onMouseUp={(e) => detachRope(e)}
    >
      <div className="relative aspect-[9/16] h-full max-h-screen bg-black overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.85)]">
        <canvas ref={canvasRef} width={virtualWidth} height={virtualHeight} className="w-full h-full object-contain" />

        {/* Информационный HUD */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
          <div className="backdrop-blur-xl bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-3 text-white">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 block font-bold">Пройдено</span>
            <span className="text-2xl font-black font-mono" style={{ color: myColor }}>{currentDistance}м</span>
          </div>

          <div className="backdrop-blur-xl bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-3 text-white text-right">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 block font-bold">Скорость</span>
            <span className="text-2xl font-black font-mono text-amber-400 flex items-center justify-end gap-1">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
              {speedKmh} <span className="text-xs text-zinc-400 font-sans">км/ч</span>
            </span>
          </div>
        </div>

        {/* УЛУЧШЕНИЕ: Живой Мультиплеерный прогресс-бар внизу экрана */}
        <div className="absolute bottom-4 left-6 right-6 backdrop-blur-md bg-black/40 border border-zinc-800/60 rounded-xl h-10 px-4 flex items-center relative overflow-hidden pointer-events-none">
          <div className="w-full bg-zinc-800/50 h-1 rounded-full relative">
            {/* Локальный игрок */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-white transition-all duration-75"
              style={{ left: `${Math.min(100, (currentDistance / finishLine) * 100)}%`, backgroundColor: myColor, boxShadow: `0 0 8px ${myColor}` }}
            />
            {/* Соперники */}
            {!isSolo && gameState?.syncPlayers && Object.entries(gameState.syncPlayers).map(([id, data]: [string, any]) => {
              if (id === user.id) return null;
              const progress = Math.min(100, ((data.x || 0) / finishLine) * 100);
              const pColor = data.color || '#EF4444';
              return (
                <div 
                  key={id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-all duration-200"
                  style={{ left: `${progress}%`, backgroundColor: pColor, boxShadow: `0 0 6px ${pColor}` }}
                />
              );
            })}
          </div>
        </div>

        {/* Экраны финала */}
        <AnimatePresence>
          {gameStatus !== 'playing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 backdrop-blur-xl bg-black/80 flex items-center justify-center p-6 z-50">
              <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-zinc-900/85 border border-zinc-800 rounded-3xl p-6 text-center shadow-2xl">
                {gameStatus === 'victory' ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">ПОБЕДА!</h2>
                    <p className="text-zinc-400 text-sm mb-6">Вы успешно долетели до финишной черты!</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <RotateCcw className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">ИГРА ОКОНЧЕНА</h2>
                    <p className="text-zinc-400 text-sm mb-2">Вы упали ниже допустимой черты.</p>
                    <p className="text-sm font-mono text-zinc-500 mb-6">Результат: <span className="text-red-400 font-bold">{currentDistance}м</span></p>
                  </>
                )}

                <div className="space-y-3">
                  <button onClick={(e) => { e.stopPropagation(); resetLocalPlayer(); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Играть снова
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onLeave(); }} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <LogOut className="w-4 h-4" /> В лобби
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}