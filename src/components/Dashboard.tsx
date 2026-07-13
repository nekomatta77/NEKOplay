import React, { useState, useEffect } from 'react';
import { User, Room } from '../types';
import { ref, onValue, push, set, serverTimestamp, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { GAMES } from '../lib/games';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Users, Gamepad2, X, PlayCircle, LogOut as LeaveIcon, Radio } from 'lucide-react';

interface DashboardProps {
  user: User;
  onJoinRoom: (room: Room) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('Сервер ' + user.name);
  const [selectedGameId, setSelectedGameId] = useState(GAMES[0].id); 
  const [maxPlayers, setMaxPlayers] = useState(GAMES[0].maxPlayers);
  const [isJoining, setIsJoining] = useState(false);

  const handleGameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGameId = e.target.value;
    setSelectedGameId(newGameId);
    
    const game = GAMES.find(g => g.id === newGameId);
    if (game) {
      if (maxPlayers > game.maxPlayers) setMaxPlayers(game.maxPlayers);
      if (maxPlayers < game.minPlayers) setMaxPlayers(game.minPlayers);
    }
  };

  useEffect(() => {
    const roomsRef = ref(db, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = Date.now();
        const validRooms: Room[] = [];
        
        Object.entries(data).forEach(([roomId, roomData]: [string, any]) => {
          if (!roomData) { 
            remove(ref(db, `rooms/${roomId}`)); 
            return; 
          }
          const players = roomData.players || [];
          const playersCount = Array.isArray(players) ? players.length : Object.keys(players).length;
          const isValidGame = roomData.gameType && GAMES.some(g => g.id === roomData.gameType);

          if (playersCount === 0 || !isValidGame || (roomData.lastActive && (now - roomData.lastActive > 1800000))) {
            remove(ref(db, `rooms/${roomId}`)).catch(console.error);
          } else {
            validRooms.push(roomData as Room);
          }
        });
        setRooms(validRooms.reverse());
      } else {
        setRooms([]); 
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomsRef = ref(db, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;

    const newRoom: Room = {
      id: roomId,
      name: roomName,
      gameType: selectedGameId,
      maxPlayers: maxPlayers,
      players: [{ ...user, socketId: user.id, isHost: true, isReady: false }],
      status: "waiting",
      lastActive: Date.now() 
    };

    await set(newRoomRef, { ...newRoom, timestamp: serverTimestamp() });
    setShowModal(false);
    setIsJoining(true);
    onJoinRoom(newRoom);
  };

  const handleJoinRoom = async (room: Room) => {
    const currentPlayers = room.players || [];
    const isAlreadyInRoom = currentPlayers.find(p => p.id === user.id);
    
    if (!isAlreadyInRoom) {
      if (currentPlayers.length >= room.maxPlayers) return; 
      const updatedPlayers = [...currentPlayers, { ...user, socketId: user.id, isHost: false, isReady: false }];
      await set(ref(db, `rooms/${room.id}/players`), updatedPlayers);
      await set(ref(db, `rooms/${room.id}/lastActive`), Date.now());
    }

    setIsJoining(true);
    onJoinRoom(room);
  };

  const handleLeaveActiveRoom = async (room: Room) => {
    const isHost = room.players?.find(p => p.id === user.id)?.isHost;
    const updatedPlayers = room.players?.filter(p => p.id !== user.id) || [];
    
    if (isHost || updatedPlayers.length === 0) {
      await remove(ref(db, `rooms/${room.id}`));
    } else {
      await set(ref(db, `rooms/${room.id}/players`), updatedPlayers);
    }
  };

  const getGameName = (gameId: string) => GAMES.find(g => g.id === gameId)?.name || 'Неизвестная игра';
  const selectedGameObj = GAMES.find(g => g.id === selectedGameId) || GAMES[0];
  const activeRoom = rooms.find(r => r.players?.some(p => p.id === user.id));

  return (
    <div className="min-h-[100dvh] bg-[#070709] bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(99,102,241,0.18),rgba(0,0,0,0))] p-4 sm:p-8 font-sans selection:bg-indigo-500/40 selection:text-white">
      {/* Декоративная фоновая сетка */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <header className="flex justify-between items-center mb-16 max-w-7xl mx-auto pt-4 relative z-20">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-black tracking-tighter"
        >
          <span className="text-white">NEKO</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse">board</span>
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-xl p-2 pr-5 rounded-[24px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:border-white/20 transition-all duration-300 group"
        >
          <div className="w-[48px] h-[48px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:scale-105 transition-transform duration-300">
             <img src={user.avatar} alt="avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-bold text-sm leading-tight tracking-wide">{user.name}</span>
            <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 mt-1">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
               <span className="w-2 h-2 rounded-full bg-emerald-400" /> Активен
            </span>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('nekoplay_user'); window.location.reload(); }} 
            className="ml-4 p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all duration-200 border border-white/5"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto relative z-10">
        <AnimatePresence>
          {activeRoom && !isJoining && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -30 }} 
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
              className="mb-10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-zinc-950/50 backdrop-blur-2xl border border-indigo-500/40 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(99,102,241,0.2)] relative">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white mb-0.5 tracking-wide uppercase text-xs text-indigo-400">Активный сеанс связи</h2>
                    <p className="text-zinc-300 text-sm">Вы подключены к лобби <strong className="text-white font-semibold">{activeRoom.name}</strong> • {getGameName(activeRoom.gameType)}</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto relative z-10">
                  <button 
                    onClick={() => handleJoinRoom(activeRoom)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wider text-xs transition-all duration-300 shadow-[0_0_35px_rgba(99,102,241,0.4)] hover:scale-[1.03]"
                  >
                    <PlayCircle className="w-4 h-4" /> Вернуться
                  </button>
                  <button 
                    onClick={() => handleLeaveActiveRoom(activeRoom)}
                    className="flex items-center justify-center px-5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-200 border border-red-500/20 hover:border-red-500 shadow-lg"
                    title="Разорвать соединение"
                  >
                    <LeaveIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`transition-all duration-700 ${(activeRoom && !isJoining) ? 'opacity-20 blur-md pointer-events-none scale-[0.99]' : 'opacity-100 scale-100'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Доступные лобби</h2>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-[0_4px_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Хост</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {rooms.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="col-span-full text-center py-28 text-zinc-500 bg-white/[0.01] backdrop-blur-sm rounded-[2.5rem] border border-white/5 border-dashed flex flex-col items-center justify-center"
                >
                  <div className="p-5 bg-white/[0.02] rounded-3xl mb-4 border border-white/5">
                    <Gamepad2 className="w-12 h-12 text-zinc-600 animate-pulse" />
                  </div>
                  <p className="text-lg font-bold text-zinc-400 tracking-wide">Список доступных лобби</p>
                </motion.div>
              ) : (
                rooms.map((room, idx) => {
                  const isFull = (room.players?.length || 0) >= room.maxPlayers;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      key={room.id}
                      className="group relative bg-white/[0.02] backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] hover:bg-white/[0.04] hover:border-indigo-500/40 transition-all duration-300 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <h3 className="text-xl font-bold text-white truncate pr-4 tracking-tight group-hover:text-indigo-300 transition-colors">{room.name}</h3>
                        <span className={`text-[11px] px-3 py-1.5 rounded-xl font-black tracking-widest flex items-center gap-1.5 border backdrop-blur-md ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          <Users className="w-3.5 h-3.5" />
                          {room.players?.length || 0}/{room.maxPlayers}
                        </span>
                      </div>
                      <div className="mb-8 relative z-10">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1.5">Конфигурация</p>
                        <p className="text-indigo-400 font-bold tracking-wide text-sm">{getGameName(room.gameType)}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room)}
                        disabled={isFull}
                        className={`mt-auto w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 relative z-10 overflow-hidden ${
                          isFull 
                            ? 'bg-zinc-950 text-zinc-600 border border-white/5 cursor-not-allowed' 
                            : 'bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                        }`}
                      >
                        {isFull ? 'Комната заполнена' : 'Подключиться'}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Окно создания комнаты */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
              className="bg-[#0c0c0e]/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative shadow-[0_30px_70px_rgba(0,0,0,0.6)]"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all border border-white/5">
                <X className="w-4 h-4" />
              </button>
              
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Параметры сервера</h2>
              
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 mb-2.5 uppercase tracking-widest">Идентификатор лобби</label>
                  <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/60 focus:bg-black/60 transition-all font-medium text-sm" required maxLength={20} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 mb-2.5 uppercase tracking-widest">Выбор игры</label>
                  <div className="relative">
                    <select value={selectedGameId} onChange={handleGameChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500/60 focus:bg-black/60 transition-all appearance-none cursor-pointer font-medium text-sm">
                      {GAMES.map((game) => (<option key={game.id} value={game.id} className="bg-zinc-950">{game.name}</option>))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
                  </div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Лимит игроков</label>
                    <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-lg text-xs font-black">{maxPlayers} игроков</span>
                  </div>
                  <input type="range" min={selectedGameObj.minPlayers} max={selectedGameObj.maxPlayers} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:scale-[1.02]">
                  Создать
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};