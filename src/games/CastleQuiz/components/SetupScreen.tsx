import React from 'react';

interface SetupScreenProps {
  isHost: boolean;
  theme: string;
  setTheme: (t: string) => void;
  handleStartGame: () => void;
  isProcessing: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ isHost, theme, setTheme, handleStartGame, isProcessing }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] text-white p-4 font-sans relative overflow-hidden">
      {/* Декоративный фоновый свет */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-gray-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-2xl border border-purple-500/20 max-w-md w-full text-center relative z-10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-[2rem]"></div>
        
        <h1 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          Битва Умов
        </h1>
        <p className="text-gray-400 mb-10 text-xs md:text-sm uppercase tracking-[0.3em] font-bold">Нейро-тактическая арена</p>
        
        {isHost ? (
          <div className="space-y-6">
            <div className="text-left group">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 group-focus-within:text-purple-400 transition-colors">
                Глобальная тема генерации
              </label>
              <input 
                type="text" 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Например: Киберпанк, Космос, Мемы..."
                className="w-full px-5 py-4 bg-black/40 border border-gray-700 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none text-white text-lg transition-all"
              />
            </div>

            <button 
              onClick={handleStartGame}
              disabled={isProcessing}
              className={`w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all uppercase tracking-wider overflow-hidden relative
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-1'}`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center animate-pulse">Инициализация ИИ...</span>
              ) : (
                <span className="relative z-10">Инициировать бой</span>
              )}
            </button>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-white mb-2 tracking-widest uppercase">СИНХРОНИЗАЦИЯ...</h2>
            <p className="text-gray-500 text-sm uppercase tracking-wider">Ожидание хоста</p>
          </div>
        )}
      </div>
    </div>
  );
};