import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { UserCircle, Sparkles } from 'lucide-react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';

const AVATARS = Array.from({ length: 20 }, (_, i) => `/assets/avatars/ava${i + 1}.png`);

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const userId = Math.random().toString(36).substring(2, 9);
    
    const newUser = {
      id: userId,
      name: name.trim(),
      avatar: selectedAvatar,
    };

    try {
      const userRef = ref(db, `users/${userId}`);
      await set(userRef, {
        ...newUser,
        status: 'ONLINE',
        lastSeen: serverTimestamp()
      });

      localStorage.setItem('nekoplay_user', JSON.stringify(newUser));
      onLogin(newUser);
    } catch (error) {
      console.error("Ошибка при сохранении пользователя в Firebase:", error);
      alert("Не удалось подключиться к серверу. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#070709] flex items-center justify-center p-4 relative overflow-hidden pb-safe font-sans selection:bg-indigo-500/30">
      {/* Мягкие бэкдроп-сферы */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.45, 0.3] }} 
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }} 
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative bg-[#0d0d11]/40 backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md z-10 my-8"
      >
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
            <div className="relative w-[80px] h-[80px] rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_25px_rgba(99,102,241,0.25)] bg-zinc-950/40 backdrop-blur-sm z-10">
              <img 
                src={selectedAvatar} 
                alt="Selected Profile Preview" 
                className="w-full h-full object-cover transition-transform duration-500 scale-105 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-center mb-1 tracking-tighter">
          <span className="text-white">NEKO</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">play</span>
        </h1>
        <p className="text-zinc-400 text-center mb-8 font-medium text-xs tracking-wide">Разверните свой сетевой профиль</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 mb-3 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Внешний интерфейс
            </label>
            <div className="grid grid-cols-5 gap-2.5 max-h-[190px] overflow-y-auto pr-1.5 custom-scrollbar p-1">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                    selectedAvatar === avatar
                      ? 'scale-110 shadow-[0_0_20px_rgba(99,102,241,0.4)] z-10 ring-2 ring-indigo-400 ring-offset-4 ring-offset-[#0e0e12] opacity-100'
                      : 'opacity-40 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover bg-zinc-950/40" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-widest">
              Позывной (Никнейм)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserCircle className="h-[18px] w-[18px] text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 focus:bg-black/60 transition-all text-sm font-medium"
                placeholder="Имя в системе..."
                maxLength={15}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="relative w-full group overflow-hidden rounded-xl disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient transition-transform duration-300 group-hover:scale-[1.02]" />
            <div className="relative flex justify-center py-4 px-4 text-xs font-black text-white tracking-widest uppercase">
              {isLoading ? 'Аутентификация...' : 'Установить соединение'}
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
};