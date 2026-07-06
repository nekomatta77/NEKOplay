// src/games/CastleQuiz/CastleQuizGame.tsx
import React, { useState, useEffect } from 'react';
import { Room, User } from '../../types';
import { generateQuizQuestion } from '../../lib/ai';
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

export const CastleQuizGame: React.FC<Props> = ({ room, user }) => {
  const player1 = room.players[0];
  const player2 = room.players[1] || room.players[0]; 
  const isHost = user.id === player1.id;

  // Игровые состояния (синхронизируются через Firebase)
  const [localGameState, setLocalGameState] = useState<'setup' | 'playing' | 'gameOver'>('setup');
  const [theme, setTheme] = useState<string>('Древний Египет');
  const [turnPlayerId, setTurnPlayerId] = useState<string>(player1.id);
  
  const [castles, setCastles] = useState<Castle[]>([]);
  const [attackingCastle, setAttackingCastle] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string, fact: string, isCorrect: boolean } | null>(null);

  // Подписка на Firebase: синхронизация состояния со всеми игроками
  useEffect(() => {
    const gameRef = ref(db, `rooms/${room.id}/gameState`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.phase) setLocalGameState(data.phase);
        if (data.theme) setTheme(data.theme);
        if (data.turnPlayerId) setTurnPlayerId(data.turnPlayerId);
        if (data.castles) setCastles(data.castles);
        
        setAttackingCastle(data.attackingCastle || null);
        setQuestionData(data.questionData || null);
        setFeedback(data.feedback || null);
        setIsGenerating(data.isGenerating || false);
      }
    });

    return () => unsubscribe();
  }, [room.id]);

  const handleStartGame = () => {
    if (!isHost) return;
    
    const initialCastles: Castle[] = [
      { id: 1, cx: 10, cy: 50, ownerId: player1.id, isBase: true },
      { id: 2, cx: 30, cy: 20, ownerId: null, isBase: false },
      { id: 3, cx: 30, cy: 80, ownerId: null, isBase: false },
      { id: 4, cx: 50, cy: 50, ownerId: null, isBase: false },     
      { id: 5, cx: 70, cy: 20, ownerId: null, isBase: false },
      { id: 6, cx: 70, cy: 80, ownerId: null, isBase: false },
      { id: 7, cx: 90, cy: 50, ownerId: player2.id, isBase: true }, 
    ];

    update(ref(db, `rooms/${room.id}/gameState`), {
      phase: 'playing',
      theme,
      turnPlayerId: player1.id,
      castles: initialCastles,
      attackingCastle: null,
      questionData: null,
      feedback: null,
      isGenerating: false
    });
  };

  const getPlayerColor = (ownerId: string | null) => {
    if (ownerId === player1.id) return '#3b82f6';
    if (ownerId === player2.id) return '#ef4444';
    return '#4b5563';
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

    // Синхронизируем статус атаки для всех игроков
    update(ref(db, `rooms/${room.id}/gameState`), {
      attackingCastle: castleId,
      isGenerating: true,
      feedback: null,
      questionData: null
    });

    const data = await generateQuizQuestion(theme);
    
    // Синхронизируем полученный вопрос
    update(ref(db, `rooms/${room.id}/gameState`), {
      questionData: data,
      isGenerating: false
    });
  };

  const handleAnswer = (selectedOption: string) => {
    if (turnPlayerId !== user.id) return; // Отвечать может только атакующий

    const isCorrect = selectedOption === questionData.correctAnswer;
    
    const newFeedback = {
      message: isCorrect ? 'Замок захвачен!' : 'Атака отбита!',
      fact: questionData.fact,
      isCorrect
    };

    const newCastles = castles.map(c => 
      c.id === attackingCastle && isCorrect ? { ...c, ownerId: turnPlayerId } : c
    );

    // Синхронизируем результат
    update(ref(db, `rooms/${room.id}/gameState`), {
      feedback: newFeedback,
      castles: newCastles
    });

    // Через 4 секунды сбрасываем модалку и передаем ход
    setTimeout(() => {
      const nextPlayerId = turnPlayerId === player1.id ? player2.id : player1.id;
      update(ref(db, `rooms/${room.id}/gameState`), {
        attackingCastle: null,
        questionData: null,
        feedback: null,
        turnPlayerId: nextPlayerId
      });
    }, 4000);
  };

  // ЭКРАН НАСТРОЙКИ 
  if (localGameState === 'setup') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-purple-500/30 max-w-md w-full text-center">
          <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            БИТВА УМОВ
          </h1>
          <p className="text-gray-400 mb-8">Стратегическая викторина</p>
          
          {isHost ? (
            <>
              <div className="mb-6">
                <label className="block text-left text-sm font-bold text-gray-300 mb-2">Глобальная тема игры:</label>
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Например: Киберпанк, Космос, Мемы..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none text-white"
                />
              </div>

              <button 
                onClick={handleStartGame}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02]"
              >
                Начать битву
              </button>
            </>
          ) : (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-white mb-2">Ожидание хоста...</h2>
              <p className="text-gray-400">Игрок {player1.name} выбирает тему викторины</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ОСНОВНОЙ ЭКРАН ИГРЫ
  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[#0a0a0f] text-white overflow-hidden p-4">
      <div className="w-full max-w-4xl flex justify-between items-center bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 mb-8 backdrop-blur-sm">
        <div className={`text-xl font-bold px-4 py-2 rounded-lg ${turnPlayerId === player1.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500'}`}>
          {player1.name} (Синие)
        </div>
        
        <div className="text-center">
          <div className="text-sm text-purple-400 font-bold tracking-widest uppercase mb-1">Тема: {theme}</div>
          <div className="text-2xl font-black">
            Ходит: <span className="text-white">{room.players.find(p => p.id === turnPlayerId)?.name}</span>
          </div>
        </div>

        <div className={`text-xl font-bold px-4 py-2 rounded-lg ${turnPlayerId === player2.id ? 'bg-red-500/20 text-red-400' : 'text-gray-500'}`}>
          {player2.name} (Красные)
        </div>
      </div>

      <div className="relative w-full max-w-4xl aspect-[2/1] bg-gray-900/40 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {CONNECTIONS.map((conn, i) => {
            const from = castles.find(c => c.id === conn[0]);
            const to = castles.find(c => c.id === conn[1]);
            if (!from || !to) return null;
            return (
              <line 
                key={i}
                x1={`${from.cx}%`} y1={`${from.cy}%`} 
                x2={`${to.cx}%`} y2={`${to.cy}%`} 
                stroke="#374151" strokeWidth="4" strokeLinecap="round"
                className="opacity-50"
              />
            );
          })}

          {castles.map(castle => {
            const isClickable = canAttack(castle.id) && turnPlayerId === user.id;
            const color = getPlayerColor(castle.ownerId);
            
            return (
              <g 
                key={castle.id} 
                className={`transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-110' : ''}`}
                style={{ transformOrigin: `${castle.cx}% ${castle.cy}%` }}
                onClick={() => handleCastleClick(castle.id)}
              >
                <circle cx={`${castle.cx}%`} cy={`${castle.cy}%`} r="30" fill={color} opacity="0.2" className="animate-pulse" />
                <circle 
                  cx={`${castle.cx}%`} cy={`${castle.cy}%`} r={castle.isBase ? "18" : "12"} 
                  fill={color} 
                  stroke={isClickable ? "#fff" : "#1f2937"} 
                  strokeWidth={isClickable ? "3" : "2"}
                />
                {isClickable && (
                  <circle cx={`${castle.cx}%`} cy={`${castle.cy}%`} r="24" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 4" className="animate-spin-slow" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* МОДАЛЬНОЕ ОКНО АТАКИ */}
      {attackingCastle && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 p-8 rounded-3xl shadow-2xl">
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-purple-400">Нейросеть плетет заклинание...</h3>
                <p className="text-gray-500 mt-2">Генерация уникального вопроса по теме: {theme}</p>
              </div>
            ) : questionData && !feedback ? (
              <div className="animate-in slide-in-from-bottom-4">
                <div className="text-center mb-8">
                  <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold tracking-wider uppercase mb-4 inline-block">Внимание, вопрос!</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">{questionData.question}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questionData.options.map((opt: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => handleAnswer(opt)}
                      disabled={turnPlayerId !== user.id} // Блокируем кнопки для наблюдателя
                      className={`p-4 bg-gray-800 border border-gray-700 rounded-xl transition-all text-lg font-medium text-left ${turnPlayerId === user.id ? 'hover:bg-purple-600 hover:border-purple-400 cursor-pointer' : 'opacity-70 cursor-not-allowed'} group`}
                    >
                      <span className="inline-block w-8 h-8 bg-gray-900 text-center leading-8 rounded-lg mr-3 transition-colors">
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : feedback ? (
              <div className={`text-center py-8 animate-in zoom-in-95 ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                <div className="text-6xl mb-4">{feedback.isCorrect ? '🏆' : '💀'}</div>
                <h2 className="text-3xl font-black mb-4">{feedback.message}</h2>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-gray-300">
                  <p className="font-bold text-white mb-2">Исторический факт:</p>
                  <p className="text-lg italic">"{feedback.fact}"</p>
                </div>
              </div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
};