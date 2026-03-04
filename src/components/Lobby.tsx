import React, { useEffect } from 'react';
import { Room, User } from '../types';
import { ref, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { GAMES } from '../lib/games';
import { motion } from 'motion/react';
import { Users, LogOut, Play, Crown } from 'lucide-react';

interface LobbyProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ room, user, onLeave }) => {
  const currentPlayers = room.players || [];
  const isHost = currentPlayers.find(p => p.id === user.id)?.isHost;
  const gameInfo = GAMES.find(g => g.id === room.gameType) || GAMES[0];

  // Пинг активности в Лобби
  useEffect(() => {
    const updateActivity = () => {
      update(ref(db, `rooms/${room.id}`), { lastActive: Date.now() }).catch(() => {});
    };
    updateActivity();
    const interval = setInterval(updateActivity, 60000); // Раз в минуту
    return () => clearInterval(interval);
  }, [room.id]);

  const handleStartGame = async () => {
    if (isHost) {
      await update(ref(db, `rooms/${room.id}`), {
        status: 'playing'
      });
    }
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
    <div className="min-h-[100dvh] bg-zinc-950 p-4 sm:p-8 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <header className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">{room.name}</h1>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                {gameInfo.name}
              </p>
            </div>
            
            <button 
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl transition-colors text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Покинуть</span>
            </button>
          </header>

          <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Игроки
              </h2>
              <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-lg font-mono">
                {currentPlayers.length} / {room.maxPlayers}
              </span>
            </div>

            <div className="space-y-3">
              {currentPlayers.map((player) => (
                <div 
                  key={player.id} 
                  className={`flex items-center gap-4 p-3 rounded-xl border ${player.id === user.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-zinc-900/50 border-zinc-800/50'}`}
                >
                  <img src={player.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-zinc-800 object-cover" />
                  <div className="flex-1">
                    <span className="text-white font-bold flex items-center gap-2">
                      {player.name}
                      {player.id === user.id && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">Вы</span>}
                    </span>
                  </div>
                  {player.isHost && (
                    <Crown className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              ))}
              
              {Array.from({ length: room.maxPlayers - currentPlayers.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-4 p-3 rounded-xl border border-zinc-800/30 border-dashed bg-zinc-900/20 opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-dashed" />
                  <span className="text-zinc-500 font-medium">Ожидание игрока...</span>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button 
              onClick={handleStartGame}
              disabled={currentPlayers.length < gameInfo.minPlayers}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:shadow-none disabled:text-zinc-500 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {currentPlayers.length < gameInfo.minPlayers ? `Нужно минимум ${gameInfo.minPlayers} игрока` : 'Запустить игру'}
            </button>
          ) : (
            <div className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-xl font-bold uppercase tracking-wide text-center flex items-center justify-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
              Ожидание хоста...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};