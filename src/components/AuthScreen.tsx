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
      console.error("Ошибка при сохранении пользователя:", error);
      alert("Не удалось подключиться к серверу. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden pb-safe font-sans selection:bg-indigo-500/30">
      {/* Анимированный фон с неоновыми сферами */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-md z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
            <div className="relative w-[80px] h-[80px] rounded-2xl overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,0.1)] bg-zinc-950/50 backdrop-blur-sm z-10">
              <img 
                src={selectedAvatar} 
                alt="Selected Preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-center mb-2 tracking-tighter">
          <span className="text-white">NEKO</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">play</span>
        </h1>
        <p className="text-zinc-400 text-center mb-8 font-medium text-sm">Создай свой профиль для погружения</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Внешний вид
            </label>
            <div className="grid grid-cols-5 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                    selectedAvatar === avatar
                      ? 'scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10 ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-900 opacity-100'
                      : 'opacity-50 hover:opacity-100 hover:scale-105 hover:ring-1 hover:ring-white/20'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover bg-zinc-900" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="name" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Позывной
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-zinc-950/50 border border-white/5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-zinc-900/50 transition-all text-sm font-medium"
                placeholder="Введи никнейм..."
                maxLength={15}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="relative w-full group overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-[length:200%_100%] animate-gradient transition-transform group-hover:scale-[1.02]" />
            <div className="relative flex justify-center py-4 px-4 text-sm font-black text-white tracking-widest uppercase">
              {isLoading ? 'Инициализация...' : 'Войти в систему'}
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
};