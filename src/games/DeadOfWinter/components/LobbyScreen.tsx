import React, { useState, useEffect } from 'react';
import { Room, User } from '../../../types';

interface Props {
  room: Room;
  user: User;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

const CrownIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="crown-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#d97706"/></linearGradient></defs>
    <path d="M12 2L15.09 5.26L19 4L17.77 8.02L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L6.23 8.02L5 4L8.91 5.26L12 2Z" fill="url(#crown-grad)" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const ModernSpinner = ({ className = "w-5 h-5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
    <path className="opacity-90" d="M12 2C6.47715 2 2 6.47715 2 12C2 13.88 2.51 15.63 3.39 17.13" stroke="currentColor" strokeWidth="3" strokeLinecap="round"></path>
  </svg>
);

export default function LobbyScreen({ room, user, isHost, onStartGame, onLeave }: Props) {
  const [snow, setSnow] = useState<any[]>([]);

  useEffect(() => {
    const s = Array.from({ length: 40 }).map((_, i) => ({
      id: i, left: Math.random() * 100 + '%', animationDelay: Math.random() * 5 + 's',
      animationDuration: (Math.random() * 3 + 3) + 's', opacity: Math.random() * 0.5 + 0.2, size: Math.random() * 3 + 2 + 'px'
    }));
    setSnow(s);
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/dowbg4/1920/1080')] bg-cover bg-center scale-105 blur-[3px]"></div>
      <div className="absolute inset-0 bg-slate-950/80 [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black_100%)]"></div>
      <div className="absolute inset-0 pointer-events-none">
        {snow.map(s => <div key={s.id} className="absolute bg-white rounded-full animate-fall shadow-[0_0_5px_rgba(255,255,255,0.8)]" style={{ left: s.left, width: s.size, height: s.size, animationDelay: s.animationDelay, animationDuration: s.animationDuration, opacity: s.opacity }} />)}
      </div>
      <style>{`@keyframes fall { 0% { transform: translateY(-10vh) translateX(0); } 100% { transform: translateY(105vh) translateX(20px); } } .animate-fall { animation-iteration-count: infinite; animation-timing-function: linear; }`}</style>
      
      <div className="relative z-10 w-full max-w-lg backdrop-blur-2xl bg-slate-900/70 p-6 sm:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-700/50 flex flex-col">
        
        <header className="mb-8 relative text-center flex flex-col items-center">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-1 bg-red-500 blur-md rounded-full opacity-40"></div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-slate-100 to-slate-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            МЕРТВЫЕ СЕЗОНЫ
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-950/80 rounded-full border border-slate-800 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <p className="text-[10px] sm:text-xs font-mono text-cyan-400 tracking-widest uppercase">Ожидание выживших</p>
          </div>
        </header>
        
        <div className="space-y-3 mb-8 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
          {room.players?.map(p => {
            const isSelf = p.id === user.id;
            return (
              <div key={p.id} className={`flex items-center gap-3 sm:gap-4 bg-slate-950/60 p-3 sm:p-4 rounded-2xl transition-all duration-300 border ${isSelf ? 'border-red-800/60 shadow-[0_0_20px_rgba(153,27,27,0.2)]' : 'border-slate-800'}`}>
                
                <div className={`shrink-0 relative p-0.5 rounded-full border-2 ${isSelf ? 'border-red-500' : 'border-slate-600'}`}>
                  <img src={p.avatar} alt="avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className={`font-semibold text-base sm:text-lg truncate leading-tight ${isSelf ? 'text-white' : 'text-slate-300'}`}>
                    {p.name} {isSelf && <span className="text-xs text-red-500 font-medium ml-1 bg-red-500/10 px-2 py-0.5 rounded-md">Вы</span>}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-mono truncate mt-0.5">ID: {p.id.substring(0, 8)}</p>
                </div>
                
                {p.isHost && (
                  <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-yellow-500/10 rounded-xl border border-yellow-500/20" title="Хост">
                    <CrownIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row mt-auto">
          <button onClick={onLeave} className="flex-1 py-3.5 sm:py-4 px-6 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 text-slate-300 font-bold tracking-tight border border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 active:scale-[0.98]">
            Покинуть базу
          </button>
          {isHost ? (
            <button onClick={onStartGame} className="flex-1 py-3.5 sm:py-4 px-6 bg-red-700 hover:bg-red-600 text-white rounded-xl transition-all duration-200 font-bold tracking-tight shadow-[0_0_20px_rgba(185,28,28,0.4)] border border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 active:scale-[0.98]">
              Начать выживание
            </button>
          ) : (
            <div className="flex-1 py-3.5 sm:py-4 px-6 bg-slate-900 text-cyan-500 rounded-xl font-bold border border-cyan-900/40 flex justify-center items-center gap-3">
              <ModernSpinner className="w-5 h-5 shrink-0" />
              <span className="font-mono text-[10px] sm:text-xs tracking-wider uppercase truncate">Ждем хоста</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239, 68, 68, 0.5); }
      `}</style>
    </div>
  );
}