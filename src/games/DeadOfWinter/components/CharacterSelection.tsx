// src/games/DeadOfWinter/components/CharacterSelection.tsx
import React, { useState } from 'react';
import { SURVIVORS } from '../data/survivors';

interface CharacterSelectionProps {
  onGameStart: (selectedIds: string[]) => void;
}

export default function CharacterSelection({ onGameStart }: CharacterSelectionProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const allSurvivorIds = Object.keys(SURVIVORS);

  const toggleSelection = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      if (selected.length < 2) { // По правилам выбираем 2 стартовых героев
        setSelected([...selected, id]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100 flex flex-col items-center">
      <div className="text-center mb-10 mt-10">
        <h1 className="text-5xl font-black text-rose-700 tracking-widest uppercase mb-4 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]">
          Мертвые перекрестки
        </h1>
        <p className="text-xl text-zinc-400">Выберите двух стартовых выживших ({selected.length}/2)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl">
        {allSurvivorIds.map((id) => {
          const surv = SURVIVORS[id];
          const isSelected = selected.includes(id);

          return (
            <div 
              key={id} 
              onClick={() => toggleSelection(id)}
              className={`
                relative bg-zinc-900 border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                ${isSelected ? 'border-rose-500 scale-105 shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'border-zinc-800 hover:border-zinc-600 hover:-translate-y-2'}
              `}
            >
              <div className="h-48 w-full bg-zinc-800 relative">
                <img src={surv.image} alt={surv.name} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                
                {/* Метка выбора */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
                    ВЫБРАН
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold uppercase truncate">{surv.name}</h3>
                <p className="text-xs text-cyan-500 font-bold mb-3">{surv.profession}</p>
                
                <div className="flex gap-2 text-[10px] uppercase font-bold text-center">
                  <div className="flex-1 bg-black/50 p-1 rounded border border-white/5">Влияние: {surv.influence}</div>
                  <div className="flex-1 bg-rose-950/50 p-1 rounded border border-rose-900/50 text-rose-300">Атака {surv.attack}+</div>
                  <div className="flex-1 bg-cyan-950/50 p-1 rounded border border-cyan-900/50 text-cyan-300">Поиск {surv.search}+</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Кнопка старта */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-black/90 backdrop-blur-md border-t border-zinc-800 flex justify-center z-50">
        <button
          disabled={selected.length !== 2}
          onClick={() => onGameStart(selected)}
          className={`
            px-12 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all duration-300
            ${selected.length === 2 
              ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] cursor-pointer hover:scale-105' 
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}
          `}
        >
          {selected.length === 2 ? 'Начать игру' : 'Выберите 2 выживших'}
        </button>
      </div>
    </div>
  );
}