// src/games/DeadOfWinter/components/BoardScreen.tsx
import React, { useState } from 'react';
import { GameState, Player, ActionDice } from '../store/gameState';
import { endPlayerTurn, spendDice } from '../store/gameActions';
import { TurnIndicator } from './TurnIndicator';
import { ActionMenu } from './ActionMenu';
import { mockInitialState, mockSurvivors } from '../data/mockData';

export default function BoardScreen() {
  // Инициализация глобального состояния игры
  const [gameState, setGameState] = useState<GameState>(mockInitialState);
  
  // Локальное состояние для взаимодействия (Drag & Drop / Клики)
  const [selectedDiceId, setSelectedDiceId] = useState<string | null>(null);
  const [activeSurvivorId, setActiveSurvivorId] = useState<string | null>(null);

  const currentPlayerId = 'player_1'; // В реальности берется из контекста авторизации
  
  // Строгая типизация для метода find
  const activePlayer = gameState.players.find((p: Player) => p.id === gameState.activePlayerId);
  const isMyTurn = gameState.activePlayerId === currentPlayerId;

  // Обработчик завершения хода
  const handleEndTurn = () => {
    // Строгая типизация prevState
    setGameState((prevState: GameState) => endPlayerTurn(prevState));
    setSelectedDiceId(null);
    setActiveSurvivorId(null);
  };

  // Выбор кубика
  const handleDiceClick = (diceId: string, status: string) => {
    if (!isMyTurn || status === 'spent') return;
    setSelectedDiceId(selectedDiceId === diceId ? null : diceId);
    setActiveSurvivorId(null); // Сбрасываем выбранного выжившего при смене кубика
  };

  // Выбор выжившего для применения кубика
  const handleSurvivorClick = (survivorId: string) => {
    if (!selectedDiceId) return; // Если кубик не выбран, ничего не делаем
    setActiveSurvivorId(survivorId);
  };

  // Обработчик выполнения конкретного действия из ActionMenu
  const handleActionExecution = (actionType: string) => {
    if (!selectedDiceId) return;
    
    // Тратим кубик в глобальном стейте
    setGameState((prevState: GameState) => spendDice(prevState, currentPlayerId, selectedDiceId));
    
    // Здесь будет вызов API или отправка сокета
    console.log(`Выполнено действие: ${actionType} выжившим ${activeSurvivorId}`);
    
    // Сбрасываем выделение
    setSelectedDiceId(null);
    setActiveSurvivorId(null);
  };

  // Получаем данные текущего игрока для рендера
  const myPlayerInfo = gameState.players.find((p: Player) => p.id === currentPlayerId);
  const selectedDiceValue = myPlayerInfo?.actionDice.find((d: ActionDice) => d.id === selectedDiceId)?.value || 0;

  return (
    <div className="relative min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 overflow-hidden font-sans text-zinc-100">
      
      {/* Слой с эффектом снега/шума на фоне */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/assets/noise.png')] pointer-events-none" />

      {/* Верхняя панель хода */}
      <TurnIndicator 
        round={gameState.round}
        activePlayerName={activePlayer?.name || 'Ожидание...'}
        isMyTurn={isMyTurn}
        onEndTurn={handleEndTurn}
      />

      {/* Основная игровая зона */}
      <main className="pt-32 px-8 pb-32 max-w-7xl mx-auto flex flex-col gap-12 h-full">
        
        {/* Колония (Заглушка для локации) */}
        <section className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold tracking-widest text-zinc-500 mb-6">КОЛОНИЯ</h2>
          <div className="flex gap-6">
            {/* Строгая типизация survId */}
            {myPlayerInfo?.survivors.map((survId: string) => {
              const surv = mockSurvivors[survId as keyof typeof mockSurvivors];
              const isTargeted = activeSurvivorId === survId;
              
              return (
                <div 
                  key={surv.id}
                  onClick={() => handleSurvivorClick(surv.id)}
                  className={`
                    relative p-4 w-48 rounded-xl border transition-all duration-300
                    ${selectedDiceId ? 'cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'cursor-default border-white/10'}
                    ${isTargeted ? 'border-cyan-400 bg-cyan-900/20' : 'bg-zinc-900/50'}
                  `}
                >
                  <h3 className="font-bold text-lg mb-2">{surv.name}</h3>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><span className="text-rose-400">⚔</span> {surv.attack}+</span>
                    <span className="flex items-center gap-1"><span className="text-cyan-400">👁</span> {surv.search}+</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Нижняя панель: Инвентарь и Кубики (Поднос) */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-zinc-950/90 border-t border-white/10 backdrop-blur-md flex justify-center items-center gap-8">
        <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          {/* Строгая типизация dice */}
          {myPlayerInfo?.actionDice.map((dice: ActionDice) => (
            <div
              key={dice.id}
              onClick={() => handleDiceClick(dice.id, dice.status)}
              className={`
                flex items-center justify-center w-14 h-14 rounded-lg text-2xl font-black transition-all duration-200 select-none
                ${dice.status === 'spent' 
                  ? 'bg-zinc-900/50 text-zinc-700 border border-zinc-800 cursor-not-allowed' 
                  : selectedDiceId === dice.id
                    ? 'bg-cyan-900/80 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] -translate-y-2'
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-600 hover:border-zinc-400 cursor-pointer hover:-translate-y-1'
                }
              `}
            >
              {dice.value}
            </div>
          ))}
        </div>
      </footer>

      {/* Всплывающее меню действий */}
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