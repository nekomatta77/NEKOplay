import React from 'react';
import { Room, User } from '../types';
import { Users, Play, X, Check, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { ref, set, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';

interface LobbyProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ room, user, onLeave }) => {
  const currentPlayer = room.players?.find(p => p.id === user.id);
  const isHost = currentPlayer?.isHost || false;
  
  const allReady = room.players?.every(p => p.isReady || p.isHost) && (room.players?.length || 0) > 1;

  const handleLeave = async () => {
    const updatedPlayers = room.players?.filter(p => p.id !== user.id) || [];
    
    // Удаляем комнату, если вышел хост или мы были последними
    if (isHost || updatedPlayers.length === 0) {
      await remove(ref(db, `rooms/${room.id}`));
    } else {
      await set(ref(db, `rooms/${room.id}/players`), updatedPlayers);
    }
    onLeave();
  };

  const handleToggleReady = async () => {
    if (!currentPlayer) return;
    
    const updatedPlayers = room.players.map(p => 
      p.id === user.id ? { ...p, isReady: !p.isReady } : p
    );
    
    await set(ref(db, `rooms/${room.id}/players`), updatedPlayers);
  };

  const handleStartGame = async () => {
    if (isHost && allReady) {
      await update(ref(db, `rooms/${room.id}`), {
        status: 'playing'
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        <div className="bg-zinc-950/50 p-6 border-b border-zinc-800/80 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">{room.name}</h2>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider text-xs">
                {room.gameType === 'tictactoe' ? 'Tic-Tac-Toe' : 
                 room.gameType === 'brawl' ? 'BrawlKitty' : 'KittyHunt'}
              </span>
              <span className="text-zinc-400 flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1 rounded-full">
                <Users className="w-4 h-4" />
                {room.players?.length || 0} / {room.maxPlayers}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleLeave}
            className="p-3 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-colors"
            title="Покинуть комнату"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-3 mb-8">
            {room.players?.map((player) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  player.id === user.id 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-zinc-950/50 border-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-xl bg-zinc-800 object-cover" />
                    {player.isHost && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 p-1 rounded-lg border-2 border-zinc-900">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block text-lg">{player.name}</span>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {player.isHost ? 'Хост комнаты' : 'Игрок'}
                    </span>
                  </div>
                </div>

                {!player.isHost && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${
                    player.isReady 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {player.isReady && <Check className="w-4 h-4" />}
                    {player.isReady ? 'Готов' : 'Ждем'}
                  </div>
                )}
              </motion.div>
            ))}
            
            {Array.from({ length: room.maxPlayers - (room.players?.length || 0) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/30 border border-zinc-800/30 border-dashed opacity-50">
                <div className="w-12 h-12 rounded-xl bg-zinc-900" />
                <span className="font-medium text-zinc-600">Ожидание игрока...</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t border-zinc-800/80">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={!allReady}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:shadow-none"
              >
                <Play className="w-5 h-5" />
                {allReady ? 'Начать игру' : 'Ожидание игроков...'}
              </button>
            ) : (
              <button
                onClick={handleToggleReady}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-black uppercase tracking-wide transition-all ${
                  currentPlayer?.isReady
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }`}
              >
                {currentPlayer?.isReady ? 'Отменить готовность' : 'Я готов!'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};