// src/games/DeadOfWinter/components/DiceTray.tsx
import React from 'react';

interface Props {
  isVisible: boolean;
  playerName: string;
}

export default function DiceTray({ isVisible, playerName }: Props) {
  return (
    <div className={`fixed inset-0 z-[140] pointer-events-none transition-opacity duration-500 flex items-center justify-center p-5 sm:p-10 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Затемняющий фон с блюром */}
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* ИМЯ ИГРОКА */}
      <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-30 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_30px_rgba(225,29,72,0.8)] flex flex-col items-center text-center">
          <span className="text-sm text-zinc-400 tracking-[0.4em] mb-2 font-bold">Бросает кубики</span>
          {playerName}
        </h2>
      </div>

      {/* Сам поднос */}
      <div className={`relative z-10 w-full max-w-4xl aspect-[16/9] mt-20 bg-zinc-950 border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden transition-transform duration-500 ${isVisible ? 'scale-100' : 'scale-95'} ${isVisible ? 'pointer-events-auto' : ''}`}>
        
        {/* Текстура дна подноса (кожа/ткань) */}
        <div className="absolute inset-0 opacity-30 bg-[url('/assets/noise.png')] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none"></div>
        
        {/* Внутренняя тень бортов */}
        <div className="absolute inset-0 border-[16px] border-black/40 rounded-[2rem] pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,1)] z-20"></div>

        {/* Контейнер для 3D канваса */}
        <div id="dice-box-container" className="absolute inset-0 z-10"></div>
      </div>
    </div>
  );
}