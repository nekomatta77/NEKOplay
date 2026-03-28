// src/games/DeadOfWinter/components/BoardScreen.tsx
import React, { useState } from 'react';
import { DeadOfWinterState, LocationState } from '../state';
import { User, Room } from '../../../types';
import { getSurvivorData, SurvivorData } from '../data/survivors';
import SurvivorCard from './SurvivorCard';
import { MoraleIcon, FoodIcon, WasteIcon, ZombieIcon, SurvivorIcon, ObjectiveIcon, CrisisIcon, AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  gameState: DeadOfWinterState;
  user: User;
  room: Room;
  onLeave: () => void;
}

const LocationBadge = ({ icon, value }: { icon: React.ReactNode, value: number }) => (
  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-slate-700/50 text-xs sm:text-sm font-semibold shrink-0">
    {icon}
    <span className="text-white">{value}</span>
  </div>
);

export default function BoardScreen({ gameState, user, room, onLeave }: Props) {
  const [selectedSurvivor, setSelectedSurvivor] = useState<SurvivorData | null>(null);

  const playerState = gameState?.players?.[user.id];
  const survivorsInHand = (playerState?.survivors || []).map(id => getSurvivorData(id)).filter(Boolean);
  const handSize = (playerState?.hand || []).length;
  const actionDice = playerState?.actionDice || [];

  return (
    <div className="h-screen bg-slate-950 text-slate-300 font-sans flex flex-col relative overflow-hidden selection:bg-red-900/40">
      <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/020617/0f172a?text=DEAD+OF+WINTER')] bg-cover bg-center opacity-10 pointer-events-none"></div>

      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <header className="relative z-10 flex flex-wrap sm:flex-nowrap justify-between items-center p-2.5 sm:p-3 gap-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-5">
          <div className="flex flex-col">
            <h1 className="text-base sm:text-xl font-black text-white tracking-tighter shadow-red-500/20 drop-shadow-sm leading-tight">
              <span className="text-red-600">DEAD</span> OF WINTER
            </h1>
            <span className="text-[8px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Раунд {gameState?.round || 1} | Фаза: {gameState?.phase || 'Ожидание'}
            </span>
          </div>
          <div className="flex gap-1.5 sm:gap-2.5 items-center">
            {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: Перенесли title="Мораль" на родительский div */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-red-900/50" title="Мораль">
              <MoraleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span className="font-black text-white text-sm sm:text-lg leading-none">{gameState?.morale || 0}</span>
            </div>
            {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: Перенесли title="Еда на складе" на родительский div */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-emerald-900/50" title="Еда на складе">
              <FoodIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              <span className="font-black text-white text-sm sm:text-lg leading-none">{gameState?.food || 0}</span>
            </div>
            {/* ИСПРАВЛЕНИЕ ЗДЕСЬ: Перенесли title="Мусор" на родительский div */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/50" title="Мусор">
              <WasteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
              <span className="font-black text-white text-sm sm:text-lg leading-none">{gameState?.waste || 0}</span>
            </div>
          </div>
        </div>
        <button onClick={onLeave} className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition active:scale-95">
          Покинуть игру
        </button>
      </header>

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ */}
      <main className="relative z-10 flex-1 p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
        <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-3 sm:p-5 overflow-y-auto custom-scrollbar shadow-inner">
          <h3 className="text-slate-500 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-3 pl-1">Локации города</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(gameState?.locations || {}).map(([key, locData]) => {
              if (key === 'colony') return null;
              const loc = locData as LocationState;
              const names: any = { policeStation: 'Полицейский участок', groceryStore: 'Продуктовый магазин', school: 'Средняя школа', library: 'Городская библиотека', hospital: 'Больница', gasStation: 'Заправка' };
              
              return (
                <div key={key} className="bg-slate-800/80 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-slate-700 hover:border-slate-500 transition cursor-pointer group shadow-lg flex flex-col gap-2.5">
                  <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-red-400 transition truncate">{names[key] || key}</h4>
                  <div className="flex gap-2.5 flex-wrap">
                    <LocationBadge icon={<ZombieIcon className="w-3.5 h-3.5 text-lime-500" />} value={loc?.zombies || 0} />
                    <LocationBadge icon={<SurvivorIcon className="w-3.5 h-3.5 text-slate-400" />} value={(loc?.survivors || []).length} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 shrink-0">
          <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-4 flex gap-4 shadow-lg items-center">
            <ObjectiveIcon />
            <div>
              <h3 className="text-blue-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-0.5">Главная цель</h3>
              <p className="text-white text-xs sm:text-sm font-semibold">{gameState?.mainObjective || 'Загрузка...'}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-4 flex gap-4 shadow-lg items-center">
            <CrisisIcon />
            <div>
              <h3 className="text-red-500 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-0.5">Текущий кризис</h3>
              <p className="text-white text-xs sm:text-sm font-semibold">{gameState?.currentCrisis || "Кризис не открыт"}</p>
            </div>
          </div>
          <div className="flex-1 min-h-[100px] bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-inner text-center text-slate-600 text-sm italic flex items-center justify-center">
            Чат / Лог событий
          </div>
        </div>
      </main>

      {/* НИЖНЯЯ ПАНЕЛЬ */}
      <footer className="relative z-20 p-2.5 sm:p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.4)] shrink-0 flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto">
        <div className="flex flex-row lg:flex-col justify-between items-center lg:items-stretch lg:justify-center lg:w-48 lg:border-r border-b lg:border-b-0 border-slate-800 pb-3 lg:pb-0 lg:pr-6 gap-3 shrink-0">
          <div className="flex lg:flex-col items-center lg:items-start gap-2.5 lg:gap-3">
            <h3 className="hidden lg:block text-xs font-bold text-slate-500 uppercase tracking-widest">Кубики действий</h3>
            <div className="flex gap-2">
              {actionDice.length > 0 ? (
                actionDice.map((dice, i) => (
                  <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 border-2 border-slate-700 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-black text-white shadow-inner select-none">
                    {dice}
                  </div>
                ))
              ) : (
                <div className="text-xs sm:text-sm text-slate-600 italic py-1 sm:py-2">Не брошены</div>
              )}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl flex gap-3 justify-between items-center text-sm sm:text-base mt-auto lg:mt-0">
            <span className="font-medium text-slate-400 truncate">Карты в руке</span>
            <span className="font-bold text-white text-base sm:text-lg bg-slate-800 px-3 py-1 rounded-lg">{handSize}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1 hidden lg:block">Ваша группа выживших</h3>
          <div className="flex gap-8 sm:gap-12 overflow-x-auto overflow-y-hidden pt-4 pb-6 px-4 custom-scrollbar snap-x snap-mandatory h-[240px] sm:h-[280px] lg:h-[300px]">
            {survivorsInHand.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl h-full w-full flex items-center justify-center text-slate-700 text-sm font-medium">
                Группа пуста
              </div>
            ) : (
              survivorsInHand.map(survivor => (
                <div key={survivor.id} className="snap-center h-full shrink-0">
                  <SurvivorCard survivor={survivor} onClick={() => setSelectedSurvivor(survivor)} />
                </div>
              ))
            )}
          </div>
        </div>
      </footer>

      {/* ВСПЛЫВАЮЩЕЕ ОКНО ПЕРСОНАЖА */}
      {selectedSurvivor && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedSurvivor(null)} 
        >
          <div 
            className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row animate-zoom-in"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setSelectedSurvivor(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 bg-black/60 hover:bg-red-600 border border-slate-600 hover:border-red-500 rounded-full text-white transition-all backdrop-blur-md"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-full sm:w-2/5 h-64 sm:h-auto relative bg-slate-800 shrink-0">
              <img 
                src={selectedSurvivor.image} 
                alt={selectedSurvivor.name} 
                className="w-full h-full object-cover object-top" 
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900 to-transparent sm:hidden"></div>
            </div>

            <div className="w-full sm:w-3/5 p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 bg-slate-900">
              <div className="pr-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-none mb-2 text-shadow-lg">
                  {selectedSurvivor.name}
                </h2>
                <p className="text-sm sm:text-base text-slate-400 font-mono inline-block bg-slate-950 px-3 py-1 rounded-md border border-slate-800">
                  {selectedSurvivor.profession}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-inner">
                  <InfluenceIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 drop-shadow-md" />
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Влияние</span>
                  <span className="text-xl sm:text-3xl font-black text-white leading-none">{selectedSurvivor.influence}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-inner">
                  <AttackIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 drop-shadow-md" />
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Атака</span>
                  <span className="text-xl sm:text-3xl font-black text-white leading-none">{selectedSurvivor.attack}+</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 shadow-inner">
                  <SearchIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 drop-shadow-md" />
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">Поиск</span>
                  <span className="text-xl sm:text-3xl font-black text-white leading-none">{selectedSurvivor.search}+</span>
                </div>
              </div>

              <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 sm:p-6 shadow-md mt-2">
                <h3 className="text-sm sm:text-base font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                  {selectedSurvivor.abilityTitle}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                  {selectedSurvivor.abilityDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.4); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}