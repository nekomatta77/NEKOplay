// src/games/DeadOfWinter/components/BoardScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player, ActionDice } from '../store/gameState';
import { endPlayerTurn, spendDice, requestDiceRoll, applyRolledDice } from '../store/gameActions';
import { TurnIndicator } from './TurnIndicator';
import { ActionMenu } from './ActionMenu';
import DiceRoller from './DiceRoller';
import DiceTray from './DiceTray';
import { mockInitialState, mockSurvivors } from '../data/mockData';

export default function BoardScreen() {
  const [gameState, setGameState] = useState<GameState>(mockInitialState);
  
  const [selectedDiceId, setSelectedDiceId] = useState<string | null>(null);
  const [activeSurvivorId, setActiveSurvivorId] = useState<string | null>(null);
  
  // === Состояние 3D кубиков ===
  const [isTrayVisible, setIsTrayVisible] = useState(false);
  const [rollingPlayerName, setRollingPlayerName] = useState('');
  const lastTimestamp = useRef(gameState.lastDiceRequest?.timestamp || 0);

  const currentPlayerId = 'player_1'; 
  const activePlayer = gameState.players.find((p: Player) => p.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentPlayerId;
  const myPlayerInfo = gameState.players.find((p: Player) => p.id === currentPlayerId);

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

  // Завершение анимации броска
  const handleRollComplete = () => {
    setTimeout(() => {
      setIsTrayVisible(false);
      
      // Если бросал я, забираю кубики себе в руку (в глобальный стейт)
      if (gameState.lastDiceRequest?.playerId === currentPlayerId) {
         setGameState(prev => applyRolledDice(prev, currentPlayerId, prev.lastDiceRequest!.results));
      }
    }, 1500);
  };

  // Кнопка броска (когда у игрока нет кубиков)
  const handleStartRoll = () => {
    if (!isMyTurn) return;
    const diceCount = (myPlayerInfo?.survivors.length || 1) + 1; // 1 кубик + по 1 за каждого выжившего
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
    if (!selectedDiceId) return;
    setActiveSurvivorId(survivorId);
  };

  const handleActionExecution = (actionType: string) => {
    if (!selectedDiceId) return;
    setGameState(prev => spendDice(prev, currentPlayerId, selectedDiceId));
    console.log(`Действие: ${actionType}, Выживший: ${activeSurvivorId}`);
    setSelectedDiceId(null);
    setActiveSurvivorId(null);
  };

  const selectedDiceValue = myPlayerInfo?.actionDice.find((d: ActionDice) => d.id === selectedDiceId)?.value || 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 overflow-hidden font-sans text-zinc-100">
      
      {/* 3D Движок кубиков */}
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
            КОЛОНИЯ
          </h2>
          <div className="flex gap-6">
            {myPlayerInfo?.survivors.map((survId: string) => {
              const surv = mockSurvivors[survId as keyof typeof mockSurvivors];
              const isTargeted = activeSurvivorId === survId;
              
              return (
                <div 
                  key={surv.id}
                  onClick={() => handleSurvivorClick(surv.id)}
                  className={`
                    relative p-4 w-52 rounded-xl border transition-all duration-300
                    ${selectedDiceId ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-1' : 'cursor-default border-white/10'}
                    ${isTargeted ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(34,211,238,0.2)] scale-105' : 'bg-black/40'}
                  `}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                     <span className="bg-rose-900/50 text-rose-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-700/50">⚔ {surv.attack}+</span>
                     <span className="bg-cyan-900/50 text-cyan-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-cyan-700/50">👁 {surv.search}+</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 pr-16">{surv.name}</h3>
                  <p className="text-xs text-zinc-500">Влияние: {surv.influence}</p>
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
          <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 shadow-inner">
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
          survivorStats={mockSurvivors[activeSurvivorId as keyof typeof mockSurvivors]}
          selectedDiceValue={selectedDiceValue}
          onAction={handleActionExecution}
          onClose={() => setActiveSurvivorId(null)}
        />
      )}

    </div>
  );
}