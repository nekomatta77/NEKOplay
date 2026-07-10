import React from 'react';

interface BattleModalProps {
  isGenerating: boolean;
  questionData: any;
  feedback: any;
  timeLeft: number;
  timeLimit: number;
  turnPlayerId: string;
  userId: string;
  isProcessingLocal: boolean;
  handleAnswerClick: (opt: string) => void;
}

export const BattleModal: React.FC<BattleModalProps> = ({
  isGenerating, questionData, feedback, timeLeft, timeLimit, turnPlayerId, userId, isProcessingLocal, handleAnswerClick
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-gray-900/95 border border-purple-500/40 p-6 md:p-12 rounded-[2rem] shadow-[0_0_80px_rgba(168,85,247,0.25)] relative overflow-hidden">
        
        {/* Сканирующая линия для атмосферы */}
        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 animate-[scan_2s_ease-in-out_infinite]"></div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(168,85,247,0.5)]"></div>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-[0.2em] uppercase text-center">
              Дозарядка ИИ-ядра
            </h3>
            <p className="text-gray-500 mt-4 font-mono text-sm tracking-widest uppercase">Генерация уникальных пакетов...</p>
          </div>
        ) : questionData && !feedback ? (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            {/* Таймер */}
            <div className="w-full h-2 bg-gray-800 rounded-full mb-8 overflow-hidden border border-gray-700">
              <div 
                className="h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ 
                  width: `${(timeLeft / timeLimit) * 100}%`,
                  backgroundColor: timeLeft > 5 ? '#a855f7' : '#ef4444',
                  boxShadow: `0 0 10px ${timeLeft > 5 ? '#a855f7' : '#ef4444'}`
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
                Перехват данных
              </span>
              <span className={`text-3xl md:text-4xl font-black font-mono ${timeLeft > 5 ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-10 text-center md:text-left">
              {questionData.question}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {questionData.options.map((opt: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => handleAnswerClick(opt)}
                  disabled={turnPlayerId !== userId || isProcessingLocal}
                  className={`relative p-5 md:p-6 bg-gray-800/60 border border-gray-700 rounded-2xl transition-all text-base md:text-lg font-medium text-left overflow-hidden group backdrop-blur-sm
                    ${(turnPlayerId === userId && !isProcessingLocal)
                      ? 'hover:bg-purple-900/40 hover:border-purple-400 cursor-pointer shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1' 
                      : 'opacity-50 cursor-not-allowed grayscale'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <div className="flex items-center relative z-10">
                    <span className="shrink-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-900 border border-gray-700 text-gray-400 font-bold rounded-xl mr-4 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-400 transition-colors shadow-inner">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : feedback ? (
          <div className={`text-center py-12 animate-in zoom-in-95 duration-300 ${feedback.isCorrect ? 'text-green-400' : 'text-red-500'}`}>
            <div className="text-7xl md:text-9xl mb-8 drop-shadow-[0_0_30px_currentColor]">
              {feedback.isCorrect ? (feedback.message.includes('БАЗА') ? '👑' : '⚡') : '💀'}
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-8 uppercase tracking-widest drop-shadow-md">
              {feedback.message}
            </h2>
            <div className="bg-black/50 p-6 md:p-8 rounded-3xl border border-current/30 text-gray-300 relative max-w-2xl mx-auto shadow-inner">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 px-6 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 border border-gray-700">
                Дешифровка
              </div>
              <p className="text-base md:text-lg italic leading-relaxed mt-2">"{feedback.fact}"</p>
            </div>
          </div>
        ) : null}
      </div>
      <style>{`
        @keyframes scan { 0% { transform: translateY(0); } 50% { transform: translateY(100vh); } 100% { transform: translateY(0); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};