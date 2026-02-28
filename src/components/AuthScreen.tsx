import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { Cat, UserCircle, Sparkles } from 'lucide-react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';

// Генерируем массив из 20 аватарок: от ava1.png до ava20.png
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

      onLogin(newUser);
    } catch (error) {
      console.error("Ошибка при сохранении пользователя в Firebase:", error);
      alert("Не удалось подключиться к серверу. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden pb-safe">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md z-10 my-8"
      >
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
            <div className="relative bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-4 rounded-2xl border border-indigo-500/30">
              <Cat className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 tracking-tight">
          <span className="text-white">NEKO</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">play</span>
        </h1>
        <p className="text-zinc-400 text-center mb-8 font-medium text-sm sm:text-base">Выберите свой профиль для начала игры</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Выберите аватар
            </label>
            {/* Сделали сетку более плотной (5 колонок) и добавили скролл, если экран маленький */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square transition-all duration-300 ${
                    selectedAvatar === avatar
                      ? 'scale-110 shadow-[0_0_15px_rgba(99,102,241,0.6)] z-10 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 opacity-100'
                      : 'opacity-40 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <div className={`absolute inset-0 border-2 rounded-xl sm:rounded-2xl transition-colors ${selectedAvatar === avatar ? 'border-indigo-500' : 'border-transparent'}`} />
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover bg-zinc-800/50" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-zinc-300 mb-2 uppercase tracking-wider">
              Никнейм
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
                className="block w-full pl-12 pr-4 py-3 sm:py-4 border border-zinc-700/50 rounded-2xl leading-5 bg-zinc-950/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all shadow-inner"
                placeholder="Введите ваш никнейм"
                maxLength={15}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="relative w-full group overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform group-hover:scale-105" />
            <div className="relative flex justify-center py-3 sm:py-4 px-4 text-sm font-bold text-white tracking-wide uppercase">
              {isLoading ? 'Подключение...' : 'Войти в платформу'}
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
};