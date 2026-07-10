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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0a0a0f] border border-gray-800 p-6 md:p-12 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Анимация сканера */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-500/50 animate-[scan_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 border-y-2 border-cyan-500 rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]"></div>
            <h3 className="text-2xl font-black text-gray-100 tracking-[0.3em] uppercase text-center">
              СИНТЕЗ ДАННЫХ
            </h3>
            <p className="text-gray-600 mt-4 font-mono text-xs tracking-widest uppercase">Нейросеть генерирует пакеты...</p>
          </div>
        ) : questionData && !feedback ? (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <div className="w-full h-1.5 bg-gray-900 mb-8 overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${(timeLeft / timeLimit) * 100}%`,
                  backgroundColor: timeLeft > 5 ? '#06b6d4' : '#ef4444',
                  boxShadow: `0 0 10px ${timeLeft > 5 ? '#06b6d4' : '#ef4444'}`
                }}
              ></div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-gray-500 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
                [ ПРОТОКОЛ ВЗЛОМА ]
              </span>
              <span className={`text-3xl md:text-4xl font-black font-mono ${timeLeft > 5 ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                00:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>

            <h2 className="text-xl md:text-3xl font-bold text-gray-100 leading-relaxed mb-10 text-center md:text-left">
              {questionData.question}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionData.options.map((opt: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => handleAnswerClick(opt)}
                  disabled={turnPlayerId !== userId || isProcessingLocal}
                  className={`relative p-5 md:p-6 bg-[#111116] border border-gray-800 rounded-xl transition-all text-sm md:text-base font-medium text-left overflow-hidden group
                    ${(turnPlayerId === userId && !isProcessingLocal)
                      ? 'hover:bg-gray-800 hover:border-gray-600 cursor-pointer hover:-translate-y-1' 
                      : 'opacity-50 cursor-not-allowed grayscale'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                  <div className="flex items-center relative z-10 text-gray-300 group-hover:text-white">
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-black border border-gray-700 text-gray-500 font-bold rounded-lg mr-4 group-hover:border-white group-hover:text-white transition-colors">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : feedback ? (
          <div className="py-8 animate-in zoom-in-95 duration-300">
            <div className={`border-l-4 pl-6 md:pl-8 ${feedback.isCorrect ? 'border-green-500' : 'border-red-500'}`}>
              <h2 className={`text-3xl md:text-5xl font-black mb-2 uppercase tracking-[0.1em] ${feedback.isCorrect ? 'text-green-400' : 'text-red-500'}`}>
                {feedback.isCorrect ? '[ ДОСТУП РАЗРЕШЕН ]' : '[ ОШИБКА ДЕШИФРОВКИ ]'}
              </h2>
              <h3 className="text-xl text-gray-400 font-bold uppercase tracking-widest mb-8">{feedback.message}</h3>
              
              <div className="bg-[#111116] p-6 rounded-lg border border-gray-800/50">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-600 mb-3">
                  АНАЛИЗ ИСТОРИЧЕСКИХ ДАННЫХ
                </div>
                <p className="text-base md:text-lg text-gray-300 leading-relaxed font-mono">
                  {feedback.fact}
                </p>
              </div>
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