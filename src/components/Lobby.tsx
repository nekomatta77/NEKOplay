import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, User } from '../types';
import { socket } from '../lib/socket';
import { GAMES } from '../lib/games';
import { Users, Send, LogOut, CheckCircle2, Circle, MessageSquare, Copy, Check } from 'lucide-react';

interface LobbyProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ room, user, onLeave }) => {
  const [messages, setMessages] = useState<{ user: User; message: string; timestamp: number }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const currentPlayer = room.players.find(p => p.socketId === socket.id);
  const isHost = currentPlayer?.isHost;
  const allReady = room.players.every(p => p.isReady || p.isHost);
  
  const gameInfo = GAMES.find(g => g.id === room.gameType);
  const maxPlayers = room.maxPlayers || gameInfo?.maxPlayers || 2;
  const minPlayers = gameInfo?.minPlayers || 2;
  
  const canStart = isHost && allReady && room.players.length >= minPlayers;

  useEffect(() => {
    const handleChatMessage = (msg: { user: User; message: string; timestamp: number }) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    };

    socket.on('chat_message', handleChatMessage);

    return () => {
      socket.off('chat_message', handleChatMessage);
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('chat_message', {
      roomId: room.id,
      message: newMessage.trim(),
      user,
    });
    setNewMessage('');
  };

  const handleToggleReady = () => {
    socket.emit('toggle_ready', room.id);
  };

  const handleStartGame = () => {
    if (canStart) {
      socket.emit('start_game', room.id);
    }
  };

  const handleLeave = () => {
    socket.emit('leave_room', room.id);
    onLeave();
  };

  const slots = Array.from({ length: maxPlayers });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div className="min-h-[100dvh] pb-safe bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-amber-600/5 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />

      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-30 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleLeave}
              className="p-2 sm:p-2.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-lg sm:rounded-xl text-zinc-400 hover:text-white transition-colors shadow-inner"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <h1 className="text-base sm:text-xl font-black text-white tracking-tight truncate max-w-[120px] sm:max-w-xs">{room.name}</h1>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(room.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-zinc-800/80 hover:bg-zinc-700 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold text-zinc-300 transition-colors border border-zinc-700/50"
                  title="Скопировать ID комнаты"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">ID: {room.id}</span>
                </button>
              </div>
              <div className="text-[9px] sm:text-[11px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5 truncate">{gameInfo?.name || 'Неизвестная игра'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Играет</div>
              </div>
            </div>
            <img src={user.avatar} alt={user.name} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-zinc-800 border sm:border-2 border-zinc-700 shadow-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col gap-4 sm:gap-8 relative z-10">
        
        {/* Arena View */}
        <div className="relative bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 overflow-hidden shadow-xl sm:shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-900/0 to-zinc-900/0 pointer-events-none" />
          
          <div className="text-center mb-6 sm:mb-10 relative z-10">
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight mb-1 sm:mb-2">Ожидание игроков</h2>
            <div className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-widest">
              {room.players.length} из {maxPlayers}
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={`relative z-10 grid gap-3 sm:gap-6 w-full max-w-4xl mx-auto ${
              maxPlayers <= 2 ? 'grid-cols-2 max-w-lg' : 
              maxPlayers <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 
              'grid-cols-3 sm:grid-cols-4'
            }`}
          >
            {slots.map((_, i) => {
              const player = room.players[i];
              
              if (player) {
                return (
                  <motion.div 
                    key={`player-${player.socketId}`}
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className={`flex flex-col items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border sm:border-2 transition-all duration-500 relative overflow-hidden ${
                      player.isReady || player.isHost 
                        ? 'bg-zinc-900/80 backdrop-blur-sm border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : 'bg-zinc-900/80 backdrop-blur-sm border-zinc-800'
                    }`}
                  >
                    {/* Background subtle pulse for ready players */}
                    {(player.isReady || player.isHost) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.05, 0.1, 0.05] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute inset-0 ${player.isHost ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                    )}

                    <div className="relative">
                      {/* Spinning Ring */}
                      <AnimatePresence>
                        {(player.isReady || player.isHost) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                            animate={{ opacity: 1, scale: 1.15, rotate: 360 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ opacity: { duration: 0.3 }, scale: { duration: 0.3 }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
                            className={`absolute -inset-1 sm:-inset-2 rounded-full border sm:border-2 border-dashed ${player.isHost ? 'border-amber-500/60' : 'border-emerald-500/60'}`}
                          />
                        )}
                      </AnimatePresence>

                      {/* Glowing Halo */}
                      <AnimatePresence>
                        {(player.isReady || player.isHost) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute inset-0 rounded-full blur-md sm:blur-xl ${player.isHost ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          />
                        )}
                      </AnimatePresence>

                      <img src={player.avatar} alt={player.name} className="relative z-10 w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-zinc-800 border-2 sm:border-4 border-zinc-900 shadow-md sm:shadow-xl" />
                      {player.isHost && (
                        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-lg z-20">
                          Хост
                        </div>
                      )}
                    </div>
                    <div className="text-center mt-1 sm:mt-2 relative z-10">
                      <div className="font-black text-xs sm:text-base text-white tracking-tight truncate w-16 sm:w-24" title={player.name}>{player.name}</div>
                      {player.socketId === socket.id && <div className="text-[8px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Вы</div>}
                    </div>
                    <div className="mt-auto bg-zinc-950/50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-zinc-800/50 w-full flex justify-center relative z-10">
                      {player.isHost ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" /> Готов</div>
                      ) : player.isReady ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> Готов</div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider"><Circle className="w-3 h-3 sm:w-4 sm:h-4" /> Ждет</div>
                      )}
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={`empty-${i}`}
                  variants={itemVariants} 
                  className="flex flex-col items-center justify-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border sm:border-2 border-dashed border-zinc-800 bg-zinc-950/30 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800">
                    <Users className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-600" />
                  </div>
                  <div className="text-center mt-1 sm:mt-2">
                    <div className="text-[8px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">Свободно</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Action Button */}
          <div className="mt-8 sm:mt-12 flex justify-center relative z-10">
            {isHost ? (
              <motion.button
                whileHover={{ scale: canStart ? 1.03 : 1 }}
                whileTap={{ scale: canStart ? 0.95 : 1, y: canStart ? 2 : 0 }}
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full max-w-sm py-3.5 sm:py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800/80 disabled:text-zinc-500 text-white rounded-xl sm:rounded-2xl text-sm sm:text-lg font-black uppercase tracking-wider transition-colors shadow-lg shadow-indigo-500/25 disabled:shadow-none"
              >
                {room.players.length < minPlayers ? `Минимум ${minPlayers} игрока` : !allReady ? 'Ожидание готовности...' : 'Начать игру'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95, y: 2 }}
                onClick={handleToggleReady}
                className={`w-full max-w-sm py-3.5 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-lg font-black uppercase tracking-wider transition-colors shadow-lg ${
                  currentPlayer?.isReady
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700 shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
                }`}
              >
                {currentPlayer?.isReady ? 'Отменить готовность' : 'Готов к игре'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl sm:rounded-3xl flex flex-col h-[280px] sm:h-[350px] shadow-xl sm:shadow-2xl">
          <div className="p-3 sm:p-5 border-b border-zinc-800/80 flex items-center gap-2 sm:gap-3 bg-zinc-900/50">
            <div className="bg-indigo-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
            <h2 className="text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider">Чат комнаты</h2>
          </div>
          
          <div ref={chatRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 bg-zinc-950/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs sm:text-sm">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 opacity-20" />
                <p>Пока нет сообщений. Поздоровайтесь!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.user.id === user.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={i} 
                    className={`flex gap-2 sm:gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img src={msg.user.avatar} alt={msg.user.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 shadow-sm" />
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                      <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 mb-0.5 sm:mb-1 uppercase tracking-wider">{msg.user.name}</span>
                      <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-sm ${
                        isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700/50'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="p-3 sm:p-4 border-t border-zinc-800/80 bg-zinc-900/50">
            <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
              {['👍', '👎', '😂', '🔥', '🚀', '🐱', '🎉', '❤️', '🤬', '🤡'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    socket.emit('chat_message', { roomId: room.id, message: emoji, user });
                  }}
                  className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors text-sm sm:text-lg hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="w-full pl-4 sm:pl-5 pr-12 sm:pr-14 py-3 sm:py-4 bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder-zinc-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg sm:rounded-xl transition-colors shadow-md"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
