import React, { useEffect } from 'react';
import { Room, User } from '../types';
import { ref, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { GAMES } from '../lib/games';
import { motion } from 'motion/react';
import { Users, LogOut, Play, Crown, Shield } from 'lucide-react';

interface LobbyProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ room, user, onLeave }) => {
  const currentPlayers = room.players || [];
  const isHost = currentPlayers.find(p => p.id === user.id)?.isHost;
  const gameInfo = GAMES.find(g => g.id === room.gameType) || GAMES[0];

  useEffect(() => {
    const updateActivity = () => {
      update(ref(db, `rooms/${room.id}`), { lastActive: Date.now() }).catch(() => {});
    };
    updateActivity();
    const interval = setInterval(updateActivity, 60000);
    return () => clearInterval(interval);
  }, [room.id]);

  const handleStartGame = async () => {
    if (isHost) await update(ref(db, `rooms/${room.id}`), { status: 'playing' });
  };

  const handleLeaveRoom = async () => {
    const updatedPlayers = currentPlayers.filter(p => p.id !== user.id);
    if (isHost || updatedPlayers.length === 0) {
      await remove(ref(db, `rooms/${room.id}`));
    } else {
      await update(ref(db, `rooms/${room.id}`), { players: updatedPlayers });
    }
    onLeave();
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),rgba(0,0,0,0))] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-10"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Лобби ожидания
            </div>
            <h1 className="text-3xl font-black text-white mb-1 tracking-tight">{room.name}</h1>
            <p className="text-zinc-400 font-medium text-sm">Режим: <span className="text-indigo-300 font-bold">{gameInfo.name}</span></p>
          </div>
          
          <button 
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-white/5 hover:border-red-500/30 rounded-2xl transition-all text-sm font-bold w-full sm:w-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            Отключиться
          </button>
        </header>

        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-400" />
              Отряд
            </h2>
            <span className="bg-white/10 text-white text-xs px-4 py-1.5 rounded-full font-black tracking-widest">
              {currentPlayers.length} / {room.maxPlayers}
            </span>
          </div>

          <div className="grid gap-3">
            {currentPlayers.map((player) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                key={player.id} 
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${player.id === user.id ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/5'}`}
              >
                <div className="relative">
                  <img src={player.avatar} alt="avatar" className="w-[56px] h-[56px] rounded-xl bg-zinc-800 object-cover border border-white/10" />
                  {player.id === user.id && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Вы</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-bold text-lg block truncate">{player.name}</span>
                  {player.isHost && <span className="text-amber-400 text-xs font-bold flex items-center gap-1 mt-0.5"><Crown className="w-3 h-3" /> Хост</span>}
                </div>
              </motion.div>
            ))}
            
            {Array.from({ length: room.maxPlayers - currentPlayers.length }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 border-dashed bg-white/[0.02] opacity-50">
                <div className="w-[56px] h-[56px] rounded-xl border-2 border-white/10 border-dashed" />
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Свободный слот</span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button 
            onClick={handleStartGame}
            disabled={currentPlayers.length < gameInfo.minPlayers}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:from-zinc-800 disabled:to-zinc-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:scale-[1.02] disabled:shadow-none disabled:text-zinc-500 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {currentPlayers.length < gameInfo.minPlayers ? (
              <><Shield className="w-5 h-5" /> Мин. игроков: {gameInfo.minPlayers}</>
            ) : (
              <><Play className="w-6 h-6 fill-white" /> Начать симуляцию</>
            )}
          </button>
        ) : (
          <div className="w-full bg-white/5 text-zinc-400 py-5 rounded-2xl font-black uppercase tracking-widest text-center flex items-center justify-center gap-3 border border-white/5">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            Ожидание запуска хостом...
          </div>
        )}
      </motion.div>
    </div>
  );
};