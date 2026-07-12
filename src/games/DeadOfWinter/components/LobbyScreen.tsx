// src/games/DeadOfWinter/components/LobbyScreen.tsx
import React from 'react';
import { User, Room } from '../../../types';
import { ObjectiveIcon } from './Icons';

interface Props {
  user: User;
  room: Room;
  onLeave: () => void;
  onStart: () => void;
}

export default function LobbyScreen({ user, room, onLeave, onStart }: Props) {
  const players = room.players || [];
  const isHost = players.find(p => p.id === user.id)?.isHost || false;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-4 sm:p-6 lg:p-10 flex flex-col relative selection:bg-rose-900/40 overflow-hidden">
      
      {/* Атмосферный фон */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/assets/noise.png')] pointer-events-none"></div>

      {/* ХЕДЕР */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl mb-6 lg:mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight drop-shadow-[0_0_15px_rgba(225,29,72,0.4)]">
            <span className="text-rose-600">DEAD</span> OF WINTER
          </h1>
          <p className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">
            Фаза подготовки | Базовая игра
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 shadow-inner">
          <span className="text-zinc-500 font-medium text-sm">Комната:</span>
          <span className="text-white font-black text-lg tracking-wide">{room.name}</span>
          <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
          <span className="font-bold text-cyan-400 text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            {players.length}/5
          </span>
        </div>
      </header>

      {/* ГЛАВНАЯ ЧАСТЬ */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 lg:gap-8">
        
        {/* СПИСОК ИГРОКОВ */}
        <section className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-zinc-700"></span>
            Выжившие в лобби
            <span className="flex-1 h-[1px] bg-gradient-to-r from-zinc-700 to-transparent"></span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max overflow-y-auto pr-2 custom-scrollbar">
            {players.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-zinc-800/50 rounded-2xl h-48 flex items-center justify-center text-zinc-600 text-sm font-medium uppercase tracking-widest">
                Ожидание игроков...
              </div>
            ) : (
              players.map((player, index) => (
                <div key={player.id} className="relative bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center gap-4 group hover:bg-white/5 hover:border-white/20 transition-all duration-300">
                  {player.isHost && (
                    <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-[0_0_15px_rgba(225,29,72,0.5)] z-10">
                      Хост
                    </div>
                  )}
                  <div className="relative w-14 h-14 shrink-0">
                    <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full border-2 border-zinc-700 object-cover group-hover:border-zinc-400 transition-colors" />
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-bold text-base truncate group-hover:text-cyan-200 transition-colors">{player.name}</span>
                    <span className="text-xs text-zinc-500 font-medium mt-0.5 truncate">
                      {player.isHost ? 'Организатор партии' : `Игрок #${index + 1}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ПАРАМЕТРЫ ИГРЫ */}
        <section className="bg-black/40 rounded-3xl border border-white/5 p-6 shadow-inner flex flex-col">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-zinc-700"></span>
            Условия сценария
          </h2>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/20 p-5 rounded-2xl border border-cyan-900/30 flex gap-4 shadow-lg items-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 blur-sm pointer-events-none">
                <ObjectiveIcon className="w-32 h-32 text-cyan-500" />
              </div>
              <ObjectiveIcon className="w-10 h-10 text-cyan-400 shrink-0" />
              <div className="relative z-10">
                <h3 className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Главная цель</h3>
                <p className="text-white text-sm font-bold leading-tight">«Нам нужна еда» (Тестовая)</p>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-5 text-zinc-400 font-medium">Длительность</td>
                    <td className="py-4 pr-5 text-right font-bold text-white"><span className="bg-zinc-800 px-3 py-1 rounded-lg">Средняя</span></td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-5 text-zinc-400 font-medium">Сложность</td>
                    <td className="py-4 pr-5 text-right font-bold text-rose-400">Хардкор</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-5 text-zinc-400 font-medium">Предатель</td>
                    <td className="py-4 pr-5 text-right font-bold text-white">Возможен</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-auto bg-rose-950/20 p-4 rounded-xl border border-rose-900/30 text-center">
              <p className="text-xs font-medium text-rose-400/80">Ожидайте, пока хост запустит партию</p>
            </div>
          </div>
        </section>
      </main>

      {/* ФУТЕР */}
      <footer className="relative z-10 flex flex-col-reverse sm:flex-row justify-end items-center gap-4 mt-6 lg:mt-8 pt-6 border-t border-white/10">
        <button 
          onClick={onLeave} 
          className="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold tracking-wider uppercase border border-zinc-700 transition-all active:scale-95"
        >
          Покинуть лобби
        </button>
        {isHost && (
          <button 
            onClick={onStart} 
            className="relative w-full sm:w-auto px-10 py-3.5 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-black tracking-widest uppercase border border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all active:scale-95 overflow-hidden group"
          >
            <span className="relative z-10">Начать игру</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </button>
        )}
      </footer>
    </div>
  );
}