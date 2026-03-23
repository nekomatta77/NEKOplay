import React, { useState, useEffect } from 'react';
import { User, Room } from '../types';
import { ref, onValue, push, set, serverTimestamp, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { GAMES } from '../lib/games';
import { motion } from 'motion/react';
import { LogOut, Plus, Users, Gamepad2, X } from 'lucide-react';

interface DashboardProps {
  user: User;
  onJoinRoom: (room: Room) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onJoinRoom }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('Комната ' + user.name);
  const [selectedGameId, setSelectedGameId] = useState(GAMES[0].id); 
  const [maxPlayers, setMaxPlayers] = useState(GAMES[0].maxPlayers);

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

          // Firebase иногда возвращает массивы как объекты, страхуемся:
          const players = roomData.players || [];
          const playersCount = Array.isArray(players) ? players.length : Object.keys(players).length;
          
          // Проверяем, существует ли вообще такая игра в нашем списке
          const isValidGame = GAMES.some(g => g.id === roomData.gameType);

          // АГРЕССИВНАЯ ОЧИСТКА: Убиваем комнату, если:
          // 1. В ней 0 игроков
          // 2. Она старше 30 минут (1800000 мс)
          // 3. У нее сломанный/неизвестный gameType
          if (
            playersCount === 0 || 
            (roomData.lastActive && (now - roomData.lastActive > 1800000)) ||
            !isValidGame
          ) {
            remove(ref(db, `rooms/${roomId}`)).catch(console.error);
          } else {
            validRooms.push(roomData as Room);
          }
        });
        
        setRooms(validRooms);
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
      players: [{
        ...user,
        socketId: user.id, 
        isHost: true,
        isReady: false
      }],
      status: "waiting",
      lastActive: Date.now() 
    };

    await set(newRoomRef, {
      ...newRoom,
      timestamp: serverTimestamp()
    });

    setShowModal(false);
    onJoinRoom(newRoom);
  };

  const handleJoinRoom = async (room: Room) => {
    const currentPlayers = room.players || [];
    if (currentPlayers.length >= room.maxPlayers) {
      alert('Эта комната уже заполнена!');
      return;
    }

    const isAlreadyInRoom = currentPlayers.find(p => p.id === user.id);
    if (!isAlreadyInRoom) {
      const updatedPlayers = [...currentPlayers, {
        ...user,
        socketId: user.id,
        isHost: false,
        isReady: false
      }];
      
      await set(ref(db, `rooms/${room.id}/players`), updatedPlayers);
      await set(ref(db, `rooms/${room.id}/lastActive`), Date.now());
    }

    onJoinRoom(room);
  };

  const getGameName = (gameId: string) => {
    const game = GAMES.find(g => g.id === gameId);
    return game ? game.name : 'Неизвестная игра';
  };

  const selectedGameObj = GAMES.find(g => g.id === selectedGameId) || GAMES[0];

  return (
    <div className="min-h-[100dvh] bg-zinc-950 p-4 sm:p-8">
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight">
          <span className="text-white">NEKO</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">board</span>
        </h1>
        
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 pr-4 rounded-full border border-zinc-800/50">
          <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm leading-tight">{user.name}</span>
            <span className="text-emerald-400 text-[10px] font-black tracking-wider uppercase">Online</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('nekoplay_user');
              window.location.reload();
            }} 
            className="ml-2 p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-red-400 transition-colors"
            title="Сменить аккаунт"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Доступные сервера</h2>
            <p className="text-sm text-zinc-400">Присоединяйтесь к игре или создайте свою</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Создать комнату</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.length === 0 ? (
            <div className="col-span-full text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 border-dashed">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Пока нет активных комнат. Создайте первую!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={room.id}
                className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl hover:border-indigo-500/50 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white truncate pr-4">{room.name}</h3>
                  <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md font-mono flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.players?.length || 0}/{room.maxPlayers}
                  </span>
                </div>
                
                <p className="text-sm text-indigo-400 font-medium mb-6 uppercase tracking-wider">
                  {getGameName(room.gameType)}
                </p>

                <button 
                  onClick={() => handleJoinRoom(room)}
                  disabled={(room.players?.length || 0) >= room.maxPlayers}
                  className="w-full bg-zinc-800 group-hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:cursor-not-allowed"
                >
                  {(room.players?.length || 0) >= room.maxPlayers ? 'Заполнено' : 'Войти в игру'}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl w-full max-w-md relative"
          >
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-black text-white mb-6">Создать комнату</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Название</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Режим игры</label>
                <select 
                  value={selectedGameId}
                  onChange={handleGameChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                >
                  {GAMES.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                  Игроков: <span className="text-white">{maxPlayers}</span>
                </label>
                <input 
                  type="range" 
                  min={selectedGameObj.minPlayers} 
                  max={selectedGameObj.maxPlayers} 
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                Создать
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};