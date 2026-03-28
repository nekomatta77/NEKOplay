// src/games/DeadOfWinter/components/BoardScreen.tsx
import React from 'react';
import { DeadOfWinterState, LocationState } from '../state';
import { User, Room } from '../../../types';
import { getSurvivorData } from '../data/survivors';
import SurvivorCard from './SurvivorCard';
import { MoraleIcon, FoodIcon, WasteIcon, ZombieIcon, SurvivorIcon, ObjectiveIcon, CrisisIcon } from './Icons';

interface Props {
  gameState: DeadOfWinterState;
  user: User;
  room: Room;
  onLeave: () => void;
}

const LocationBadge = ({ icon, value }: { icon: React.ReactNode, value: number }) => (
  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-slate-700/50 text-xs sm:text-sm font-semibold">
    {icon}
    <span className="text-white">{value}</span>
  </div>
);

export default function BoardScreen({ gameState, user, room, onLeave }: Props) {
  const playerState = gameState?.players?.[user.id];
  
  const survivorsInHand = (playerState?.survivors || []).map(id => getSurvivorData(id)).filter(Boolean);
  const handSize = (playerState?.hand || []).length;
  const actionDice = playerState?.actionDice || [];

  return (
    <div className="h-screen bg-slate-950 text-slate-300 font-sans flex flex-col relative overflow-hidden selection:bg-red-900/40">
      <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/020617/0f172a?text=DEAD+OF+WINTER')] bg-cover bg-center opacity-10 pointer-events-none"></div>

      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <header className="relative z-10 flex flex-wrap sm:flex-nowrap justify-between items-center p-2 sm:p-3 gap-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl shrink-0">
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
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-red-900/50">
              <MoraleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span className="font-black text-white text-sm sm:text-lg">{gameState?.morale || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-emerald-900/50">
              <FoodIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              <span className="font-black text-white text-sm sm:text-lg">{gameState?.food || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-700/50">
              <WasteIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
              <span className="font-black text-white text-sm sm:text-lg">{gameState?.waste || 0}</span>
            </div>
          </div>
        </div>

        <button onClick={onLeave} className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition active:scale-95">
          Покинуть игру
        </button>
      </header>

      {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ */}
      <main className="relative z-10 flex-1 p-2 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
        {/* Локации города */}
        <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-3 sm:p-5 overflow-y-auto custom-scrollbar shadow-inner">
          <h3 className="text-slate-500 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-3 pl-1">Локации города</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(gameState?.locations || {}).map(([key, locData]) => {
              if (key === 'colony') return null;
              const loc = locData as LocationState;
              const names: any = { policeStation: 'Полицейский участок', groceryStore: 'Продуктовый магазин', school: 'Средняя школа', library: 'Городская библиотека', hospital: 'Больница', gasStation: 'Заправка' };
              
              return (
                <div key={key} className="bg-slate-800/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-700 hover:border-slate-500 transition cursor-pointer group shadow-lg">
                  <h4 className="font-bold text-white text-sm sm:text-base mb-2 sm:mb-3 group-hover:text-red-400 transition truncate">{names[key] || key}</h4>
                  <div className="flex gap-2">
                    <LocationBadge icon={<ZombieIcon className="w-3.5 h-3.5 text-lime-500" />} value={loc?.zombies || 0} />
                    <LocationBadge icon={<SurvivorIcon className="w-3.5 h-3.5 text-slate-400" />} value={(loc?.survivors || []).length} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая зона */}
        <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3 shrink-0">
          <div className="bg-slate-900 border border-blue-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-3 shadow-lg">
            <ObjectiveIcon />
            <div>
              <h3 className="text-blue-400 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-0.5">Главная цель</h3>
              <p className="text-white text-xs sm:text-sm font-semibold">{gameState?.mainObjective || 'Загрузка цели...'}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-red-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-3 shadow-lg">
            <CrisisIcon />
            <div>
              <h3 className="text-red-500 font-bold text-[10px] sm:text-xs tracking-widest uppercase mb-0.5">Текущий кризис</h3>
              <p className="text-white text-xs sm:text-sm font-semibold">{gameState?.currentCrisis || "Кризис не открыт"}</p>
            </div>
          </div>
          <div className="flex-1 min-h-[100px] bg-slate-900/50 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg text-center text-slate-600 text-xs sm:text-sm italic flex items-center justify-center">
            Чат / Лог событий
          </div>
        </div>
      </main>

      {/* НИЖНЯЯ ПАНЕЛЬ (Теперь значительно выше и вместительнее) */}
      <footer className="relative z-20 p-2 sm:p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] shrink-0 flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[320px]">
        
        {/* Блок с кубиками и картами */}
        <div className="flex flex-row lg:flex-col justify-between items-center lg:items-stretch lg:justify-center lg:w-48 lg:border-r border-b lg:border-b-0 border-slate-800 pb-3 lg:pb-0 lg:pr-6 gap-3 sm:gap-4 shrink-0">
          
          <div className="hidden lg:flex justify-between items-center">
            <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-mono font-bold truncate text-white">{user.name}</span>
          </div>
          
          <div className="flex lg:flex-col items-center lg:items-start gap-2 lg:gap-3">
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

          <div className="bg-slate-950 border border-slate-700 px-3 py-2 sm:p-3 rounded-xl flex gap-3 justify-between items-center text-sm sm:text-base mt-auto lg:mt-0">
            <span className="font-medium text-slate-400 truncate">Карты в руке</span>
            <span className="font-bold text-white text-base sm:text-lg bg-slate-800 px-3 py-1 rounded-md">{handSize}</span>
          </div>
        </div>

        {/* Блок с выжившими (Увеличенная высота и отступы) */}
        <div className="flex-1 flex flex-col min-w-0">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1 hidden lg:block">Ваша группа выживших</h3>
          
          {/* Контейнер с отступами (pt-2 pb-4 px-3), чтобы абсолютно позиционированные значки не обрезались скроллом */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto overflow-y-hidden pt-2 pb-4 px-3 custom-scrollbar snap-x h-[200px] sm:h-[240px] lg:h-full">
            {survivorsInHand.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl h-full w-full flex items-center justify-center text-slate-700 text-xs sm:text-sm font-medium">
                Группа пуста
              </div>
            ) : (
              survivorsInHand.map(survivor => (
                <div key={survivor.id} className="snap-center h-full shrink-0">
                  <SurvivorCard survivor={survivor} />
                </div>
              ))
            )}
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.4); }
      `}</style>
    </div>
  );
}