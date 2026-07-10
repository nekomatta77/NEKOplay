import React from 'react';
import { User } from '../../../types';

interface SetupScreenProps {
  isHost: boolean;
  theme: string;
  setTheme: (t: string) => void;
  handleStartGame: () => void;
  isProcessing: boolean;
  gameMode: 'single' | 'multi';
  setGameMode: (m: 'single' | 'multi') => void;
  playerThemes: Record<string, string>;
  setPlayerTheme: (t: string) => void;
  players: User[];
  userId: string;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ 
  isHost, theme, setTheme, handleStartGame, isProcessing, 
  gameMode, setGameMode, playerThemes, setPlayerTheme, players, userId 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] text-white p-4 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-[#0a0a0f]/90 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-800 max-w-lg w-full text-center relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500"></div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-widest drop-shadow-md">
          Битва Умов
        </h1>
        
        {/* Переключатель режимов (доступен только хосту) */}
        <div className="flex p-1 bg-gray-900 rounded-xl mb-8 border border-gray-800">
          <button
            onClick={() => isHost && setGameMode('single')}
            disabled={!isHost}
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${gameMode === 'single' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Глобальная база
          </button>
          <button
            onClick={() => isHost && setGameMode('multi')}
            disabled={!isHost}
            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${gameMode === 'multi' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Своя тема каждому
          </button>
        </div>

        {gameMode === 'single' ? (
          <div className="space-y-6">
            <div className="text-left group">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 group-focus-within:text-cyan-400 transition-colors">
                {isHost ? 'Ввод директивы' : 'Установленная директива'}
              </label>
              <input 
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={!isHost}
                placeholder="Киберпанк, Космос, Мемы..."
                className="w-full px-5 py-4 bg-black/50 border border-gray-700 rounded-2xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-white text-lg transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <label className="block text-left text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
              Базы данных игроков
            </label>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {players.map(p => {
                const isMe = p.id === userId;
                return (
                  <div key={p.id} className={`flex items-center space-x-3 p-3 rounded-xl border ${isMe ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-gray-900/50 border-gray-800'}`}>
                    <img src={p.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-700" />
                    <div className="flex-1 text-left">
                      <div className="text-[10px] text-gray-500 font-bold uppercase truncate">{p.name}</div>
                      {isMe ? (
                        <input 
                          type="text" 
                          value={playerThemes[p.id] || ''}
                          onChange={(e) => setPlayerTheme(e.target.value)}
                          placeholder="Введите вашу тему..."
                          className="w-full bg-transparent border-b border-gray-700 focus:border-cyan-400 outline-none text-sm text-cyan-300 py-1"
                        />
                      ) : (
                        <div className="text-sm text-gray-300 truncate">
                          {playerThemes[p.id] ? playerThemes[p.id] : <span className="text-gray-600 italic">Ожидание ввода...</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          {isHost ? (
            <button 
              onClick={handleStartGame}
              disabled={isProcessing}
              className={`w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all uppercase tracking-wider overflow-hidden relative
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1'}`}
            >
              {isProcessing ? <span className="animate-pulse">Инициализация...</span> : <span>Запустить сеть</span>}
            </button>
          ) : (
            <div className="py-4 flex flex-col items-center border border-gray-800 rounded-2xl bg-black/20">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Ожидание запуска...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};