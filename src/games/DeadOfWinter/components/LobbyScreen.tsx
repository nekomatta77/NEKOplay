// src/games/DeadOfWinter/components/LobbyScreen.tsx
import React, { useState } from 'react';
import { User, Room } from '../../../types';
import { GameSettings } from '../store/gameState';

interface Props {
  user: User;
  room: Room;
  onLeave: () => void;
  onStart: (settings: GameSettings) => void;
}

export default function LobbyScreen({ user, room, onLeave, onStart }: Props) {
  const players = room.players || [];
  const isHost = players.find(p => p.id === user.id)?.isHost || false;

  const [settings, setSettings] = useState<GameSettings>({
    duration: 'medium',
    difficulty: 'normal',
    hasTraitor: true
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-8 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-black opacity-80 pointer-events-none"></div>
      
      <header className="relative z-10 bg-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter"><span className="text-rose-600">DEAD</span> OF WINTER</h1>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">Фаза подготовки</p>
        </div>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
        {/* Список игроков */}
        <section className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-2xl">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Выжившие в лобби</h2>
          <div className="grid grid-cols-2 gap-4">
            {players.map(player => (
              <div key={player.id} className="bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                <img src={player.avatar} alt="ava" className="w-12 h-12 rounded-full border-2 border-zinc-700 object-cover" />
                <span className="text-white font-bold">{player.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Настройки игры */}
        <section className="bg-black/40 rounded-3xl border border-white/5 p-6 shadow-inner flex flex-col gap-6">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Параметры игры</h2>
          
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm text-zinc-400 font-medium">
              Длительность
              <select 
                disabled={!isHost}
                value={settings.duration}
                onChange={(e) => setSettings({...settings, duration: e.target.value as any})}
                className="bg-zinc-900 border border-white/10 rounded-lg p-3 text-white disabled:opacity-50 outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="short">Короткая</option>
                <option value="medium">Средняя</option>
                <option value="long">Долгая</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-400 font-medium">
              Сложность
              <select 
                disabled={!isHost}
                value={settings.difficulty}
                onChange={(e) => setSettings({...settings, difficulty: e.target.value as any})}
                className="bg-zinc-900 border border-white/10 rounded-lg p-3 text-white disabled:opacity-50 outline-none focus:border-rose-500 transition-colors"
              >
                <option value="normal">Нормальная</option>
                <option value="hardcore">Хардкор</option>
              </select>
            </label>

            <label className="flex items-center gap-3 text-sm text-zinc-400 font-medium mt-2">
              <input 
                type="checkbox" 
                disabled={!isHost}
                checked={settings.hasTraitor}
                onChange={(e) => setSettings({...settings, hasTraitor: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950"
              />
              Наличие предателя
            </label>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex justify-end gap-4 mt-8 pt-6 border-t border-white/10">
        <button onClick={onLeave} className="px-6 py-3 bg-zinc-900 text-zinc-300 rounded-xl font-bold uppercase border border-zinc-700 hover:bg-zinc-800 transition-colors">Выйти</button>
        {isHost && (
          <button onClick={() => onStart(settings)} className="px-10 py-3 bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest border border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:bg-rose-600 transition-all">
            Начать драфт
          </button>
        )}
      </footer>
    </div>
  );
}