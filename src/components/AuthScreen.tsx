import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types';
import { Cat, UserCircle, Sparkles } from 'lucide-react';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
];

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onLogin({
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      avatar: selectedAvatar,
    });
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
        className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
            <div className="relative bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-5 rounded-2xl border border-indigo-500/30">
              <Cat className="w-12 h-12 text-indigo-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-center mb-3 tracking-tight">
          <span className="text-white">NEKO</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">play</span>
        </h1>
        <p className="text-zinc-400 text-center mb-10 font-medium">Выберите свой профиль для начала игры</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Выберите аватар
            </label>
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-2xl overflow-hidden aspect-square transition-all duration-300 ${
                    selectedAvatar === avatar
                      ? 'scale-110 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 opacity-100'
                      : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <div className={`absolute inset-0 border-2 rounded-2xl transition-colors ${selectedAvatar === avatar ? 'border-indigo-500' : 'border-transparent'}`} />
                  <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full bg-zinc-800/50" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
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
                className="block w-full pl-12 pr-4 py-4 border border-zinc-700/50 rounded-2xl leading-5 bg-zinc-950/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-inner"
                placeholder="Введите ваш никнейм"
                maxLength={15}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="relative w-full group overflow-hidden rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform group-hover:scale-105" />
            <div className="relative flex justify-center py-4 px-4 text-sm font-bold text-white tracking-wide uppercase">
              Войти в платформу
            </div>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
