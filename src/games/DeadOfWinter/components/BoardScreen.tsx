// src/games/DeadOfWinter/components/BoardScreen.tsx
import React from 'react';
import { DeadOfWinterState, LocationState } from '../state';
import { User, Room } from '../../../types';

interface Props {
  gameState: DeadOfWinterState;
  user: User;
  room: Room;
  onLeave: () => void;
}

const HeartIcon = () => <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
const FoodIcon = () => <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455A1 1 0 0112 18H8a1 1 0 01-.967-.744L5.854 12.8 2.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 018 2h4z" clipRule="evenodd" /></svg>;

export default function BoardScreen({ gameState, user, room, onLeave }: Props) {
  // Безопасное получение данных игрока
  const playerState = gameState?.players?.[user.id];
  const handSize = (playerState?.hand || []).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/zombies/1920/1080')] bg-cover bg-center opacity-10 blur-[2px] pointer-events-none"></div>

      <header className="relative z-10 flex flex-wrap justify-between items-center p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-md gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-red-600 tracking-wider drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">КОЛОНИЯ</h1>
            <span className="text-xs font-mono text-slate-500">Раунд {gameState?.round || 1} | Фаза: {gameState?.phase || 'unknown'}</span>
          </div>
          
          <div className="h-10 w-px bg-slate-700 hidden sm:block"></div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <HeartIcon />
              <span className="font-bold text-white text-lg">{gameState?.morale || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Мораль</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <FoodIcon />
              <span className="font-bold text-white text-lg">{gameState?.food || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Еда</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-xl">🗑️</span>
              <span className="font-bold text-white text-lg">{gameState?.waste || 0}</span>
              <span className="text-xs text-slate-500 uppercase">Мусор</span>
            </div>
          </div>
        </div>

        <button onClick={onLeave} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold border border-slate-700 transition">
          Меню
        </button>
      </header>

      <main className="relative z-10 flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-sm p-5 rounded-2xl border border-blue-900/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🎯</div>
              <h3 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-2">Главная Цель</h3>
              <p className="text-white text-lg font-serif">{gameState?.mainObjective || 'Загрузка...'}</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-sm p-5 rounded-2xl border border-red-900/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚠️</div>
              <h3 className="text-red-500 font-bold text-sm tracking-widest uppercase mb-2">Текущий Кризис</h3>
              <p className="text-white text-lg font-serif">{gameState?.currentCrisis || "Кризис еще не открыт"}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-slate-500 font-bold text-sm tracking-widest uppercase mb-4 pl-2">Локации</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(gameState?.locations || {}).map(([key, locData]) => {
                if (key === 'colony') return null;
                const loc = locData as LocationState;
                const names: any = { policeStation: 'Полицейский участок', groceryStore: 'Продуктовый', school: 'Школа', library: 'Библиотека', hospital: 'Больница', gasStation: 'Заправка' };
                
                // БЕЗОПАСНЫЕ ЧТЕНИЯ (FALLBACKS)
                const zombiesCount = loc?.zombies || 0;
                const survivorsCount = (loc?.survivors || []).length;

                return (
                  <div key={key} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 hover:border-slate-600 transition cursor-pointer group">
                    <h4 className="font-bold text-white mb-2 group-hover:text-red-400 transition">{names[key] || key}</h4>
                    <div className="flex gap-3 text-sm">
                      <span className="bg-slate-950 px-2 py-1 rounded text-slate-400">🧟 {zombiesCount}</span>
                      <span className="bg-slate-950 px-2 py-1 rounded text-slate-400">🧍 {survivorsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 flex flex-col shadow-2xl">
          <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-xl font-black text-white tracking-wide">Ваша зона</h2>
            <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono">{user.name}</span>
          </header>

          <div className="flex-1 flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Кубики действий</h3>
              <div className="flex gap-2">
                {/* Если кубики еще не брошены, показываем пустые слоты */}
                {(playerState?.actionDice || []).length > 0 ? (
                  playerState?.actionDice.map((dice, i) => (
                    <div key={i} className="w-12 h-12 bg-red-900/20 border border-red-500/30 rounded-xl flex items-center justify-center text-xl font-black text-red-500 shadow-inner">
                      {dice}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 italic">Кубики не брошены</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ваши выжившие</h3>
              <div className="border-2 border-dashed border-slate-800 rounded-xl h-32 flex items-center justify-center text-slate-600 text-sm">
                {(playerState?.survivors || []).length === 0 ? 'Нет выживших' : `${playerState?.survivors.length} выживших`}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Карты в руке</h3>
              <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-sm">
                {handSize} карт
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.4); }
      `}</style>
    </div>
  );
}