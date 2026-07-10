// src/games/DeadOfWinter/components/TurnIndicator.tsx
import React from 'react';

interface TurnIndicatorProps {
  round: number;
  activePlayerName: string;
  isMyTurn: boolean;
  onEndTurn: () => void;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({ 
  round, 
  activePlayerName, 
  isMyTurn, 
  onEndTurn 
}) => {
  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-gradient-to-b from-zinc-950/90 to-transparent backdrop-blur-sm pointer-events-none">
      
      {/* Информация о раунде */}
      <div className="flex flex-col">
        <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Раунд</span>
        <span className="text-cyan-100 text-3xl font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
          {round}
        </span>
      </div>

      {/* Центральный индикатор активного игрока */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="px-8 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md shadow-2xl">
          <span className="text-zinc-400 text-sm tracking-wide mr-2">Ходит:</span>
          <span className={`text-lg font-bold tracking-wider ${isMyTurn ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-zinc-200'}`}>
            {isMyTurn ? 'ВЫ' : activePlayerName}
          </span>
        </div>
      </div>

      {/* Кнопка завершения хода (активна только для ходящего игрока) */}
      <div className="flex items-center pointer-events-auto">
        <button
          onClick={onEndTurn}
          disabled={!isMyTurn}
          className={`
            relative overflow-hidden px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-300
            ${isMyTurn 
              ? 'bg-rose-900/40 text-rose-100 border border-rose-500/50 hover:bg-rose-800/60 hover:shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 cursor-pointer' 
              : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800 cursor-not-allowed'}
          `}
        >
          Завершить ход
          {/* Блик на кнопке при активном ходе */}
          {isMyTurn && (
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
          )}
        </button>
      </div>

    </div>
  );
};