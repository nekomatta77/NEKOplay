// src/games/DeadOfWinter/components/BoardScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, ActionDice } from '../store/gameState';
import { endPlayerTurn, spendDice, requestDiceRoll, applyRolledDice, startGame } from '../store/gameActions';
import { TurnIndicator } from './TurnIndicator';
import { ActionMenu } from './ActionMenu';
import CharacterSelection from './CharacterSelection';
import DiceRoller from './DiceRoller';
import DiceTray from './DiceTray';
import SurvivorModal from './SurvivorModal';
import { SURVIVORS } from '../data/survivors';

// Добавим двух игроков для теста лобби
const initialEmptyState: GameState = {
  phase: 'lobby',
  round: 1,
  activePlayerId: null,
  settings: { duration: 'medium', difficulty: 'normal', hasTraitor: false },
  draftPool: [],
  colony: { morale: 5, food: 0, starvationTokens: 0, waste: 0 }, 
  players: [
    { id: 'player_1', name: 'Игрок 1', isFirstPlayer: true, survivors: [], actionDice: [] },
    { id: 'player_2', name: 'Игрок 2', isFirstPlayer: false, survivors: [], actionDice: [] }
  ]
};

export default function BoardScreen() {
  const [gameState, setGameState] = useState<GameState>(initialEmptyState);
  
  const [selectedDiceId, setSelectedDiceId] = useState<string | null>(null);
  const [activeSurvivorId, setActiveSurvivorId] = useState<string | null>(null);
  const [inspectedSurvivorId, setInspectedSurvivorId] = useState<string | null>(null); // Модалка
  
  const [isTrayVisible, setIsTrayVisible] = useState(false);
  const [rollingPlayerName, setRollingPlayerName] = useState('');
  const lastTimestamp = useRef(gameState.lastDiceRequest?.timestamp || 0);

  // В реальной игре это будет ID текущего клиента. Пока хардкодим для теста, что мы Игрок 1.
  const currentPlayerId = 'player_1'; 
  const activePlayer = gameState.players.find((p: Player) => p.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentPlayerId;
  const myPlayerInfo = gameState.players.find((p: Player) => p.id === currentPlayerId);

  // === ОБРАБОТЧИК ЛОББИ ===
  const handleGameStart = (selections: Record<string, string[]>) => {
    setGameState(prev => startGame(prev, selections));
  };

  // === СЛУШАТЕЛЬ БРОСКОВ ===
  useEffect(() => {
    if (gameState.lastDiceRequest && gameState.lastDiceRequest.timestamp > lastTimestamp.current) {
      lastTimestamp.current = gameState.lastDiceRequest.timestamp;
      
      const { notation, results, playerId } = gameState.lastDiceRequest;
      const pName = gameState.players.find(p => p.id === playerId)?.name || 'Игрок';
      
      setRollingPlayerName(pName);
      setIsTrayVisible(true); 
      
      setTimeout(() => {
        if ((window as any).roll3DSync) {
          (window as any).roll3DSync(notation, results);
        }
      }, 500);
    }
  }, [gameState.lastDiceRequest, gameState.players]);

  // ИСПРАВЛЕНИЕ БАГА: Надежное обновление через prev стейт
  const handleRollComplete = () => {
    setTimeout(() => {
      setIsTrayVisible(false);
      setGameState(prev => {
        // Проверяем свежий prev стейт, а не старый gameState
        if (prev.lastDiceRequest && prev.lastDiceRequest.playerId === currentPlayerId) {
           return applyRolledDice(prev, currentPlayerId, prev.lastDiceRequest.results);
        }
        return prev;
      });
    }, 1500);
  };

  const handleStartRoll = () => {
    if (!isMyTurn) return;
    const diceCount = (myPlayerInfo?.survivors.length || 1) + 1; 
    setGameState(prev => requestDiceRoll(prev, currentPlayerId, diceCount));
  };

  const handleEndTurn = () => {
    setGameState(prev => endPlayerTurn(prev));
    setSelectedDiceId(null);
    setActiveSurvivorId(null);
  };

  const handleDiceClick = (diceId: string, status: string) => {
    if (!isMyTurn || status === 'spent' || isTrayVisible) return;
    setSelectedDiceId(selectedDiceId === diceId ? null : diceId);
    setActiveSurvivorId(null);
  };

  const handleSurvivorClick = (survivorId: string) => {
    if (selectedDiceId) {
      // Если кубик выбран - применяем действие
      setActiveSurvivorId(survivorId);
    } else {
      // Если кубик не выбран - открываем карточку для просмотра
      setInspectedSurvivorId(survivorId);
    }
  };

  const handleActionExecution = (actionType: string) => {
    if (!selectedDiceId) return;
    setGameState(prev => spendDice(prev, currentPlayerId, selectedDiceId));
    console.log(`Действие: ${actionType}, Выживший: ${activeSurvivorId}`);
    setSelectedDiceId(null);
    setActiveSurvivorId(null);
  };

  // Рендеринг ЛОББИ
  if (gameState.phase === 'lobby') {
    return <CharacterSelection players={gameState.players} onGameStart={handleGameStart} />;
  }

  // Рендеринг ИГРОВОГО ПОЛЯ
  const selectedDiceValue = myPlayerInfo?.actionDice.find((d: ActionDice) => d.id === selectedDiceId)?.value || 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 overflow-hidden font-sans text-zinc-100">
      
      <DiceTray isVisible={isTrayVisible} playerName={rollingPlayerName} />
      <DiceRoller onRollComplete={handleRollComplete} />

      <div className="absolute inset-0 opacity-[0.03] bg-[url('/assets/noise.png')] pointer-events-none" />

      <TurnIndicator 
        round={gameState.round}
        activePlayerName={activePlayer?.name || 'Ожидание...'}
        isMyTurn={isMyTurn}
        onEndTurn={handleEndTurn}
      />

      <main className="pt-32 px-8 pb-32 max-w-7xl mx-auto flex flex-col gap-12 h-full">
        <section className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold tracking-widest text-zinc-500 mb-6 flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-cyan-600 animate-pulse"></span>
            КОЛОНИЯ (Ваши выжившие)
          </h2>
          <div className="flex gap-6">
            {myPlayerInfo?.survivors.map((survId: string) => {
              const surv = SURVIVORS[survId];
              if (!surv) return null;

              const isTargeted = activeSurvivorId === survId;
              
              return (
                <div 
                  key={surv.id}
                  onClick={() => handleSurvivorClick(surv.id)}
                  className={`
                    relative w-52 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer
                    ${selectedDiceId ? 'hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-1' : 'border-white/10 hover:border-zinc-500'}
                    ${isTargeted ? 'border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)] scale-105' : 'bg-black/40'}
                  `}
                >
                  <div className="h-32 w-full bg-zinc-800 relative">
                     <img src={surv.image} alt={surv.name} className="w-full h-full object-cover opacity-70" />
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                     <span className="bg-rose-900/80 text-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-700/50 backdrop-blur-sm">⚔ {surv.attack}+</span>
                     <span className="bg-cyan-900/80 text-cyan-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-700/50 backdrop-blur-sm">👁 {surv.search}+</span>
                  </div>
                  <div className="p-4 relative z-10 -mt-8">
                    <h3 className="font-black text-lg mb-0.5 drop-shadow-md">{surv.name}</h3>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">{surv.profession}</p>
                    <p className="text-xs text-zinc-500">Влияние: <span className="text-white font-bold">{surv.influence}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 bg-black/80 border-t border-white/10 backdrop-blur-xl flex justify-center items-center gap-8 z-30">
        
        {myPlayerInfo?.actionDice.length === 0 && isMyTurn ? (
          <button 
            onClick={handleStartRoll}
            className="px-8 py-3 bg-rose-700 hover:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest border border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all animate-pulse"
          >
            Бросить кубики действий
          </button>
        ) : (
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 shadow-inner relative">
            <span className="absolute -top-3 left-6 text-[10px] font-bold tracking-widest uppercase text-zinc-500 bg-black px-2">Ваши кубики</span>
            {myPlayerInfo?.actionDice.map((dice: ActionDice) => (
              <div
                key={dice.id}
                onClick={() => handleDiceClick(dice.id, dice.status)}
                className={`
                  flex items-center justify-center w-14 h-14 rounded-lg text-2xl font-black transition-all duration-300 select-none
                  ${dice.status === 'spent' 
                    ? 'bg-zinc-900/40 text-zinc-800 border border-zinc-800/50' 
                    : selectedDiceId === dice.id
                      ? 'bg-cyan-950 text-cyan-300 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] -translate-y-3'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-600 hover:border-zinc-400 cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                  }
                `}
              >
                {dice.value}
              </div>
            ))}
          </div>
        )}
      </footer>

      {activeSurvivorId && selectedDiceId && (
        <ActionMenu 
          survivorStats={SURVIVORS[activeSurvivorId]}
          selectedDiceValue={selectedDiceValue}
          onAction={handleActionExecution}
          onClose={() => setActiveSurvivorId(null)}
        />
      )}

      {/* Модальное окно просмотра персонажа */}
      {inspectedSurvivorId && (
        <SurvivorModal 
          survivor={SURVIVORS[inspectedSurvivorId]} 
          onClose={() => setInspectedSurvivorId(null)} 
        />
      )}
    </div>
  );
}