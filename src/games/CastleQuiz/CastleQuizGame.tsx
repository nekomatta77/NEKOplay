import React, { useState, useEffect, useRef } from 'react';
import { Room, User } from '../../types';
import { generateQuizBatch } from '../../lib/ai';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../../lib/firebase';

import { SetupScreen } from './components/SetupScreen';
import { CastleMap } from './components/CastleMap';
import { BattleModal } from './components/BattleModal';

interface Props {
  room: Room;
  user: User;
  gameState?: any;
  onLeave?: () => void;
}

const CONNECTIONS = [[1, 2], [1, 3], [2, 4], [3, 4], [4, 5], [4, 6], [5, 7], [6, 7]];
const QUESTION_TIME_LIMIT = 20;

export const CastleQuizGame: React.FC<Props> = ({ room, user }) => {
  const player1 = room.players[0];
  const player2 = room.players[1] || room.players[0]; 
  const isHost = user.id === player1.id;

  const [localGameState, setLocalGameState] = useState<'setup' | 'generating' | 'playing' | 'gameOver'>('setup');
  const [theme, setTheme] = useState<string>('Древний Египет');
  const [turnPlayerId, setTurnPlayerId] = useState<string>(player1.id);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [castles, setCastles] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]); // История вопросов
  
  const [attackingCastle, setAttackingCastle] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ message: string, fact: string, isCorrect: boolean } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingLocal, setIsProcessingLocal] = useState(false); 

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
        setQuestions(data.questions || []); 
        setHistory(data.history || []); // Загружаем историю
        if (data.winner) setWinner(data.winner);
        setAttackingCastle(data.attackingCastle || null);
        setQuestionData(data.questionData || null);
        setFeedback(data.feedback || null);
        setIsGenerating(data.isGenerating || false);
        if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
        setIsProcessingLocal(false); 
      }
    });
    return () => unsubscribe();
  }, [room.id]);

  useEffect(() => {
    if (questionData && !feedback && turnPlayerId === user.id && !isGenerating && !isProcessingLocal) {
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionData, feedback, turnPlayerId, isGenerating, isProcessingLocal, room.id, user.id]);

  const handleTimeUp = () => processAnswer(false);

  const handleStartGame = async () => {
    if (!isHost || isProcessingLocal) return;
    setIsProcessingLocal(true);
    try {
        await update(ref(db, `rooms/${room.id}/gameState`), { phase: 'generating', theme });

        let batch = await generateQuizBatch(theme, []);
        if (!batch || batch.length === 0) {
            batch = [{ question: "Сеть ИИ недоступна. Начать резервный бой?", options: ["Да", "В бой"], correctAnswer: "Да", fact: "ИИ оффлайн." }];
        }
        
        // Записываем полученные вопросы в историю
        const initialHistory = batch.map((q: any) => q.question);

        const initialCastles = [
          { id: 1, cx: 15, cy: 50, ownerId: player1.id, isBase: true },
          { id: 2, cx: 35, cy: 25, ownerId: null, isBase: false },
          { id: 3, cx: 35, cy: 75, ownerId: null, isBase: false },
          { id: 4, cx: 50, cy: 50, ownerId: null, isBase: false },     
          { id: 5, cx: 65, cy: 25, ownerId: null, isBase: false },
          { id: 6, cx: 65, cy: 75, ownerId: null, isBase: false },
          { id: 7, cx: 85, cy: 50, ownerId: player2.id, isBase: true }, 
        ];

        await update(ref(db, `rooms/${room.id}/gameState`), {
          phase: 'playing', theme, turnPlayerId: player1.id, castles: initialCastles,
          questions: batch, history: initialHistory, attackingCastle: null, questionData: null,
          feedback: null, isGenerating: false, winner: null, timeLeft: QUESTION_TIME_LIMIT
        });
    } catch (error) { console.error("Start Error:", error); } 
    finally { setIsProcessingLocal(false); }
  };

  const getPlayerColor = (ownerId: string | null, isGlow = false) => {
    if (ownerId === player1.id) return isGlow ? '#60a5fa' : '#2563eb'; 
    if (ownerId === player2.id) return isGlow ? '#f87171' : '#dc2626'; 
    return isGlow ? '#6b7280' : '#374151'; 
  };

  const canAttack = (targetCastleId: number) => {
    const target = castles.find(c => c.id === targetCastleId);
    if (!target || target.ownerId === turnPlayerId) return false;
    const myCastles = castles.filter(c => c.ownerId === turnPlayerId).map(c => c.id);
    return CONNECTIONS.some(conn => {
      const [a, b] = conn;
      return (myCastles.includes(a) && targetCastleId === b) || (myCastles.includes(b) && targetCastleId === a);
    });
  };

  const handleCastleClick = async (castleId: number) => {
    if (turnPlayerId !== user.id || isProcessingLocal || !canAttack(castleId) || attackingCastle) return;
    setIsProcessingLocal(true);
    
    try {
        let currentQuestions = [...questions];
        let currentHistory = [...history];

        await update(ref(db, `rooms/${room.id}/gameState`), {
          attackingCastle: castleId, isGenerating: currentQuestions.length === 0, feedback: null, questionData: null
        });

        if (currentQuestions.length === 0) {
            // Передаем историю при дозарядке
            const newBatch = await generateQuizBatch(theme, currentHistory);
            if (newBatch && newBatch.length > 0) {
                currentQuestions = newBatch;
                // Обновляем историю и обрезаем до 60 элементов, чтобы не забивать БД
                currentHistory = [...currentHistory, ...newBatch.map((q: any) => q.question)].slice(-60);
                await update(ref(db, `rooms/${room.id}/gameState`), { history: currentHistory });
            } else {
                currentQuestions = [{ question: "Сбой ИИ", options: ["Ок", "Да"], correctAnswer: "Ок", fact: "Ошибка" }];
            }
        }

        const nextQuestion = currentQuestions[0];
        const remainingQuestions = currentQuestions.slice(1);

        await update(ref(db, `rooms/${room.id}/gameState`), {
          questionData: nextQuestion, questions: remainingQuestions, isGenerating: false, timeLeft: QUESTION_TIME_LIMIT
        });
    } catch (error) { console.error("Attack Error:", error); } 
    finally { setIsProcessingLocal(false); }
  };

  const handleAnswerClick = (selectedOption: string) => {
    if (turnPlayerId !== user.id || isProcessingLocal) return; 
    setIsProcessingLocal(true);
    if (timerRef.current) clearInterval(timerRef.current);
    processAnswer(selectedOption === questionData.correctAnswer);
  };

  const processAnswer = async (isCorrect: boolean) => {
    let newPhase = 'playing', gameWinner = null;
    let finalMessage = isCorrect ? 'УЗЕЛ ВЗЛОМАН!' : 'ОТКАЗ ДОСТУПА!';

    const targetCastle = castles.find(c => c.id === attackingCastle);
    const newCastles = castles.map(c => c.id === attackingCastle && isCorrect ? { ...c, ownerId: turnPlayerId } : c);

    if (isCorrect && targetCastle?.isBase) {
      newPhase = 'gameOver'; gameWinner = turnPlayerId; finalMessage = 'СИСТЕМА ПРОТИВНИКА УНИЧТОЖЕНА!';
    }

    try {
        await update(ref(db, `rooms/${room.id}/gameState`), {
          feedback: { message: finalMessage, fact: questionData?.fact || 'Таймаут', isCorrect },
          castles: newCastles, phase: newPhase, winner: gameWinner
        });

        if (newPhase === 'playing') {
          setTimeout(() => {
            update(ref(db, `rooms/${room.id}/gameState`), {
              attackingCastle: null, questionData: null, feedback: null,
              turnPlayerId: turnPlayerId === player1.id ? player2.id : player1.id
            });
          }, 4500);
        }
    } catch (error) { console.error("Answer Error:", error); setIsProcessingLocal(false); }
  };

  if (localGameState === 'setup' || localGameState === 'generating') {
    return (
      <SetupScreen 
        isHost={isHost} theme={theme} setTheme={setTheme} 
        handleStartGame={handleStartGame} isProcessing={localGameState === 'generating' || isProcessingLocal} 
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[#020204] text-white p-2 md:p-6 font-sans overflow-hidden">
      
      {/* Адаптивный HUD */}
      <div className="w-full max-w-6xl grid grid-cols-3 gap-2 md:gap-4 bg-gray-900/80 p-3 md:p-4 rounded-3xl border border-gray-800 shadow-2xl mb-4 md:mb-8 backdrop-blur-xl z-10 items-center">
        
        {/* Игрок 1 */}
        <div className={`flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 p-2 md:px-6 md:py-3 rounded-2xl transition-all ${turnPlayerId === player1.id ? 'bg-blue-900/40 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'opacity-40 grayscale'}`}>
          <img src={player1.avatar} alt="P1" className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-blue-400 object-cover shadow-[0_0_15px_rgba(59,130,246,0.5)]"/>
          <div className="text-center md:text-left">
            <div className="text-blue-400 text-[9px] md:text-xs font-bold uppercase tracking-widest hidden md:block">Синий Альянс</div>
            <div className="font-bold text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{player1.name}</div>
          </div>
        </div>
        
        {/* Центр HUD */}
        <div className="text-center flex flex-col items-center justify-center">
          <div className="text-[9px] md:text-xs text-purple-400 font-bold tracking-[0.2em] uppercase mb-1 bg-purple-500/10 px-2 md:px-4 py-1 rounded-full border border-purple-500/30 truncate max-w-full">
            {theme}
          </div>
          <div className="text-sm md:text-2xl font-black mt-1 md:mt-2">
            <span className="text-gray-600 mr-1 md:mr-2 text-xs md:text-xl">ХОД:</span>
            <span className={turnPlayerId === player1.id ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'}>
              {room.players.find(p => p.id === turnPlayerId)?.name}
            </span>
          </div>
          <div className="text-[9px] md:text-xs text-gray-500 mt-1 uppercase tracking-widest hidden md:block">Пулы в резерве: {questions.length}</div>
        </div>

        {/* Игрок 2 */}
        <div className={`flex flex-col md:flex-row-reverse items-center space-y-2 md:space-y-0 md:space-x-reverse md:space-x-4 p-2 md:px-6 md:py-3 rounded-2xl transition-all ${turnPlayerId === player2.id ? 'bg-red-900/40 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'opacity-40 grayscale'}`}>
          <img src={player2.avatar} alt="P2" className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-red-400 object-cover shadow-[0_0_15px_rgba(239,68,68,0.5)]"/>
          <div className="text-center md:text-right">
            <div className="text-red-400 text-[9px] md:text-xs font-bold uppercase tracking-widest hidden md:block">Красная Орда</div>
            <div className="font-bold text-xs md:text-lg truncate max-w-[80px] md:max-w-none">{player2.name}</div>
          </div>
        </div>
      </div>

      {/* Интерактивная Карта */}
      <div className="w-full max-w-6xl flex-grow flex items-center justify-center">
        <CastleMap 
          castles={castles} connections={CONNECTIONS} turnPlayerId={turnPlayerId} userId={user.id}
          attackingCastle={attackingCastle} isProcessingLocal={isProcessingLocal}
          canAttack={canAttack} getPlayerColor={getPlayerColor} handleCastleClick={handleCastleClick}
        />
      </div>

      {/* Окно Победы */}
      {localGameState === 'gameOver' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="text-center p-4">
            <h1 className="text-5xl md:text-8xl font-black mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 drop-shadow-[0_0_30px_rgba(253,224,71,0.4)]">
              КОНЕЦ ИГРЫ
            </h1>
            <p className="text-xl md:text-3xl text-gray-300 mb-10">
              Доминант: <span className="font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">{room.players.find(p => p.id === winner)?.name}</span>
            </p>
            {isHost && (
               <button 
                onClick={() => update(ref(db, `rooms/${room.id}/gameState`), { phase: 'setup' })}
                className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-purple-600 hover:to-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl"
               >
                 Вернуться в лобби
               </button>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно сражения */}
      {attackingCastle && localGameState !== 'gameOver' && (
        <BattleModal 
          isGenerating={isGenerating} questionData={questionData} feedback={feedback}
          timeLeft={timeLeft} timeLimit={QUESTION_TIME_LIMIT} turnPlayerId={turnPlayerId} 
          userId={user.id} isProcessingLocal={isProcessingLocal} handleAnswerClick={handleAnswerClick}
        />
      )}
    </div>
  );
};