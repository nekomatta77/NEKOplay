// src/games/DeadOfWinter/components/DiceTray.tsx
import React from 'react';

interface Props {
  isVisible: boolean;
  playerName: string; // <--- Принимаем имя игрока
}

export default function DiceTray({ isVisible, playerName }: Props) {
  return (
    <div className={`fixed inset-0 z-[140] pointer-events-none transition-opacity duration-500 flex items-center justify-center p-5 sm:p-10 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Затемняющий фон */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* === ИМЯ ИГРОКА СВЕРХУ === */}
      <div className={`absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 z-30 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-widest drop-shadow-[0_5px_15px_rgba(220,38,38,0.8)] flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm md:text-lg text-slate-300 tracking-[0.3em] sm:tracking-[0.5em] mb-1 sm:mb-2 font-medium">Бросает кубики</span>
          {playerName || 'Игрок'}
        </h2>
      </div>

      {/* Поднос для кубиков */}
      <div className={`relative z-10 w-full max-w-5xl aspect-[16/10] sm:aspect-[16/9] mt-16 sm:mt-20 bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden transition-transform duration-500 ${isVisible ? 'scale-100 animate-zoom-in' : 'scale-95'} ${isVisible ? 'pointer-events-auto' : ''}`}>
        
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NDkzYjgiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>
        <div className="absolute inset-0 border-[20px] border-slate-900 rounded-3xl pointer-events-none shadow-inner"></div>

        {/* Сюда будут падать кубики */}
        <div id="dice-box-container" className="absolute inset-6 rounded-xl overflow-hidden z-20"></div>

        <div className="absolute bottom-6 left-6 right-6 h-1 bg-red-900/50 rounded-full blur-sm"></div>
      </div>
    </div>
  );
}