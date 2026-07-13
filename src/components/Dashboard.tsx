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
        setRooms(validRooms.reverse()); // Новые комнаты сверху
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
    <div className="min-h-[100dvh] bg-[#09090b] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] p-4 sm:p-8 font-sans">
      <header className="flex justify-between items-center mb-12 max-w-7xl mx-auto pt-4">
        <h1 className="text-3xl font-black tracking-tighter">
          <span className="text-white">NEKO</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">board</span>
        </h1>
        
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-1.5 pr-4 rounded-[20px] border border-white/10 shadow-xl">
          <div className="w-[48px] h-[48px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
             <img src={user.avatar} alt="avatar" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-bold text-sm leading-tight tracking-wide">{user.name}</span>
            <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase flex items-center gap-1 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Сигнал стабилен
            </span>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('nekoplay_user'); window.location.reload(); }} 
            className="ml-4 p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto relative z-10">
        <AnimatePresence>
          {activeRoom && !isJoining && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }} 
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                    Активное подключение
                  </h2>
                  <p className="text-zinc-300 text-sm">Сервер: <strong className="text-white">{activeRoom.name}</strong> • {getGameName(activeRoom.gameType)}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto relative z-10">
                  <button 
                    onClick={() => handleJoinRoom(activeRoom)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                  >
                    <PlayCircle className="w-5 h-5" /> Подключиться
                  </button>
                  <button 
                    onClick={() => handleLeaveActiveRoom(activeRoom)}
                    className="flex items-center justify-center px-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20 hover:border-red-500"
                  >
                    <LeaveIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`transition-all duration-500 ${(activeRoom && !isJoining) ? 'opacity-40 blur-sm pointer-events-none' : 'opacity-100'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Доступные сервера</h2>
              <p className="text-sm text-zinc-400 font-medium">Выберите лобби или создайте собственное пространство</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Развернуть сервер</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {rooms.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="col-span-full text-center py-24 text-zinc-500 bg-white/[0.02] backdrop-blur-sm rounded-[2rem] border border-white/5 border-dashed"
                >
                  <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-30 text-indigo-400" />
                  <p className="text-lg font-medium text-zinc-400">Сеть пуста. Стань первым хостом.</p>
                </motion.div>
              ) : (
                rooms.map((room, idx) => {
                  const isFull = (room.players?.length || 0) >= room.maxPlayers;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      key={room.id}
                      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] hover:bg-white/[0.05] hover:border-indigo-500/50 transition-all duration-300 flex flex-col"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] pointer-events-none" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <h3 className="text-xl font-bold text-white truncate pr-4">{room.name}</h3>
                        <span className={`text-xs px-3 py-1.5 rounded-xl font-black tracking-widest flex items-center gap-1.5 backdrop-blur-md border ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          <Users className="w-3.5 h-3.5" />
                          {room.players?.length || 0}/{room.maxPlayers}
                        </span>
                      </div>
                      <div className="mb-8 relative z-10">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Режим</p>
                        <p className="text-indigo-300 font-bold">{getGameName(room.gameType)}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room)}
                        disabled={isFull}
                        className={`mt-auto w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all relative z-10 overflow-hidden ${
                          isFull 
                            ? 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed' 
                            : 'bg-white/5 text-white border border-white/10 hover:bg-indigo-500 hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                        }`}
                      >
                        {isFull ? 'Нет мест' : 'Подключиться'}
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
              
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-black text-white mb-8">Настройки сервера</h2>
              
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest">Имя сервера</label>
                  <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium" required maxLength={20} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest">Режим симуляции</label>
                  <div className="relative">
                    <select value={selectedGameId} onChange={handleGameChange} className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium">
                      {GAMES.map((game) => (<option key={game.id} value={game.id} className="bg-zinc-900">{game.name}</option>))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Вместимость</label>
                    <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-xl text-sm font-bold border border-indigo-500/20">{maxPlayers} чел.</span>
                  </div>
                  <input type="range" min={selectedGameObj.minPlayers} max={selectedGameObj.maxPlayers} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-[1.02] mt-4">Инициализировать</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};