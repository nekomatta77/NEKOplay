import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, User } from '../types';
import { socket } from '../lib/socket';
import { GAMES } from '../lib/games';
import { Cat, Server, Users, Search, Plus, MessageSquare, X, Send, Gamepad2, Zap } from 'lucide-react';

interface DashboardProps {
  user: User;
  onJoinRoom: (room: Room) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom }) => {
  const [activeTab, setActiveTab] = useState<'games' | 'servers'>('games');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>(GAMES[0].id);
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState<number>(GAMES[0].maxPlayers);

  // Global Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<{user: User, message: string, timestamp: number}[]>([]);
  const [newGlobalMessage, setNewGlobalMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const isChatOpenRef = useRef(isChatOpen);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  useEffect(() => {
    socket.emit('get_servers');

    const handleServersList = (serverList: Room[]) => {
      setRooms(serverList);
    };

    const handleRoomCreated = (room: Room) => {
      onJoinRoom(room);
    };

    const handleGlobalChat = (msg: {user: User, message: string, timestamp: number}) => {
      setGlobalMessages(prev => [...prev, msg]);
      
      if (!isChatOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
      
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    };

    socket.on('servers_list', handleServersList);
    socket.on('room_created', handleRoomCreated);
    socket.on('global_chat_message', handleGlobalChat);

    return () => {
      socket.off('servers_list', handleServersList);
      socket.off('room_created', handleRoomCreated);
      socket.off('global_chat_message', handleGlobalChat);
    };
  }, [onJoinRoom]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    socket.emit('create_room', {
      roomName: newRoomName.trim(),
      gameType: selectedGame,
      maxPlayers: selectedMaxPlayers,
      user,
    });
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit('join_room', { roomId, user });
  };

  const handleQuickJoin = () => {
    const availableRoom = rooms.find(r => r.status === 'waiting' && r.players.length < (r.maxPlayers || 2));
    if (availableRoom) {
      handleJoinRoom(availableRoom.id);
    } else {
      alert('Нет доступных серверов для быстрого входа. Создайте свой!');
    }
  };

  const handleSendGlobalMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobalMessage.trim()) return;
    socket.emit('global_chat_message', { message: newGlobalMessage.trim(), user });
    setNewGlobalMessage('');
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-2.5 rounded-xl border border-indigo-500/30 shadow-inner">
              <Cat className="w-7 h-7 text-indigo-400" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              <span className="text-white">NEKO</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">play</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">В сети</div>
              </div>
            </div>
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-lg" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          
          {/* Tabs */}
          <div className="relative flex bg-zinc-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-zinc-800/50 w-full lg:w-auto shadow-inner">
            {['games', 'servers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-colors z-10 ${
                  activeTab === tab ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-2">
                  {tab === 'games' ? <Gamepad2 className="w-4 h-4" /> : <Server className="w-4 h-4" />}
                  {tab === 'games' ? 'Игры' : 'Сервера'}
                  {tab === 'servers' && rooms.length > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 ${activeTab === 'servers' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {rooms.length}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Create */}
          {activeTab === 'servers' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
            >
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Поиск серверов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                />
              </div>
              <button
                onClick={handleQuickJoin}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
                title="Быстрый вход"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('games')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">Выбрать игру</span>
              </button>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'games' ? (
            <motion.div
              key="games"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {GAMES.map((game) => (
                <div key={game.id} className="group relative bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-indigo-500/50 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col shadow-lg hover:shadow-indigo-500/10">
                  <div className="aspect-video relative overflow-hidden bg-zinc-800">
                    <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent opacity-90" />
                    <div className="absolute bottom-5 left-5 flex items-center gap-2">
                      <span className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {game.minPlayers}-{game.maxPlayers} Игроков
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 relative z-10">
                    <h3 className="text-xl font-black text-white mb-2">{game.name}</h3>
                    <p className="text-sm text-zinc-400 mb-8 line-clamp-2 flex-1 leading-relaxed">{game.description}</p>
                    <button
                      onClick={() => {
                        setSelectedGame(game.id);
                        setSelectedMaxPlayers(game.maxPlayers);
                        setNewRoomName(`Игра ${user.name}`);
                        setIsCreating(true);
                      }}
                      className="w-full py-3.5 bg-zinc-800/80 hover:bg-indigo-600 text-white rounded-2xl text-sm font-bold transition-all mt-auto border border-zinc-700/50 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
                    >
                      Создать лобби
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="servers"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {filteredRooms.length === 0 ? (
                <div className="text-center py-24 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 border-dashed rounded-3xl">
                  <div className="bg-zinc-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Server className="w-10 h-10 text-zinc-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Нет активных серверов</h3>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">В данный момент нет активных серверов. Станьте первым, кто создаст игру и пригласит других!</p>
                  <button
                    onClick={() => setActiveTab('games')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    Выбрать игру
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRooms.map((room) => {
                    const game = GAMES.find(g => g.id === room.gameType);
                    const isFull = room.players.length >= (game?.maxPlayers || 2);
                    
                    return (
                      <div key={room.id} className="group relative bg-zinc-900/60 backdrop-blur-md hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-indigo-500/50 rounded-3xl p-6 transition-all duration-300 flex flex-col shadow-lg hover:shadow-indigo-500/10 overflow-hidden">
                        
                        {/* Background Icon */}
                        <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
                          <Gamepad2 className="w-40 h-40" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div className="pr-4">
                              <h4 className="text-lg font-black text-white mb-1.5 truncate" title={room.name}>{room.name}</h4>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">{game?.name || 'Неизвестная игра'}</div>
                              </div>
                            </div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              room.status === 'playing' 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {room.status === 'playing' ? 'В игре' : 'Ожидание'}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-6 border-t border-zinc-800/80">
                            
                            {/* Players overlapping avatars */}
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-3">
                                {room.players.map((p, i) => (
                                  <img 
                                    key={i} 
                                    src={p.avatar} 
                                    alt={p.name} 
                                    className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 relative z-10 hover:z-20 transition-transform hover:scale-110" 
                                    title={p.name}
                                  />
                                ))}
                                {Array.from({ length: Math.max(0, (game?.maxPlayers || 2) - room.players.length) }).map((_, i) => (
                                  <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-950/50 flex items-center justify-center relative z-0">
                                    <Users className="w-3.5 h-3.5 text-zinc-600" />
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs font-bold text-zinc-500">
                                {room.players.length}/{game?.maxPlayers || 2}
                              </div>
                            </div>

                            <button
                              onClick={() => handleJoinRoom(room.id)}
                              disabled={isFull || room.status === 'playing'}
                              className="px-6 py-2.5 bg-zinc-800 hover:bg-indigo-600 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all border border-zinc-700/50 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
                            >
                              {isFull ? 'Заполнен' : room.status === 'playing' ? 'Началась' : 'Войти'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:-translate-y-1 z-40 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-zinc-950 shadow-lg animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Global Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:bottom-28 sm:right-6 sm:w-[400px] bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
          >
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Общий чат</h3>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">NEKOplay Community</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={chatRef} className="flex-1 p-5 overflow-y-auto space-y-5 bg-zinc-950/30">
              {globalMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm text-center">
                  <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                  <p>Добро пожаловать в общий чат!<br/>Поздоровайтесь с другими игроками.</p>
                </div>
              ) : (
                globalMessages.map((msg, i) => {
                  const isMe = msg.user.id === user.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                    >
                      <img src={msg.user.avatar} alt={msg.user.name} className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex-shrink-0 shadow-sm" />
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <span className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">{msg.user.name}</span>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
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

            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50">
              <form onSubmit={handleSendGlobalMessage} className="relative">
                <input
                  type="text"
                  value={newGlobalMessage}
                  onChange={(e) => setNewGlobalMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  className="w-full pl-5 pr-12 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder-zinc-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newGlobalMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <h2 className="text-2xl font-black text-white mb-8">Создать сервер {GAMES.find(g => g.id === selectedGame)?.name}</h2>
                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Название сервера</label>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder={`Игра ${user.name}`}
                      className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                      maxLength={30}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Количество игроков: {selectedMaxPlayers}</label>
                    {GAMES.find(g => g.id === selectedGame)?.minPlayers !== GAMES.find(g => g.id === selectedGame)?.maxPlayers ? (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner">
                        <input
                          type="range"
                          min={GAMES.find(g => g.id === selectedGame)?.minPlayers || 2}
                          max={GAMES.find(g => g.id === selectedGame)?.maxPlayers || 2}
                          value={selectedMaxPlayers}
                          onChange={(e) => setSelectedMaxPlayers(Number(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs font-bold text-zinc-500 mt-3">
                          <span>{GAMES.find(g => g.id === selectedGame)?.minPlayers} мин</span>
                          <span>{GAMES.find(g => g.id === selectedGame)?.maxPlayers} макс</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-inner text-center text-sm font-bold text-zinc-500">
                        Фиксировано: {GAMES.find(g => g.id === selectedGame)?.maxPlayers} игроков
                      </div>
                    )}
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 py-4 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-sm font-bold transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={!newRoomName.trim()}
                      className="flex-1 py-4 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25"
                    >
                      Создать
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
