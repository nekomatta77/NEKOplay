import React, { useEffect, useRef, useState } from 'react';
import { Room, User } from '../../types';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';

interface NekoStackGameProps {
  room: Room;
  user: User;
  gameState: any;
  onLeave: () => void;
}

interface BlockSpec {
  type: string;
  width: number;
  height: number;
  sprite: string;
  label: string;
}

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/nekomatta77/NEKOplayAssets/main/StacksNEKO';

// На 100% выверенная конфигурация под реальные файлы репозитория
const BLOCK_CONFIGS: Record<string, BlockSpec> = {
  house1:     { type: 'standard', width: 85,  height: 65, sprite: 'house1.webp',     label: 'МОДЕРН 1' },
  house2:     { type: 'standard', width: 85,  height: 65, sprite: 'house2.webp',     label: 'МОДЕРН 2' },
  house3:     { type: 'standard', width: 85,  height: 65, sprite: 'house3.webp',     label: 'МОДЕРН 3' },
  house4:     { type: 'standard', width: 85,  height: 65, sprite: 'house4.webp',     label: 'МОДЕРН 4' },
  house5:     { type: 'standard', width: 85,  height: 65, sprite: 'house5.webp',     label: 'МОДЕРН 5' },
  house6:     { type: 'standard', width: 85,  height: 65, sprite: 'house6.webp',     label: 'МОДЕРН 6' },
  smallhome1: { type: 'small',    width: 45,  height: 45, sprite: 'smallhome1.webp', label: 'МИНИ-ДОМ 1' },
  smallhome2: { type: 'small',    width: 45,  height: 45, sprite: 'smallhome2.webp', label: 'МИНИ-ДОМ 2' },
  smallhome3: { type: 'small',    width: 45,  height: 45, sprite: 'smallhome3.webp', label: 'МИНИ-ДОМ 3' },
  smallhome4: { type: 'small',    width: 45,  height: 45, sprite: 'smallhome4.webp', label: 'МИНИ-ДОМ 4' },
  longhome1:  { type: 'wide',     width: 160, height: 60, sprite: 'longhome1.webp',  label: 'ВИЛЛА-ЛЮКС 1' },
  longhome2:  { type: 'wide',     width: 160, height: 60, sprite: 'longhome2.webp',  label: 'ВИЛЛА-ЛЮКС 2' },
  table:      { type: 'frame',    width: 110, height: 85, sprite: 'table.webp',     label: 'РАМА НА НОЖКАХ' },
  bridge:     { type: 'bridge',   width: 260, height: 35, sprite: 'bridge.webp',    label: 'СТАБИЛИЗАТОР' }
};

const BASE_WIDTH = 480;
const BASE_HEIGHT = 640;
const GROUND_LEVEL = 540; 

export default function NekoStackGame({ room, user, gameState, onLeave }: NekoStackGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHost = room.players?.find((p: any) => p.id === user.id)?.isHost || false;

  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);

  // Кэш графики
  const bgGroundRef = useRef<HTMLImageElement | null>(null);
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const cameraYRef = useRef<number>(0);

  const gameStatus = gameState?.status || 'waiting';
  const blocks = gameState?.blocks || [];
  const swingingBlock = gameState?.swingingBlock || null;
  const turnOrder = gameState?.turnOrder || [];
  const currentTurnIndex = gameState?.currentTurnIndex ?? 0;
  const score = gameState?.score || 0;
  const loserId = gameState?.loserId || null;

  const currentTurnPlayerId = turnOrder[currentTurnIndex] || '';
  const isMyTurn = currentTurnPlayerId === user.id && gameStatus === 'playing';

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

  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = Object.keys(BLOCK_CONFIGS).length + 1; // Блоки + 1 фон города

    const incrementLoad = () => {
      loadedCount++;
      if (loadedCount === totalAssets) setAssetsLoaded(true);
    };

    Object.keys(BLOCK_CONFIGS).forEach(key => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${GITHUB_BASE_URL}/${BLOCK_CONFIGS[key].sprite}`;
      img.onload = incrementLoad;
      img.onerror = incrementLoad;
      spritesRef.current[key] = img;
    });

    const ground = new Image();
    ground.crossOrigin = 'anonymous';
    ground.src = `${GITHUB_BASE_URL}/bg2.webp`;
    ground.onload = () => { bgGroundRef.current = ground; incrementLoad(); };
    ground.onerror = incrementLoad;
  }, []);

  const handleStartGame = async () => {
    const playersList = room.players || [];
    if (playersList.length === 0) return;

    const shuffledOrder = playersList.map(p => p.id).sort(() => Math.random() - 0.5);
    const firstBlockType = 'house' + (Math.floor(Math.random() * 6) + 1);

    await update(ref(db, `rooms/${room.id}/gameState`), {
      status: 'playing',
      score: 0,
      loserId: null,
      turnOrder: shuffledOrder,
      currentTurnIndex: 0,
      blocks: [],
      cameraY: 0,
      swingingBlock: {
        configKey: firstBlockType,
        x: BASE_WIDTH / 2,
        y: 120,
        phase: 0,
        isDropping: false
      }
    });
  };

  const handleDropBlock = () => {
    if (!isMyTurn || swingingBlock?.isDropping) return;

    update(ref(db, `rooms/${room.id}/gameState/swingingBlock`), {
      isDropping: true
    });
  };

  // Умный физический движок обсчета башни на стороне Хоста
  useEffect(() => {
    if (!isHost || gameStatus !== 'playing' || !swingingBlock) return;

    const hostTicker = setInterval(() => {
      const stateRef = ref(db, `rooms/${room.id}/gameState`);
      
      if (!swingingBlock.isDropping) {
        const nextPhase = (swingingBlock.phase || 0) + 0.045;
        const nextX = BASE_WIDTH / 2 + Math.sin(nextPhase) * 165;
        
        update(ref(db, `rooms/${room.id}/gameState/swingingBlock`), {
          phase: nextPhase,
          x: nextX
        });
        return;
      }

      if (swingingBlock.isDropping) {
        const fallSpeed = 8.5;
        const currentY = swingingBlock.y + fallSpeed;
        const currentX = swingingBlock.x;
        const cfg = BLOCK_CONFIGS[swingingBlock.configKey];

        // Глубокий послойный анализ коллизий по всей высоте башни
        let targetLandedY = GROUND_LEVEL;
        let baseBlock: any = null;

        for (let b of blocks) {
          const bHalfW = b.width / 2;
          const bLeft = b.x - bHalfW;
          const bRight = b.x + bHalfW;
          
          const fallHalfW = cfg.width / 2;
          const fallLeft = currentX - fallHalfW;
          const fallRight = currentX + fallHalfW;

          // Истинное геометрическое пересечение проекций блоков на ось X
          if (fallLeft < bRight && fallRight > bLeft) {
            const surfaceY = b.y - b.height;
            // Находим наивысшую точку соприкосновения
            if (surfaceY < targetLandedY) {
              targetLandedY = surfaceY;
              baseBlock = b;
            }
          }
        }

        // Проверка фиксации контакта
        if (currentY >= targetLandedY - cfg.height / 2) {
          let isStable = true;
          let deltaX = 0;
          let finalRotation = 0;
          let finalX = currentX;

          if (baseBlock) {
            deltaX = currentX - baseBlock.x;
            const halfBaseW = baseBlock.width / 2;

            // Если центр масс улетел за края подпорного блока — это стопроцентное падение
            if (currentX < baseBlock.x - halfBaseW || currentX > baseBlock.x + halfBaseW) {
              isStable = false;
            } else {
              // Плавный расчет заваливания угла (пропорционально смещению от центра опоры)
              const offsetFactor = deltaX / halfBaseW;
              finalRotation = (baseBlock.rotation || 0) + (offsetFactor * 0.12);
              
              // Эффект физического соскальзывания по наклону
              finalX = currentX + (finalRotation * 12);
              
              // Дополнительный критический наклон башни
              if (Math.abs(finalRotation) > 0.45) {
                isStable = false;
              }
            }
          } else {
            // Контроль падения мимо платформы фундамента города
            if (currentX < 45 || currentX > BASE_WIDTH - 45) {
              isStable = false;
            }
          }

          if (!isStable) {
            update(stateRef, {
              status: 'gameover',
              loserId: currentTurnPlayerId
            });
            clearInterval(hostTicker);
            return;
          }

          const newBlock = {
            configKey: swingingBlock.configKey,
            x: finalX,
            y: targetLandedY,
            width: cfg.width,
            height: cfg.height,
            rotation: finalRotation
          };

          const updatedBlocks = [newBlock, ...blocks];
          const newScore = score + 100;

          // СПАСИТЕЛЬНЫЙ МОСТ: Каждые 1000 очков выравниваем и стабилизируем ось башни
          if (newScore > 0 && newScore % 1000 === 0) {
            const bridgeCfg = BLOCK_CONFIGS['bridge'];
            const bridgeBlock = {
              configKey: 'bridge',
              x: BASE_WIDTH / 2, 
              y: targetLandedY - cfg.height,
              width: bridgeCfg.width,
              height: bridgeCfg.height,
              rotation: 0 
            };
            updatedBlocks.unshift(bridgeBlock);
          }

          // Пул выбора фигур без дублирования стабилизатора в рандоме
          const availableKeys = Object.keys(BLOCK_CONFIGS).filter(k => k !== 'bridge');
          const nextConfigKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
          const nextTurnIndex = (currentTurnIndex + 1) % turnOrder.length;

          // Динамический расчёт высоты для идеального следования камеры
          let highestY = GROUND_LEVEL;
          updatedBlocks.forEach(b => {
            if (b.y - b.height < highestY) highestY = b.y - b.height;
          });
          const targetCameraY = Math.max(0, GROUND_LEVEL - highestY - 220);

          update(stateRef, {
            blocks: updatedBlocks,
            score: newScore,
            currentTurnIndex: nextTurnIndex,
            cameraY: targetCameraY,
            swingingBlock: {
              configKey: nextConfigKey,
              x: BASE_WIDTH / 2,
              y: 120,
              phase: 0,
              isDropping: false
            }
          });
        } else {
          // Продолжение чистого падения
          update(ref(db, `rooms/${room.id}/gameState/swingingBlock`), {
            y: currentY
          });
        }
      }
    }, 1000 / 60);

    return () => clearInterval(hostTicker);
  }, [isHost, gameStatus, swingingBlock, blocks, currentTurnIndex, turnOrder, score, currentTurnPlayerId]);

  // Рендеринг Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = () => {
      const scaleX = canvas.width / BASE_WIDTH;
      const scaleY = canvas.height / BASE_HEIGHT;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      const serverCameraY = gameState?.cameraY || 0;
      cameraYRef.current += (serverCameraY - cameraYRef.current) * 0.08;

      // 1. ТРЕБОВАНИЕ 1: Идеально чистый небесно-голубой фон без переходов и градиентов
      ctx.fillStyle = '#7dd3fc'; 
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

      ctx.save();
      ctx.translate(0, cameraYRef.current);

      // 2. Отрисовка подложки города (уплывает вниз по мере роста башни)
      if (bgGroundRef.current) {
        ctx.drawImage(bgGroundRef.current, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, GROUND_LEVEL, BASE_WIDTH, 120);
      }

      // 3. Рендеринг башни с учётом рассчитанной физики углов и смещений
      blocks.forEach((b: any) => {
        const cfg = BLOCK_CONFIGS[b.configKey];
        const img = spritesRef.current[b.configKey];

        ctx.save();
        ctx.translate(b.x, b.y - cfg.height / 2);
        ctx.rotate(b.rotation || 0);

        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, -cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height);
        } else {
          ctx.fillStyle = b.configKey === 'bridge' ? '#334155' : '#0284c7';
          ctx.fillRect(-cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height);
        }
        ctx.restore();
      });

      ctx.restore();

      // 4. Отрисовка раскачивающегося домика и линии прицеливания
      if (gameStatus === 'playing' && swingingBlock) {
        const cfg = BLOCK_CONFIGS[swingingBlock.configKey];
        const img = spritesRef.current[swingingBlock.configKey];

        ctx.save();
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(swingingBlock.x, swingingBlock.y);
        ctx.lineTo(swingingBlock.x, BASE_HEIGHT);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(swingingBlock.x, swingingBlock.y);
        if (img && img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, -cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height);
        } else {
          ctx.fillStyle = '#e11d48';
          ctx.fillRect(-cfg.width / 2, -cfg.height / 2, cfg.width, cfg.height);
        }
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, blocks, swingingBlock, gameState?.cameraY]);

  const handleReturnToLobby = async () => {
    await update(ref(db, `rooms/${room.id}/gameState`), {
      status: 'waiting',
      blocks: [],
      score: 0
    });
  };

  const currentTurnPlayerName = room.players?.find(p => p.id === currentTurnPlayerId)?.name || 'Игрок';

  return (
    <div className="fixed inset-0 bg-[#090d16] flex flex-col items-center justify-center select-none text-slate-100 font-sans z-50">
      
      {gameStatus === 'playing' && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-slate-900/95 border-2 border-slate-800 backdrop-blur-md px-5 py-3 rounded-2xl max-w-md mx-auto shadow-2xl z-20">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">ОЧКИ МАТЧА</span>
            <span className="text-xl font-black text-amber-400">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase">СТРОИТЕЛЬ</span>
            <span className={`text-xs font-black px-3 py-1 rounded-lg mt-0.5 ${isMyTurn ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
              {isMyTurn ? 'ВАШ ХОД! СБРОС' : currentTurnPlayerName.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        onClick={handleDropBlock}
        className="relative w-full h-full sm:w-[480px] sm:h-[640px] sm:aspect-[3/4] sm:border-4 sm:border-slate-800 sm:rounded-3xl overflow-hidden shadow-2xl bg-sky-200 cursor-pointer"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {gameStatus === 'waiting' && (
          <div className="absolute inset-0 bg-[#090d16]/98 flex flex-col items-center justify-between p-6 text-center">
            {!assetsLoaded ? (
              <div className="absolute inset-0 bg-[#090d16] flex flex-col items-center justify-center p-6">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-xs font-black tracking-widest text-sky-400 uppercase animate-pulse">ОТПРАВКА СТРОЙМАТЕРИАЛОВ...</span>
              </div>
            ) : (
              <>
                <div className="mt-12">
                  <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                    NEKO Stack
                  </h1>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto font-medium">
                    Складывайте современные виллы и конструкции друг на друга. Проигрывает тот, на ком башня завалится!
                  </p>
                </div>

                <div className="w-full max-w-sm bg-slate-900/80 border-2 border-slate-800 rounded-2xl p-4">
                  <span className="text-[11px] text-slate-400 font-extrabold tracking-widest block mb-2.5 uppercase text-left border-b border-slate-800 pb-1.5">
                    БРИГАДА ({room.players?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {room.players?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                        <span className="text-xs font-bold text-slate-300">{p.name.toUpperCase()}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 font-black">
                          {p.isHost ? 'ПРОРАБ' : 'СТРОИТЕЛЬ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6 w-full flex flex-col items-center gap-2">
                  {isHost ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartGame(); }}
                      className="w-full max-w-xs bg-sky-500 hover:bg-sky-600 transition-all text-white py-3.5 rounded-xl font-black text-sm tracking-wide uppercase border-b-4 border-sky-700 active:border-b-0 active:scale-95 shadow-lg"
                    >
                      Начать стройку
                    </button>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 bg-slate-900/90 px-6 py-3.5 rounded-xl border border-slate-800 w-full max-w-xs mx-auto">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                      <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">Ожидание прораба...</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); onLeave(); }}
                    className="w-full max-w-xs bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase border-2 border-slate-800 transition-all active:scale-95"
                  >
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {gameStatus === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
            <div className="w-14 h-14 bg-rose-500/20 border-2 border-rose-500 text-rose-500 flex items-center justify-center rounded-full text-xl font-black mb-4">
              ✕
            </div>
            <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tight">
              Башня рухнула!
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mb-8">
              Конструкция завалилась на ходе:{' '}
              <span className="text-rose-400 font-black">
                {(room.players?.find(p => p.id === loserId)?.name || 'Игрок').toUpperCase()}
              </span>
            </p>

            <div className="bg-slate-900 border-2 border-slate-800 rounded-xl px-6 py-3 mb-8">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">ФИНАЛЬНЫЙ СЧЕТ</span>
              <span className="text-xl font-black text-amber-400">{score} ОЧКОВ</span>
            </div>
            
            {isHost && (
              <div className="w-full max-w-xs flex flex-col gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartGame(); }}
                  className="w-full bg-sky-500 hover:bg-sky-600 transition-all text-white py-3.5 rounded-xl font-black text-sm tracking-wider uppercase border-b-4 border-sky-700 active:border-b-0 active:scale-95 shadow-lg"
                >
                  Перестроить
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReturnToLobby(); }}
                  className="w-full bg-slate-800 hover:bg-slate-700 transition-all text-slate-300 py-2.5 rounded-xl font-black text-xs tracking-wider uppercase border-b-4 border-slate-950 active:border-b-0 active:scale-95"
                >
                  В лобби
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}