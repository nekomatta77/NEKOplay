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

// Вспомогательная иконка для локаций
const LocationBadge = ({ icon, value }: { icon: React.ReactNode, value: number }) => (
  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-slate-700/50 text-sm font-semibold">
    {icon}
    <span className="text-white">{value}</span>
  </div>
);

export default function BoardScreen({ gameState, user, room, onLeave }: Props) {
  const playerState = gameState?.players?.[user.id];
  
  // Данные для личной зоны
  const survivorsInHand = (playerState?.survivors || []).map(id => getSurvivorData(id)).filter(Boolean);
  const handSize = (playerState?.hand || []).length;
  const actionDice = playerState?.actionDice || [];

  return (
    <div className="h-screen bg-slate-950 text-slate-300 font-sans flex flex-col relative overflow-hidden selection:bg-red-900/40">
      
      {/* Фоновый арт (очень тусклый) */}
      <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/020617/0f172a?text=DEAD+OF+WINTER')] bg-cover bg-center opacity-10 pointer-events-none"></div>

      {/* --- ВЕРХНЯЯ ПАНЕЛЬ (HEADER) --- */}
      <header className="relative z-10 flex justify-between items-center p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tighter shadow-red-500/20 drop-shadow-sm">
              <span className="text-red-600">DEAD</span> OF WINTER
            </h1>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Раунд {gameState?.round || 1} | Фаза: {gameState?.phase || 'Ожидание'}
            </span>
          </div>
          
          <div className="flex gap-2.5 items-center">
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-red-900/50" title="Мораль">
              <MoraleIcon className="w-5 h-5 text-red-500" />
              <span className="font-black text-white text-lg">{gameState?.morale || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-emerald-900/50" title="Еда на складе">
              <FoodIcon className="w-5 h-5 text-emerald-500" />
              <span className="font-black text-white text-lg">{gameState?.food || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50" title="Мусор в баке">
              <WasteIcon className="w-5 h-5 text-slate-500" />
              <span className="font-black text-white text-lg">{gameState?.waste || 0}</span>
            </div>
          </div>
        </div>

        <button onClick={onLeave} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold border border-slate-700 transition active:scale-95">
          Покинуть игру
        </button>
      </header>

      {/* --- ЦЕНТРАЛЬНАЯ ЧАСТЬ (ИГРОВОЕ ПОЛЕ И ЦЕЛИ) --- */}
      <main className="relative z-10 flex-1 p-4 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden">
        
        {/* Центральная зона (Локации города) */}
        <div className="col-span-1 lg:col-span-4 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800 p-5 overflow-y-auto custom-scrollbar shadow-inner">
          <h3 className="text-slate-500 font-bold text-xs tracking-widest uppercase mb-4 pl-1">Локации города</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(gameState?.locations || {}).map(([key, locData]) => {
              if (key === 'colony') return null; // Колонию не рисуем как обычную локацию
              const loc = locData as LocationState;
              const names: any = { policeStation: 'Полицейский участок', groceryStore: 'Продуктовый магазин', school: 'Средняя школа', library: 'Городская библиотека', hospital: 'Больница', gasStation: 'Заправка' };
              
              return (
                <div key={key} className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700 hover:border-slate-500 transition cursor-pointer group shadow-lg">
                  <h4 className="font-bold text-white text-base mb-3 group-hover:text-red-400 transition truncate">{names[key] || key}</h4>
                  <div className="flex gap-2">
                    <LocationBadge icon={<ZombieIcon className="w-4 h-4 text-lime-500" />} value={loc?.zombies || 0} />
                    <LocationBadge icon={<SurvivorIcon className="w-4 h-4 text-slate-400" />} value={(loc?.survivors || []).length} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Правая зона (Цели и Кризис) */}
        <div className="col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-4 flex gap-3 shadow-lg">
            <ObjectiveIcon />
            <div>
              <h3 className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-1">Главная цель</h3>
              <p className="text-white text-sm font-semibold">{gameState?.mainObjective || 'Загрузка цели...'}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-4 flex gap-3 shadow-lg">
            <CrisisIcon />
            <div>
              <h3 className="text-red-500 font-bold text-xs tracking-widest uppercase mb-1">Текущий кризис</h3>
              <p className="text-white text-sm font-semibold">{gameState?.currentCrisis || "Кризис не открыт"}</p>
            </div>
          </div>
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-lg text-center text-slate-600 text-sm italic flex items-center justify-center">
            Чат / Лог событий
          </div>
        </div>
      </main>

      {/* --- НИЖНЯЯ ПАНЕЛЬ (ЛИЧНАЯ ЗОНА ИГРОКА) --- */}
      <footer className="relative z-20 p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] shrink-0 h-[220px] flex gap-5">
        
        {/* Блок с кубиками и картами */}
        <div className="w-48 flex flex-col gap-3 justify-center border-r border-slate-800 pr-5">
          <div className="flex justify-between items-center">
            <span className="bg-slate-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold truncate text-white">{user.name}</span>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Кубики действий</h3>
            <div className="flex gap-1.5">
              {actionDice.length > 0 ? (
                actionDice.map((dice, i) => (
                  <div key={i} className="w-10 h-10 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center text-xl font-black text-white shadow-inner select-none">
                    {dice}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-600 italic py-2">Не брошены</div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg flex justify-between items-center text-sm">
            <span className="font-medium text-slate-400">Карты в руке</span>
            <span className="font-bold text-white text-base bg-slate-800 px-2.5 py-0.5 rounded-md">{handSize}</span>
          </div>
        </div>

        {/* Блок с выжившими (самый большой) */}
        <div className="flex-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Ваша группа выживших</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x h-[160px]">
            {survivorsInHand.length === 0 ? (
              <div className="border-2 border-dashed border-slate-800 rounded-xl h-full w-full flex items-center justify-center text-slate-700 text-sm font-medium">
                Группа пуста
              </div>
            ) : (
              survivorsInHand.map(survivor => (
                <div key={survivor.id} className="snap-center h-full">
                  <SurvivorCard survivor={survivor} />
                </div>
              ))
            )}
          </div>
        </div>
      </footer>

      {/* Стили для скроллбара */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.3); }
      `}</style>
    </div>
  );
}