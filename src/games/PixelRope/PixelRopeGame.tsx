import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Room, User } from '../../types';
import { Trophy, RotateCcw, LogOut } from 'lucide-react';

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

export default function PixelRopeGame({ room, user, gameState, onLeave }: PixelRopeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSolo = (room.players || []).length <= 1;

  // Игровые статусы локального клиента: 'playing' | 'gameover' | 'victory'
  const [gameStatus, setGameStatus] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [currentDistance, setCurrentDistance] = useState(0);

  // Константы уровня
  const finishLine = 10000;
  const virtualWidth = 1080;
  const virtualHeight = 1920;

  // Локальные рефы физики игрока
  const playerRef = useRef({
    x: 150,
    y: 800,
    vx: 12, // Стартовый толчок вперед
    vy: 0,
    isAttached: false,
    hookIndex: -1,
    color: '#00FFCC',
  });

  const cameraX = useRef(0);
  const lastFirebaseUpdate = useRef(0);

  // Генерируем массив зацепов
  const hooks = useRef<HookPlatform[]>(
    Array.from({ length: 50 }, (_, i) => ({
      x: 400 + i * 240,
      y: 300 + (i % 4) * 90,
      baseX: 400 + i * 240,
      amplitude: 30 + (i % 2) * 40,
      speed: 0.015 + (i % 3) * 0.01,
      phase: i * 0.7,
    }))
  );

  // Сброс физики для перезапуска уровня (работает и в соло, и в мультиплеере)
  const resetLocalPlayer = () => {
    playerRef.current = {
      x: 150,
      y: 800,
      vx: 12,
      vy: 0,
      isAttached: false,
      hookIndex: -1,
      color: '#00FFCC',
    };
    cameraX.current = 0;
    setGameStatus('playing');
  };

  // Механика зацепа каната
  const attachRope = () => {
    if (gameStatus !== 'playing') return;
    const p = playerRef.current;
    if (p.isAttached) {
      p.isAttached = false;
      p.hookIndex = -1;
      return;
    }

    let bestIndex = -1;
    let minDist = 380; // Радиус зацепа

    hooks.current.forEach((hook, idx) => {
      const dx = hook.x - p.x;
      const dy = hook.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist && hook.x > p.x - 30) {
        minDist = dist;
        bestIndex = idx;
      }
    });

    if (bestIndex !== -1) {
      p.isAttached = true;
      p.hookIndex = bestIndex;
    }
  };

  const detachRope = () => {
    const p = playerRef.current;
    p.isAttached = false;
    p.hookIndex = -1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frameTime = 0;

    const mainLoop = () => {
      frameTime += 1;
      const p = playerRef.current;

      if (gameStatus === 'playing') {
        // 1. Обновление физики качающихся неоновых платформ
        hooks.current.forEach((hook) => {
          hook.x = hook.baseX + Math.sin(frameTime * hook.speed + hook.phase) * hook.amplitude;
        });

        // 2. Физика раскачивания и гравитации игрока
        const gravity = 0.45;

        if (p.isAttached && p.hookIndex !== -1) {
          const hook = hooks.current[p.hookIndex];
          p.vy += gravity;
          p.x += p.vx;
          p.y += p.vy;

          const dx = p.x - hook.x;
          const dy = p.y - hook.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxRopeLength = 300;

          // Ограничение натяжения нити маятника
          if (dist > maxRopeLength) {
            const nx = dx / dist;
            const ny = dy / dist;
            p.x = hook.x + nx * maxRopeLength;
            p.y = hook.y + ny * maxRopeLength;

            const velProj = p.vx * nx + p.vy * ny;
            if (velProj > 0) {
              p.vx -= nx * velProj * 1.08; // Эффект пружинящего отскока вверх
              p.vy -= ny * velProj * 1.08;
            }
          }
          p.vx += 0.08; // Небольшое ускорение вперед при удержании
        } else {
          // Свободное падение баллистики
          p.vy += gravity;
          p.vx *= 0.995;
          p.vy *= 0.995;
          p.x += p.vx;
          p.y += p.vy;
        }

        // Проверка условий победы или поражения
        if (p.x >= finishLine) {
          setGameStatus('victory');
        }
        
        // Условия проигрыша (упал слишком низко на дно экрана)
        if (p.y > virtualHeight - 180) {
          setGameStatus('gameover');
        }

        // Ограничение потолка
        if (p.y < 50) {
          p.y = 50;
          p.vy = 0;
        }

        setCurrentDistance(Math.floor(p.x));
        cameraX.current += (p.x - cameraX.current - 250) * 0.1;

        // Сетевой апдейт координат в Firebase (Троттлинг раз в 3 кадра для оптимизации)
        if (!isSolo && frameTime - lastFirebaseUpdate.current > 3) {
          lastFirebaseUpdate.current = frameTime;
          update(ref(db, `rooms/${room.id}/gameState/syncPlayers/${user.id}`), {
            x: p.x,
            y: p.y,
            isAttached: p.isAttached,
            hookIndex: p.hookIndex,
            name: user.name,
            avatar: user.avatar
          }).catch(() => {});
        }
      }

      // 3. ОТРИСОВКА (РЕНДЕРИНГ) НА CANVAS
      ctx.clearRect(0, 0, virtualWidth, virtualHeight);
      const camX = cameraX.current;

      // Глубокий бэкграунд
      ctx.fillStyle = '#07080c';
      ctx.fillRect(0, 0, virtualWidth, virtualHeight);

      // Динамическая футуристическая сетка фона
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 3;
      const step = 120;
      const startX = -(camX % step);
      for (let x = startX; x < virtualWidth; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, virtualHeight); ctx.stroke();
      }

      // Линия финиша
      if (finishLine - camX < virtualWidth) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.fillRect(finishLine - camX, 0, 60, virtualHeight);
        ctx.fillStyle = '#00FFCC';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText("ФИНИШ", finishLine - camX - 40, 200);
      }

      // Рендеринг неоновых зацепов-платформ
      hooks.current.forEach((hook) => {
        const screenX = hook.x - camX;
        if (screenX > -100 && screenX < virtualWidth + 100) {
          ctx.save();
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00FFCC';
          
          // Провод к потолку
          ctx.strokeStyle = 'rgba(0, 255, 204, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(hook.baseX - camX, 0); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke();

          // Светящееся неоновое ядро
          ctx.fillStyle = '#00FFCC';
          ctx.beginPath(); ctx.arc(screenX, hook.y, 18, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });

      // Рендеринг СЕТЕВЫХ игроков (если они есть в комнате)
      if (!isSolo && gameState?.syncPlayers) {
        Object.entries(gameState.syncPlayers).forEach(([id, data]: [string, any]) => {
          if (id === user.id) return; // Себя рисуем отдельно

          const oppX = data.x - camX;
          const oppY = data.y;

          // Трос оппонента
          if (data.isAttached && data.hookIndex !== -1 && hooks.current[data.hookIndex]) {
            const hook = hooks.current[data.hookIndex];
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(oppX, oppY); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke();
          }

          // Аватар / Моделька оппонента
          ctx.fillStyle = '#EF4444';
          ctx.beginPath(); ctx.arc(oppX, oppY, 16, 0, Math.PI * 2); ctx.fill();
          
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '20px sans-serif';
          ctx.fillText(data.name || 'Игрок', oppX, oppY - 30);
        });
      }

      // Рендеринг ЛОКАЛЬНОГО игрока
      const localX = p.x - camX;
      const localY = p.y;

      if (p.isAttached && p.hookIndex !== -1) {
        const hook = hooks.current[p.hookIndex];
        ctx.save();
        ctx.strokeStyle = '#00FFCC';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00FFCC';
        ctx.beginPath(); ctx.moveTo(localX, localY); ctx.lineTo(hook.x - camX, hook.y); ctx.stroke();
        ctx.restore();
      }

      // Наш пиксельный неоновый круг-кот
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 25;
      ctx.shadowColor = p.color;
      ctx.beginPath(); ctx.arc(localX, localY, 22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Наш никнейм
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(user.name, localX, localY - 35);

      // Отрисовка "Пола" (Опасная зона)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(0, virtualHeight - 140, virtualWidth, 140);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(0, virtualHeight - 140, virtualWidth, 4);

      animationId = requestAnimationFrame(mainLoop);
    };

    mainLoop();
    return () => cancelAnimationFrame(animationId);
  }, [gameStatus, isSolo, gameState]);

  return (
    <div 
      className="relative w-full h-screen bg-[#040508] flex items-center justify-center overflow-hidden touch-none select-none"
      onTouchStart={attachRope}
      onTouchEnd={detachRope}
      onMouseDown={attachRope}
      onMouseUp={detachRope}
    >
      <div className="relative aspect-[9/16] h-full max-h-screen bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <canvas ref={canvasRef} width={virtualWidth} height={virtualHeight} className="w-full h-full object-contain" />

        {/* Информационный HUD сверху */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
          <div className="backdrop-blur-xl bg-zinc-900/40 border border-white/10 rounded-2xl px-5 py-3 text-white">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 block font-semibold">Пройдено</span>
            <span className="text-2xl font-black font-mono text-[#00FFCC]">{currentDistance}м</span>
          </div>

          <div className="backdrop-blur-xl bg-zinc-900/40 border border-white/10 rounded-2xl px-5 py-3 text-white text-right">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 block font-semibold">Цель</span>
            <span className="text-2xl font-black font-mono text-indigo-400">10000м</span>
          </div>
        </div>

        {/* Анимация экранов конца игры (Победа / Поражение) */}
        <AnimatePresence>
          {gameStatus !== 'playing' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl bg-black/75 flex items-center justify-center p-6 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-center shadow-2xl"
              >
                {gameStatus === 'victory' ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">ПОБЕДА!</h2>
                    <p className="text-zinc-400 text-sm mb-6">Ты успешно преодолел всю неоновую трассу!</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <RotateCcw className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">ИГРА ОКОНЧЕНА</h2>
                    <p className="text-zinc-400 text-sm mb-2">Ты сорвался или упал в лаву.</p>
                    <p className="text-sm font-mono text-zinc-500 mb-6">Результат: <span className="text-red-400 font-bold">{currentDistance}м</span></p>
                  </>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); resetLocalPlayer(); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Играть снова
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); onLeave(); }}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    В лобби
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