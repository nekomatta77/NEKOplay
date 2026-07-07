// src/games/CastleQuiz/CastleQuizGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Room, User } from '../../types';
import { generateQuizBatch } from '../../lib/ai';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../../lib/firebase';

interface Props {
  room: Room;
  user: User;
  gameState?: any;
  onLeave?: () => void;
}

interface Castle {
  id: number;
  cx: number;
  cy: number;
  ownerId: string | null;
  isBase: boolean;
}

const CONNECTIONS = [
  [1, 2], [1, 3],
  [2, 4], [3, 4],
  [4, 5], [4, 6],
  [5, 7], [6, 7] 
];

const QUESTION_TIME_LIMIT = 20; 

export const CastleQuizGame: React.FC<Props> = ({ room, user }) => {
  const player1 = room.players[0];
  const player2 = room.players[1] || room.players[0]; 
  const isHost = user.id === player1.id;

  const [localGameState, setLocalGameState] = useState<'setup' | 'generating' | 'playing' | 'gameOver'>('setup');
  const [theme, setTheme] = useState<string>('Древний Египет');
  const [turnPlayerId, setTurnPlayerId] = useState<string>(player1.id);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [castles, setCastles] = useState<Castle[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attackingCastle, setAttackingCastle] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ message: string, fact: string, isCorrect: boolean } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const gameRef = ref(db, `rooms/${room.id}/gameState`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.phase) setLocalGameState(data.phase);
        if (data.theme) setTheme(data.theme);
        if (data.turnPlayerId) setTurnPlayerId(data.turnPlayerId);
        if (data.castles) setCastles(data.castles);
        
        // В Firebase пустые массивы удаляются, поэтому используем фоллбэк на []
        setQuestions(data.questions || []); 
        
        if (data.winner) setWinner(data.winner);
        
        setAttackingCastle(data.attackingCastle || null);
        setQuestionData(data.questionData || null);
        setFeedback(data.feedback || null);
        setIsGenerating(data.isGenerating || false);
        if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      }
    });

    return () => unsubscribe();
  }, [room.id]);

  useEffect(() => {
    if (questionData && !feedback && turnPlayerId === user.id && !isGenerating) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          update(ref(db, `rooms/${room.id}/gameState`), { timeLeft: newTime });
          
          if (newTime <= 0) {
            clearInterval(timerRef.current!);
            handleTimeUp();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionData, feedback, turnPlayerId, isGenerating]);

  const handleTimeUp = () => {
    processAnswer(false);
  };

  const handleStartGame = async () => {
    if (!isHost) return;
    
    update(ref(db, `rooms/${room.id}/gameState`), {
      phase: 'generating',
      theme
    });

    const batch = await generateQuizBatch(theme);
    
    const initialCastles: Castle[] = [
      { id: 1, cx: 15, cy: 50, ownerId: player1.id, isBase: true },
      { id: 2, cx: 35, cy: 25, ownerId: null, isBase: false },
      { id: 3, cx: 35, cy: 75, ownerId: null, isBase: false },
      { id: 4, cx: 50, cy: 50, ownerId: null, isBase: false },     
      { id: 5, cx: 65, cy: 25, ownerId: null, isBase: false },
      { id: 6, cx: 65, cy: 75, ownerId: null, isBase: false },
      { id: 7, cx: 85, cy: 50, ownerId: player2.id, isBase: true }, 
    ];

    update(ref(db, `rooms/${room.id}/gameState`), {
      phase: 'playing',
      theme,
      turnPlayerId: player1.id,
      castles: initialCastles,
      questions: batch,
      attackingCastle: null,
      questionData: null,
      feedback: null,
      isGenerating: false,
      winner: null,
      timeLeft: QUESTION_TIME_LIMIT
    });
  };

  const getPlayerColor = (ownerId: string | null, isGlow = false) => {
    if (ownerId === player1.id) return isGlow ? '#60a5fa' : '#3b82f6'; 
    if (ownerId === player2.id) return isGlow ? '#f87171' : '#ef4444'; 
    return isGlow ? '#6b7280' : '#374151'; 
  };

  const canAttack = (targetCastleId: number) => {
    const target = castles.find(c => c.id === targetCastleId);
    if (!target || target.ownerId === turnPlayerId) return false;

    const myCastles = castles.filter(c => c.ownerId === turnPlayerId).map(c => c.id);
    return CONNECTIONS.some(conn => {
      const [a, b] = conn;
      return (myCastles.includes(a) && targetCastleId === b) || 
             (myCastles.includes(b) && targetCastleId === a);
    });
  };

  const handleCastleClick = async (castleId: number) => {
    if (turnPlayerId !== user.id) return; 
    if (!canAttack(castleId)) return;
    if (attackingCastle) return; // Защита от двойного клика

    let currentQuestions = [...questions];

    // Открываем окно боя, если нужно докачать вопросы — включаем спиннер
    update(ref(db, `rooms/${room.id}/gameState`), {
      attackingCastle: castleId,
      isGenerating: currentQuestions.length === 0,
      feedback: null,
      questionData: null
    });

    // ДИНАМИЧЕСКАЯ ДОЗАРЯДКА: Если массив пуст, запрашиваем новую пачку у ИИ
    if (currentQuestions.length === 0) {
        const newBatch = await generateQuizBatch(theme);
        currentQuestions = newBatch;
    }

    const nextQuestion = currentQuestions[0];
    const remainingQuestions = currentQuestions.slice(1);

    update(ref(db, `rooms/${room.id}/gameState`), {
      questionData: nextQuestion,
      questions: remainingQuestions, // Firebase может удалить пустой массив, это нормально
      isGenerating: false,
      timeLeft: QUESTION_TIME_LIMIT
    });
  };

  const handleAnswerClick = (selectedOption: string) => {
    if (turnPlayerId !== user.id) return; 
    if (timerRef.current) clearInterval(timerRef.current);
    
    const isCorrect = selectedOption === questionData.correctAnswer;
    processAnswer(isCorrect);
  };

  const processAnswer = (isCorrect: boolean) => {
    let newPhase = 'playing';
    let gameWinner = null;
    let finalMessage = isCorrect ? 'Территория захвачена!' : 'Атака отбита!';

    const targetCastle = castles.find(c => c.id === attackingCastle);
    const newCastles = castles.map(c => 
      c.id === attackingCastle && isCorrect ? { ...c, ownerId: turnPlayerId } : c
    );

    if (isCorrect && targetCastle?.isBase) {
      newPhase = 'gameOver';
      gameWinner = turnPlayerId;
      finalMessage = 'ГЛАВНАЯ БАЗА УНИЧТОЖЕНА! ПОБЕДА!';
    }

    const newFeedback = {
      message: finalMessage,
      fact: questionData?.fact || 'Время вышло или произошла ошибка',
      isCorrect
    };

    update(ref(db, `rooms/${room.id}/gameState`), {
      feedback: newFeedback,
      castles: newCastles,
      phase: newPhase,
      winner: gameWinner
    });

    if (newPhase === 'playing') {
      setTimeout(() => {
        const nextPlayerId = turnPlayerId === player1.id ? player2.id : player1.id;
        update(ref(db, `rooms/${room.id}/gameState`), {
          attackingCastle: null,
          questionData: null,
          feedback: null,
          turnPlayerId: nextPlayerId
        });
      }, 4000);
    }
  };

  // --- ЭКРАН НАСТРОЙКИ ---
  if (localGameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white p-4">
        <div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-purple-500/30 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
          
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase tracking-widest">
            Битва Умов
          </h1>
          <p className="text-gray-400 mb-8 text-sm uppercase tracking-widest">Нейро-тактическая викторина</p>
          
          {isHost ? (
            <>
              <div className="mb-6">
                <label className="block text-left text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Глобальная тема генерации:</label>
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Например: Киберпанк, Космос, Мемы..."
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl focus:border-purple-500 focus:outline-none text-white transition-colors"
                />
              </div>

              <button 
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-[1.02] uppercase tracking-wider"
              >
                Инициировать бой
              </button>
            </>
          ) : (
            <div className="py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-wide">СИНХРОНИЗАЦИЯ...</h2>
              <p className="text-gray-400 text-sm uppercase">Ожидание настройки протокола от хоста</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ЭКРАН ГЕНЕРАЦИИ ---
  if (localGameState === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0f] text-white p-4">
        <div className="bg-gray-800/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-purple-500/30 max-w-md w-full text-center flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
          <h2 className="text-2xl font-black text-purple-400 tracking-widest uppercase mb-3">Синтез боевого арсенала...</h2>
          <p className="text-gray-400 text-sm">ИИ генерирует начальный пул вопросов по теме <span className="font-bold text-white">«{theme}»</span>.</p>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ИГРЫ ---
  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[#050508] text-white overflow-hidden p-4 font-sans">
      
      {/* HUD */}
      <div className="w-full max-w-5xl flex justify-between items-center bg-gray-900/80 p-4 rounded-2xl border border-gray-800 shadow-lg mb-6 backdrop-blur-md z-10">
        <div className={`flex items-center space-x-4 px-6 py-3 rounded-xl transition-all ${turnPlayerId === player1.id ? 'bg-blue-500/10 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'opacity-50 grayscale'}`}>
          <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-blue-400 overflow-hidden">
             <img src={player1.avatar} alt="P1" className="w-full h-full object-cover"/>
          </div>
          <div>
            <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">Синий Альянс</div>
            <div className="font-bold text-lg">{player1.name}</div>
          </div>
        </div>
        
        <div className="text-center flex flex-col items-center">
          <div className="text-xs text-purple-400 font-bold tracking-[0.2em] uppercase mb-1 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Категория: {theme}
          </div>
          <div className="text-xl font-black mt-2">
            <span className="text-gray-500 mr-2">ХОД:</span>
            <span className={turnPlayerId === player1.id ? 'text-blue-400' : 'text-red-400'}>
              {room.players.find(p => p.id === turnPlayerId)?.name}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Остаток пула: {questions.length} (Авто-пополнение)</div>
        </div>

        <div className={`flex items-center space-x-4 px-6 py-3 rounded-xl transition-all flex-row-reverse space-x-reverse ${turnPlayerId === player2.id ? 'bg-red-500/10 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'opacity-50 grayscale'}`}>
          <div className="w-12 h-12 rounded-full bg-red-600 border-2 border-red-400 overflow-hidden">
             <img src={player2.avatar} alt="P2" className="w-full h-full object-cover"/>
          </div>
          <div className="text-right">
            <div className="text-red-400 text-xs font-bold uppercase tracking-wider">Красная Орда</div>
            <div className="font-bold text-lg">{player2.name}</div>
          </div>
        </div>
      </div>

      {/* ТАКТИЧЕСКАЯ КАРТА */}
      <div className="relative w-full max-w-5xl aspect-[21/9] bg-gray-950 rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" preserveAspectRatio="none">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {CONNECTIONS.map((conn, i) => {
            const from = castles.find(c => c.id === conn[0]);
            const to = castles.find(c => c.id === conn[1]);
            if (!from || !to) return null;
            
            const isOwnedConn = from.ownerId && from.ownerId === to.ownerId;
            const strokeColor = isOwnedConn ? getPlayerColor(from.ownerId, true) : "#1f2937";
            
            return (
              <line 
                key={i}
                x1={`${from.cx}%`} y1={`${from.cy}%`} 
                x2={`${to.cx}%`} y2={`${to.cy}%`} 
                stroke={strokeColor} 
                strokeWidth={isOwnedConn ? "6" : "4"} 
                strokeLinecap="round"
                className="transition-colors duration-500"
                filter={isOwnedConn ? "url(#glow)" : ""}
              />
            );
          })}

          {castles.map(castle => {
            const isClickable = canAttack(castle.id) && turnPlayerId === user.id && !attackingCastle;
            const color = getPlayerColor(castle.ownerId);
            const glowColor = getPlayerColor(castle.ownerId, true);
            
            return (
              <g 
                key={castle.id} 
                className={`transition-transform duration-300 ${isClickable ? 'cursor-pointer hover:scale-110' : ''}`}
                style={{ transformOrigin: `${castle.cx}% ${castle.cy}%` }}
                onClick={() => handleCastleClick(castle.id)}
              >
                <circle cx={`${castle.cx}%`} cy={`${castle.cy}%`} r={castle.isBase ? "45" : "35"} fill={glowColor} opacity="0.1" className="animate-pulse" />
                
                <polygon 
                  points={
                    castle.isBase 
                    ? `${castle.cx},${castle.cy-25} ${castle.cx+22},${castle.cy-12} ${castle.cx+22},${castle.cy+12} ${castle.cx},${castle.cy+25} ${castle.cx-22},${castle.cy+12} ${castle.cx-22},${castle.cy-12}`
                    : `${castle.cx},${castle.cy-18} ${castle.cx+15},${castle.cy-9} ${castle.cx+15},${castle.cy+9} ${castle.cx},${castle.cy+18} ${castle.cx-15},${castle.cy+9} ${castle.cx-15},${castle.cy-9}`
                  }
                  fill={color}
                  stroke={isClickable ? "#fff" : glowColor}
                  strokeWidth={isClickable ? "4" : "2"}
                  filter={castle.ownerId ? "url(#glow)" : ""}
                  className="transition-colors duration-500"
                />

                {castle.isBase ? (
                  <text x={`${castle.cx}%`} y={`${castle.cy}%`} fontSize="16" fill="#fff" textAnchor="middle" dominantBaseline="central" className="font-bold">★</text>
                ) : (
                  <circle cx={`${castle.cx}%`} cy={`${castle.cy}%`} r="4" fill="#fff" opacity="0.5" />
                )}

                {isClickable && (
                  <circle cx={`${castle.cx}%`} cy={`${castle.cy}%`} r={castle.isBase ? "35" : "28"} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 6" className="animate-spin-slow" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ЭКРАН ПОБЕДЫ */}
      {localGameState === 'gameOver' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="text-center">
            <h1 className="text-7xl font-black mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
              Игра Окончена
            </h1>
            <p className="text-2xl text-white mb-8">
              Победитель: <span className="font-bold text-yellow-400">{room.players.find(p => p.id === winner)?.name}</span>
            </p>
            {isHost && (
               <button 
                onClick={() => update(ref(db, `rooms/${room.id}/gameState`), { phase: 'setup' })}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors"
               >
                 Вернуться в лобби
               </button>
            )}
          </div>
        </div>
      )}

      {/* ЭКРАН БОЯ (Вопрос или Ожидание) */}
      {attackingCastle && localGameState !== 'gameOver' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-gray-900/90 border border-purple-500/30 p-8 md:p-12 rounded-3xl shadow-[0_0_60px_rgba(168,85,247,0.2)] relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/50 animate-[scan_2s_ease-in-out_infinite]"></div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                <h3 className="text-2xl font-black text-purple-400 tracking-widest uppercase">Дозарядка пула...</h3>
                <p className="text-gray-500 mt-4 font-mono text-sm">Связь с серверами ИИ восстановлена</p>
              </div>
            ) : questionData && !feedback ? (
              <div className="animate-in slide-in-from-bottom-4">
                
                <div className="w-full h-2 bg-gray-800 rounded-full mb-8 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-linear"
                    style={{ 
                      width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%`,
                      backgroundColor: timeLeft > 5 ? '#a855f7' : '#ef4444' 
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                    Анализ данных
                  </span>
                  <span className={`text-2xl font-black font-mono ${timeLeft > 5 ? 'text-white' : 'text-red-500 animate-pulse'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed mb-8">{questionData.question}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionData.options.map((opt: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => handleAnswerClick(opt)}
                      disabled={turnPlayerId !== user.id}
                      className={`relative p-5 bg-gray-800/80 border border-gray-700 rounded-2xl transition-all text-lg font-medium text-left overflow-hidden group
                        ${turnPlayerId === user.id 
                          ? 'hover:bg-purple-900/40 hover:border-purple-400 cursor-pointer shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1' 
                          : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                      <div className="flex items-center relative z-10">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 border border-gray-700 text-gray-400 font-bold rounded-xl mr-4 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-400 transition-colors">
                          {['A', 'B', 'C', 'D'][idx]}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : feedback ? (
              <div className={`text-center py-10 animate-in zoom-in-95 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                <div className="text-7xl mb-6 drop-shadow-2xl">
                  {feedback.isCorrect ? (feedback.message.includes('БАЗА') ? '👑' : '⚡') : '💀'}
                </div>
                <h2 className="text-4xl font-black mb-6 uppercase tracking-widest">{feedback.message}</h2>
                <div className="bg-gray-900/80 p-8 rounded-2xl border border-gray-800 text-gray-300 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 px-4 text-xs uppercase tracking-[0.2em] font-bold text-gray-500">
                    Историческая справка
                  </div>
                  <p className="text-lg italic leading-relaxed">"{feedback.fact}"</p>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};