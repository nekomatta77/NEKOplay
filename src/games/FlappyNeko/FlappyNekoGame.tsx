import React, { useEffect, useRef, useState } from 'react';
import { Room, User } from '../../types';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';

interface FlappyNekoGameProps {
  room: Room;
  user: User;
  gameState: any;
  onLeave: () => void;
}

interface SkinConfig {
  id: string;
  name: string;
  path: string;
  radiusX: number;
  radiusY: number;
}

// Глобальный масштабирующий коэффициент для графики скинов
const SKIN_SCALE = 1.15;

// Базовый путь к репозиторию ассетов
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/nekomatta77/nekoplayassets/main/FlappyNEKO';

// 12 утвержденных скинов с персональными визуальными размерами
const SKIN_SPECS = [
  { name: "Классика", rx: 30, ry: 30 },
  { name: "Ворон", rx: 30, ry: 30 },
  { name: "Свинка", rx: 35, ry: 35 },
  { name: "Самолет", rx: 35, ry: 35 },
  { name: "Квадракоптер", rx: 35, ry: 35 },
  { name: "Баба Яга", rx: 50, ry: 50 },
  { name: "Ночная Фурия", rx: 35, ry: 35 },
  { name: "Аппа", rx: 35, ry: 35 },
  { name: "Демон", rx: 35, ry: 35 },
  { name: "Огненный дух", rx: 35, ry: 35 },
  { name: "Ифрит", rx: 35, ry: 35 },
  { name: "Алладин", rx: 35, ry: 35 }
];

// Единый стандартизированный хитбокс для честной игры (на базе Классики)
const GAMEPLAY_RADIUS_X = 30 * SKIN_SCALE;
const GAMEPLAY_RADIUS_Y = 30 * SKIN_SCALE;

const AVAILABLE_SKINS: SkinConfig[] = SKIN_SPECS.map((spec, index) => {
  const skinNumber = index + 1;
  return {
    id: `skin${skinNumber}`,
    name: `${skinNumber}. ${spec.name.toUpperCase()}`,
    path: `${GITHUB_BASE_URL}/skin${skinNumber}.webp`,
    radiusX: spec.rx * SKIN_SCALE,
    radiusY: spec.ry * SKIN_SCALE
  };
});

export default function FlappyNekoGame({ room, user, gameState, onLeave }: FlappyNekoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHost = room.players?.find((p: any) => p.id === user.id)?.isHost || false;

  const [currentSkin, setCurrentSkin] = useState<string>('skin1');
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string>('');

  // Кэш текстур
  const bgRef = useRef<HTMLImageElement | null>(null);
  const skinsImgRef = useRef<Record<string, HTMLImageElement>>({});
  const bgOffsetRef = useRef<number>(0);

  const myCatRef = useRef({
    y: 300,
    velocity: 0,
    isGhost: false,
    score: 0,
    rotation: 0
  });

  const interpolatedPlayersRef = useRef<Record<string, number>>({});
  const lastNetworkUpdateRef = useRef<number>(0);

  // Физические константы
  const GRAVITY = 0.4;
  const JUMP_FORCE = -7.5;
  const PIPE_WIDTH = 76;
  const PIPE_GAP = 175; 
  const BASE_WIDTH = 480;
  const BASE_HEIGHT = 640;
  const X_POSITION = 140;

  const gameStatus = gameState?.status || 'waiting';
  const pipes = gameState?.pipes || [];
  const networkPlayers = gameState?.players || {};

  // Динамический ресайз под экраны мобильных устройств
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [assetsLoaded]);

  // Предзагрузка ресурсов
  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = AVAILABLE_SKINS.length + 1;

    const incrementLoad = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        setAssetsLoaded(true);
      }
    };

    AVAILABLE_SKINS.forEach(skin => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = skin.path;
      img.onload = incrementLoad;
      img.onerror = incrementLoad;
      skinsImgRef.current[skin.id] = img;
    });

    const b = new Image();
    b.crossOrigin = 'anonymous';
    b.src = `${GITHUB_BASE_URL}/bg.webp`;
    b.onload = () => { bgRef.current = b; incrementLoad(); };
    b.onerror = incrementLoad;
  }, []);

  // Синхронизация скина
  useEffect(() => {
    const playerGameRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
    update(playerGameRef, {
      name: user.name,
      y: 300,
      isGhost: false,
      score: 0,
      skinId: currentSkin
    });
  }, [room.id, user.id, user.name, currentSkin]);

  // Расчет красивого черного отсчета
  useEffect(() => {
    if (gameStatus !== 'countdown') {
      setCountdownText('');
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - (gameState?.startTime || 0);
      const remaining = Math.ceil((3000 - elapsed) / 1000);
      if (remaining > 0) {
        setCountdownText(remaining.toString());
      } else {
        setCountdownText('GO!');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus, gameState?.startTime]);

  useEffect(() => {
    if (!isHost || gameStatus !== 'countdown') return;

    const timer = setTimeout(async () => {
      const startRef = ref(db, `rooms/${room.id}/gameState`);
      await update(startRef, {
        status: 'playing',
        startTime: Date.now() 
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [isHost, gameStatus, room.id]);

  const handleJump = () => {
    if (gameStatus !== 'playing') return;
    myCatRef.current.velocity = JUMP_FORCE;
    myCatRef.current.rotation = -0.35;
    
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
    
    const updatedPlayers = { ...networkPlayers };
    Object.keys(updatedPlayers).forEach(pId => {
      updatedPlayers[pId] = {
        ...updatedPlayers[pId],
        isGhost: false,
        score: 0,
        y: 300
      };
    });

    await update(startRef, {
      status: 'countdown',
      pipes: [],
      startTime: Date.now(),
      players: updatedPlayers
    });
  };

  // Метод перевода игры обратно в лобби силами хоста
  const handleReturnToLobby = async () => {
    const stateRef = ref(db, `rooms/${room.id}/gameState`);
    await update(stateRef, {
      status: 'waiting',
      pipes: []
    });
  };

  useEffect(() => {
    if (!isHost || gameStatus !== 'playing') return;

    let lastTime = performance.now();
    let pipeSpeed = 3.4;

    const hostTicker = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTime) / (1000 / 60);
      lastTime = now;

      if (dt > 3) return;

      const stateRef = ref(db, `rooms/${room.id}/gameState`);
      let currentPipes = [...pipes];

      if (currentPipes.length === 0 || currentPipes[currentPipes.length - 1].x < BASE_WIDTH - 240) {
        const topHeight = Math.floor(Math.random() * (BASE_HEIGHT - PIPE_GAP - 200)) + 100;
        currentPipes.push({ x: BASE_WIDTH, top: topHeight });
      }

      let nextPipes = currentPipes
        .map(p => ({ ...p, x: p.x - pipeSpeed * dt }))
        .filter(p => p.x > -PIPE_WIDTH);

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

  // Главный визуальный поток Canvas
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

      const scaleX = canvas.width / BASE_WIDTH;
      const scaleY = canvas.height / BASE_HEIGHT;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      if (gameStatus === 'playing') {
        bgOffsetRef.current -= 0.6 * dt;
        if (bgOffsetRef.current <= -BASE_WIDTH) bgOffsetRef.current = 0;
      }

      if (bgRef.current) {
        ctx.drawImage(bgRef.current, bgOffsetRef.current, 0, BASE_WIDTH, BASE_HEIGHT);
        ctx.drawImage(bgRef.current, bgOffsetRef.current + BASE_WIDTH, 0, BASE_WIDTH, BASE_HEIGHT);
      } else {
        ctx.fillStyle = '#bae6fd'; 
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
      }

      const serverMe = networkPlayers[user.id];

      if (gameStatus === 'countdown') {
        myCatRef.current.y = 300 + Math.sin(now / 120) * 3;
        myCatRef.current.velocity = 0;
        myCatRef.current.rotation = 0;

        if (now - lastNetworkUpdateRef.current > 60) {
          const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
          update(myRef, { y: Math.floor(myCatRef.current.y) });
          lastNetworkUpdateRef.current = now;
        }
      }

      if (gameStatus === 'playing') {
        myCatRef.current.velocity += GRAVITY * dt;
        myCatRef.current.y += myCatRef.current.velocity * dt;

        if (myCatRef.current.velocity > 2.5) {
          myCatRef.current.rotation = Math.min(Math.PI / 3.5, myCatRef.current.rotation + 0.07 * dt);
        } else {
          myCatRef.current.rotation = Math.max(-0.3, myCatRef.current.rotation + 0.02 * dt);
        }

        // Физическое ограничение потолка и пола теперь строго одинаковое по константе GAMEPLAY_RADIUS_Y
        if (myCatRef.current.y > BASE_HEIGHT - GAMEPLAY_RADIUS_Y) {
          myCatRef.current.y = BASE_HEIGHT - GAMEPLAY_RADIUS_Y;
          myCatRef.current.velocity = 0;
        }
        if (myCatRef.current.y < GAMEPLAY_RADIUS_Y) {
          myCatRef.current.y = GAMEPLAY_RADIUS_Y;
          myCatRef.current.velocity = 0;
        }

        if (now - lastNetworkUpdateRef.current > 60) {
          const myRef = ref(db, `rooms/${room.id}/gameState/players/${user.id}`);
          update(myRef, { y: Math.floor(myCatRef.current.y) });
          lastNetworkUpdateRef.current = now;
        }

        if (serverMe && !serverMe.isGhost) {
          myCatRef.current.isGhost = false;
          
          // Проверка коллизий с трубами по стандартизированному хитбоксу
          for (let p of pipes) {
            const insideX = (X_POSITION + GAMEPLAY_RADIUS_X - 4 > p.x) && (X_POSITION - GAMEPLAY_RADIUS_X + 4 < p.x + PIPE_WIDTH);
            const hitTop = myCatRef.current.y - GAMEPLAY_RADIUS_Y + 4 < p.top;
            const hitBottom = myCatRef.current.y + GAMEPLAY_RADIUS_Y - 4 > p.top + PIPE_GAP;

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

      // Процедурные мультяшные трубы
      pipes.forEach((p: any) => {
        ctx.save();
        const CAP_HEIGHT = 30;
        const CAP_OUTSET = 4;

        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 3;

        // Верхняя труба
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top - CAP_HEIGHT);
        ctx.strokeRect(p.x, -5, PIPE_WIDTH, p.top - CAP_HEIGHT + 5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x + 8, 0, 8, p.top - CAP_HEIGHT);
        
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x - CAP_OUTSET, p.top - CAP_HEIGHT, PIPE_WIDTH + (CAP_OUTSET * 2), CAP_HEIGHT);
        ctx.strokeRect(p.x - CAP_OUTSET, p.top - CAP_HEIGHT, PIPE_WIDTH + (CAP_OUTSET * 2), CAP_HEIGHT);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x - CAP_OUTSET + 8, p.top - CAP_HEIGHT, 8, CAP_HEIGHT);

        // Нижняя труба
        ctx.fillStyle = '#15803d';
        ctx.fillRect(p.x - CAP_OUTSET, p.top + PIPE_GAP, PIPE_WIDTH + (CAP_OUTSET * 2), CAP_HEIGHT);
        ctx.strokeRect(p.x - CAP_OUTSET, p.top + PIPE_GAP, PIPE_WIDTH + (CAP_OUTSET * 2), CAP_HEIGHT);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x - CAP_OUTSET + 8, p.top + PIPE_GAP, 8, CAP_HEIGHT);
        
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.top + PIPE_GAP + CAP_HEIGHT, PIPE_WIDTH, BASE_HEIGHT - (p.top + PIPE_GAP + CAP_HEIGHT));
        ctx.strokeRect(p.x, p.top + PIPE_GAP + CAP_HEIGHT, PIPE_WIDTH, BASE_HEIGHT - (p.top + PIPE_GAP + CAP_HEIGHT) + 5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(p.x + 8, p.top + PIPE_GAP + CAP_HEIGHT, 8, BASE_HEIGHT - (p.top + PIPE_GAP + CAP_HEIGHT));

        ctx.restore();
      });

      // Рендеринг текстур игроков
      Object.keys(networkPlayers).forEach(pId => {
        const p = networkPlayers[pId];
        const isMe = pId === user.id;

        if (!isMe) {
          if (interpolatedPlayersRef.current[pId] === undefined) {
            interpolatedPlayersRef.current[pId] = p.y || 300;
          }
          interpolatedPlayersRef.current[pId] += ((p.y || 300) - interpolatedPlayersRef.current[pId]) * 0.16 * dt;
        }

        const drawY = isMe ? myCatRef.current.y : interpolatedPlayersRef.current[pId];
        const currentRotation = isMe ? myCatRef.current.rotation : (p.y > drawY ? 0.25 : -0.1);

        // Для отрисовки по-прежнему берем уникальные радиусы скина, чтобы визуальный размер оставался прежним!
        const playerSpec = AVAILABLE_SKINS.find(s => s.id === (p.skinId || 'skin1')) || AVAILABLE_SKINS[0];

        ctx.save();
        ctx.translate(X_POSITION, drawY);
        ctx.rotate(currentRotation);

        if (p.isGhost) {
          ctx.globalAlpha = 0.25;
        } else {
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
        }

        const sprite = skinsImgRef.current[playerSpec.id];

        if (assetsLoaded && sprite && sprite.complete && sprite.naturalWidth !== 0) {
          // Отрисовка сохраняет оригинальные пропорции скина
          ctx.drawImage(sprite, -playerSpec.radiusX, -playerSpec.radiusY, playerSpec.radiusX * 2, playerSpec.radiusY * 2);
        } else {
          ctx.fillStyle = isMe ? '#38bdf8' : '#fbbf24';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, playerSpec.radiusX - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        ctx.save();
        ctx.fillStyle = isMe ? '#0369a1' : '#b45309';
        ctx.font = 'bold 11px system-ui, sans-serif'; 
        ctx.textAlign = 'center';
        // Имя над головой позиционируется с учетом визуального размера
        ctx.fillText(`${p.name.toUpperCase()} [${p.score || 0}]`, X_POSITION, drawY - (playerSpec.radiusY + 12));
        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, pipes, networkPlayers, room.id, user.id, assetsLoaded]);

  const allPlayersDead = (gameStatus === 'playing' || gameStatus === 'countdown') && 
    Object.keys(networkPlayers).length > 0 && 
    Object.keys(networkPlayers).every(pId => networkPlayers[pId].isGhost);

  return (
    <div className="fixed inset-0 bg-[#0c0d14] flex flex-col items-center justify-center select-none text-slate-200 font-sans p-0 z-50">
      
      {/* Шапка счета */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-slate-900 border-2 border-slate-800 px-5 py-2.5 rounded-2xl max-w-md mx-auto shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">СТАТУС</span>
          <span className={`text-xs font-black ${networkPlayers[user.id]?.isGhost ? 'text-rose-400' : 'text-sky-400'}`}>
            {networkPlayers[user.id]?.isGhost ? 'РЕЖИМ ДУХА' : 'В ПОЛЕТЕ'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">ОЧКИ</span>
          <span className="text-xl font-black text-amber-400">{networkPlayers[user.id]?.score || 0}</span>
        </div>
      </div>

      {/* Адаптивный холст игры */}
      <div 
        ref={containerRef}
        onClick={handleJump}
        className="relative w-full h-full sm:w-[480px] sm:h-[640px] sm:aspect-[3/4] sm:border-4 sm:border-slate-800 sm:rounded-3xl overflow-hidden shadow-2xl bg-sky-200"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Черный отсчет */}
        {gameStatus === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[0.5px]">
            <span className="text-8xl font-black text-black select-none tracking-tighter animate-ping">
              {countdownText}
            </span>
          </div>
        )}

        {/* Экран лобби ожидания */}
        {gameStatus === 'waiting' && (
          <div className="absolute inset-0 bg-[#0c0d14]/98 flex flex-col items-center justify-between p-6 sm:p-8 text-center">
            
            {!assetsLoaded ? (
              <div className="absolute inset-0 bg-[#0c0d14] flex flex-col items-center justify-center p-6">
                <div className="w-9 h-9 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-xs font-black tracking-widest text-sky-400 uppercase animate-pulse">ЗАГРУЗКА ТЕКСТУР...</span>
              </div>
            ) : (
              <>
                <div className="mt-14 flex flex-col items-center">
                  <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                    FlappyNEKO
                  </h1>
                </div>

                {/* Выбор персонажей */}
                <div className="w-full max-w-sm bg-slate-900/60 border-2 border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-black tracking-widest block mb-3 uppercase text-left border-b border-slate-800 pb-1.5">
                    ВЫБЕРИТЕ СВОЕГО ПЕРСОНАЖА
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {AVAILABLE_SKINS.map((skin) => (
                      <button
                        key={skin.id}
                        onClick={(e) => { e.stopPropagation(); setCurrentSkin(skin.id); }}
                        className={`px-3 py-3 rounded-xl border-2 text-left transition-all font-bold ${
                          currentSkin === skin.id 
                            ? 'bg-sky-500/10 border-sky-500 text-sky-400 shadow-md shadow-sky-500/5' 
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[11px] tracking-wide truncate">{skin.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 w-full flex flex-col items-center gap-2">
                  {isHost ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartGame(); }}
                      className="w-full max-w-xs bg-sky-500 hover:bg-sky-600 active:scale-95 transition-all text-white py-3.5 rounded-xl font-black text-sm tracking-wide uppercase border-b-4 border-sky-700 active:border-b-0"
                    >
                      Начать
                    </button>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 bg-slate-900/80 px-6 py-3.5 rounded-xl border border-slate-800 w-full max-w-xs mx-auto">
                      <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
                      <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">Ожидание лидера...</span>
                    </div>
                  )}

                  {/* Общая кнопка отключения для всех игроков, доступная строго в лобби */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onLeave(); }}
                    className="w-full max-w-xs bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase border-2 border-slate-800 transition-all active:scale-95 shadow-md"
                  >
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Экран "Вы врезались" */}
        {allPlayersDead && (
          <div className="absolute inset-0 bg-[#0c0d14]/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tight mb-8">
              Вы врезались
            </h2>
            
            {isHost && (
              <div className="w-full max-w-xs flex flex-col gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartGame(); }}
                  className="w-full bg-sky-500 hover:bg-sky-600 active:scale-95 transition-all text-white py-3.5 rounded-xl font-black text-sm tracking-wider uppercase border-b-4 border-sky-700 active:border-b-0 shadow-lg"
                >
                  Следующий полет
                </button>
                
                {/* Кнопка выхода только для хоста: выкидывает всех обратно в лобби */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleReturnToLobby(); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-slate-300 py-3 rounded-xl font-black text-xs tracking-wider uppercase border-b-4 border-slate-950 active:border-b-0 shadow-md"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}