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
  // ИСПРАВЛЕНИЕ 1: Используем isHost из массива игроков, как это было изначально
  const isHost = players.find(p => p.id === user.id)?.isHost || false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-3 sm:p-5 flex flex-col relative selection:bg-red-900/40 overflow-hidden">
      
      {/* Атмосферный фон с текстурой */}
      <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/0f172a/020617?text=NEKOPLAY_LOBBY_BG')] bg-cover bg-center opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NDkzYjgiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none"></div>

      {/* ХЕДЕР (ЛОГО И ИНФО О КОМНАТЕ) */}
      <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl mb-4 sm:mb-5">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-tight shadow-red-500/10 drop-shadow-sm">
            <span className="text-red-600">DEAD</span> OF WINTER
          </h1>
          <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest mt-0.5">
            Подготовка партии | БАЗОВАЯ ИГРА
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-slate-700 shadow-inner">
          <span className="text-slate-500 font-medium text-xs sm:text-sm">Комната:</span>
          <span className="text-white font-bold text-sm sm:text-lg">{room.name}</span>
          <span className="font-bold text-slate-400 text-sm sm:text-lg bg-slate-900 px-2.5 py-0.5 rounded-md">{players.length}/5</span>
        </div>
      </header>

      {/* ГЛАВНАЯ ЧАСТЬ */}
      <main className="relative z-10 flex-1 grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-4 sm:gap-5">
        
        {/* КОЛОНКА СЛЕВА: СПИСОК ИГРОКОВ (КАРТОЧКИ) */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">Игроки в лобби</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-1 pb-2">
            {players.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-slate-800 rounded-3xl h-40 flex items-center justify-center text-slate-700 text-sm font-medium">
                Ожидание подключения игроков...
              </div>
            ) : (
              players.map((player, index) => (
                <div key={player.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center gap-4 group transition-all hover:border-slate-500">
                  {/* ИСПРАВЛЕНИЕ 2: player.avatar вместо player.photoUrl */}
                  <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full border-2 border-slate-600 group-hover:border-slate-400 transition" />
                  <div className="flex flex-col flex-1 truncate">
                    <span className="text-white font-bold text-sm sm:text-base group-hover:text-red-400 transition truncate">{player.name}</span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                      {/* ИСПРАВЛЕНИЕ 3: Используем player.isHost */}
                      {player.isHost ? 'Организатор' : `Игрок #${index + 1}`}
                    </span>
                  </div>
                  {/* ИСПРАВЛЕНИЕ 4: Используем player.isHost */}
                  {player.isHost && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" title="Хост"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* КОЛОНКА СПРАВА: ПАРАМЕТРЫ ИГРЫ (ТАБЛИЦА) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-inner flex flex-col">
          <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Параметры игры</h2>
          
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1 pb-2">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-900/50 flex gap-4 shadow-md items-center">
              <ObjectiveIcon className="w-7 h-7 text-blue-500" />
              <div>
                <h3 className="text-blue-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">Главная цель</h3>
                <p className="text-white text-xs sm:text-sm font-semibold">"Пережить зиму" (Тестовая)</p>
              </div>
            </div>

            <table className="w-full text-xs sm:text-sm font-mono text-slate-400 border-collapse">
              <tbody className="divide-y divide-slate-800 border-t border-b border-slate-800">
                <tr>
                  <td className="py-2.5 text-left font-medium">Длительность</td>
                  <td className="py-2.5 text-right font-bold text-white bg-slate-950 px-2.5 rounded-md">СРЕДНЯЯ</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-left font-medium">Сложность</td>
                  <td className="py-2.5 text-right font-bold text-white bg-slate-950 px-2.5 rounded-md underline decoration-slate-600">НОРМАЛЬНАЯ</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-left font-medium">Дополнение</td>
                  <td className="py-2.5 text-right font-bold text-white bg-slate-950 px-2.5 rounded-md text-slate-600">ОТСУТСТВУЕТ</td>
                </tr>
              </tbody>
            </table>
            
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center italic text-xs text-slate-600">
              Голосование за цель в этой версии отключено хостом.
            </div>
          </div>
        </div>
      </main>

      {/* ФУТЕР (КНОПКИ ДЕЙСТВИЯ) */}
      <footer className="relative z-10 flex flex-col sm:flex-row justify-end items-center p-3 gap-3 bg-slate-900 border-t border-slate-800 rounded-2xl shadow-inner mt-4 sm:mt-5">
        <button 
          onClick={onLeave} 
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-semibold border border-slate-700 transition active:scale-95"
        >
          Покинуть лобби
        </button>
        {isHost && (
          <button 
            onClick={onStart} 
            className="w-full sm:w-auto px-7 py-2.5 bg-red-800 hover:bg-red-700 disabled:bg-slate-800 disabled:opacity-50 disabled:border-slate-700 disabled:text-slate-600 rounded-xl text-sm font-bold border border-red-900 transition active:scale-95 shadow-[0_0_15px_rgba(185,28,28,0.3)] disabled:shadow-none"
            disabled={players.length < 2} // Запрещаем старт, если игроков < 2
          >
            {players.length < 2 ? 'Ожидание игроков...' : 'СТАРТ ПАРТИИ'}
          </button>
        )}
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.3); }
      `}</style>
    </div>
  );
}