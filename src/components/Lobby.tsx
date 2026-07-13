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
    <div className="min-h-[100dvh] bg-[#070709] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),rgba(0,0,0,0))] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl bg-[#0d0d11]/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 sm:p-10 relative shadow-[0_25px_60px_rgba(0,0,0,0.6)] z-10"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              Канал ожидания синхронизации
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">{room.name}</h1>
            <p className="text-zinc-400 font-medium text-sm">Игровая матрица: <span className="text-indigo-400 font-bold">{gameInfo.name}</span></p>
          </div>
          
          <button 
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-5 py-3.5 bg-white/[0.03] hover:bg-red-500/10 text-zinc-300 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all text-xs font-black uppercase tracking-wider w-full sm:w-auto justify-center shadow-md"
          >
            <LogOut className="w-3.5 h-3.5" />
            Покинуть
          </button>
        </header>

        <div className="bg-black/20 border border-white/5 rounded-[2rem] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2.5 text-zinc-400">
              <Users className="w-4 h-4 text-indigo-400" />
              Подключенные узлы
            </h2>
            <span className="bg-white/5 text-zinc-300 text-xs px-4 py-1.5 rounded-xl font-black border border-white/5 tracking-wider">
              {currentPlayers.length} / {room.maxPlayers}
            </span>
          </div>

          <div className="grid gap-3">
            {currentPlayers.map((player) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                key={player.id} 
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${player.id === user.id ? 'bg-indigo-500/[0.06] border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'bg-white/[0.01] border-white/5'}`}
              >
                <div className="relative">
                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                    <img src={player.avatar} alt="avatar" className="w-full h-full object-cover scale-110" />
                  </div>
                  {player.id === user.id && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest shadow-md">
                      Вы
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-bold text-base block truncate tracking-wide">{player.name}</span>
                  {player.isHost && (
                    <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                      <Crown className="w-3 h-3 fill-amber-400/20" /> Организатор
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
            
            {Array.from({ length: room.maxPlayers - currentPlayers.length }).map((_, i) => (
              <motion.div 
                key={`empty-${i}`} 
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/5 border-dashed bg-white/[0.01]"
              >
                <div className="w-[52px] h-[52px] rounded-xl border border-white/10 border-dashed bg-black/20" />
                <span className="text-zinc-600 font-black uppercase tracking-widest text-xs">Ожидание подключения...</span>
              </motion.div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button 
            onClick={handleStartGame}
            disabled={currentPlayers.length < gameInfo.minPlayers}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient disabled:from-zinc-900 disabled:to-zinc-900 text-white py-5 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.02] disabled:shadow-none disabled:text-zinc-600 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {currentPlayers.length < gameInfo.minPlayers ? (
              <><Shield className="w-4 h-4" /> Требуется участников: {gameInfo.minPlayers}</>
            ) : (
              <><Play className="w-4 h-4 fill-white" /> Запустить сессию</>
            )}
          </button>
        ) : (
          <div className="w-full bg-white/[0.02] text-zinc-500 py-5 rounded-xl font-black uppercase tracking-widest text-xs text-center flex items-center justify-center gap-3 border border-white/5">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500/40 border-t-transparent animate-spin" />
            Ожидание сигнала от хоста...
          </div>
        )}
      </motion.div>
    </div>
  );
};