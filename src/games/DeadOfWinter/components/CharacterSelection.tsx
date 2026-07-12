// src/games/DeadOfWinter/components/CharacterSelection.tsx
import React, { useState } from 'react';
import { SURVIVORS } from '../data/survivors';
import { Player } from '../store/gameState';

interface CharacterSelectionProps {
  players: Player[];
  onGameStart: (selections: Record<string, string[]>) => void;
}

export default function CharacterSelection({ players, onGameStart }: CharacterSelectionProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [globalSelections, setGlobalSelections] = useState<Record<string, string[]>>({});
  const [currentPicks, setCurrentPicks] = useState<string[]>([]);
  
  const currentPlayer = players[currentPlayerIndex];
  const allSurvivorIds = Object.keys(SURVIVORS);
  
  // Все герои, которых УЖЕ забрали другие игроки
  const takenSurvivors = Object.values(globalSelections).flat();

  const toggleSelection = (id: string) => {
    if (takenSurvivors.includes(id)) return; // Нельзя взять чужого

    if (currentPicks.includes(id)) {
      setCurrentPicks(currentPicks.filter(s => s !== id));
    } else {
      if (currentPicks.length < 2) {
        setCurrentPicks([...currentPicks, id]);
      }
    }
  };

  const handleConfirmPicks = () => {
    const newSelections = { ...globalSelections, [currentPlayer.id]: currentPicks };
    setGlobalSelections(newSelections);
    
    if (currentPlayerIndex + 1 < players.length) {
      // Переход к следующему игроку
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setCurrentPicks([]);
    } else {
      // Все игроки выбрали, стартуем игру
      onGameStart(newSelections);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 flex flex-col items-center">
      <div className="text-center mb-10 mt-6">
        <h1 className="text-5xl font-black text-rose-700 tracking-widest uppercase mb-4 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]">
          Мертвые перекрестки
        </h1>
        <div className="inline-block bg-zinc-900 border border-zinc-700 px-6 py-3 rounded-xl shadow-lg">
          <p className="text-zinc-400 uppercase text-sm font-bold tracking-wider mb-1">Очередь выбора</p>
          <p className="text-2xl font-black text-cyan-400">{currentPlayer.name}, выберите 2 выживших ({currentPicks.length}/2)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl pb-32">
        {allSurvivorIds.map((id) => {
          const surv = SURVIVORS[id];
          const isSelectedByMe = currentPicks.includes(id);
          const isTakenByOther = takenSurvivors.includes(id);

          return (
            <div 
              key={id} 
              onClick={() => toggleSelection(id)}
              className={`
                relative bg-zinc-900 border-2 rounded-xl overflow-hidden transition-all duration-300
                ${isTakenByOther ? 'opacity-30 grayscale cursor-not-allowed border-zinc-800' : 'cursor-pointer'}
                ${isSelectedByMe ? 'border-rose-500 scale-105 shadow-[0_0_30px_rgba(225,29,72,0.3)]' : (!isTakenByOther && 'border-zinc-800 hover:border-zinc-600 hover:-translate-y-2')}
              `}
            >
              <div className="h-48 w-full bg-zinc-800 relative">
                <img src={surv.image} alt={surv.name} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                
                {isSelectedByMe && (
                  <div className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">ВЫБРАН</div>
                )}
                {isTakenByOther && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-rose-500 font-black tracking-widest uppercase rotate-[-15deg] border-2 border-rose-500 px-4 py-1 rounded">ЗАНЯТ</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold uppercase truncate">{surv.name}</h3>
                <p className="text-xs text-cyan-500 font-bold mb-3">{surv.profession}</p>
                <div className="flex gap-2 text-[10px] uppercase font-bold text-center">
                  <div className="flex-1 bg-black/50 p-1 rounded border border-white/5">Влияние {surv.influence}</div>
                  <div className="flex-1 bg-rose-950/50 p-1 rounded border border-rose-900/50 text-rose-300">Атака {surv.attack}+</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex justify-center z-50">
        <button
          disabled={currentPicks.length !== 2}
          onClick={handleConfirmPicks}
          className={`
            px-12 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all duration-300
            ${currentPicks.length === 2 
              ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] cursor-pointer hover:scale-105' 
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}
          `}
        >
          {currentPicks.length === 2 
            ? (currentPlayerIndex + 1 < players.length ? 'Подтвердить и передать ход' : 'Начать игру') 
            : 'Выберите 2 выживших'}
        </button>
      </div>
    </div>
  );
}