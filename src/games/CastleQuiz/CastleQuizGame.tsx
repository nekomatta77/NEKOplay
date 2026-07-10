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

const QUESTION_TIME_LIMIT = 20;

const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#06b6d4'];
const GLOW_COLORS = ['#60a5fa', '#f87171', '#4ade80', '#facc15', '#c084fc', '#22d3ee'];

const generateMapLayout = (players: User[]) => {
  const pCount = Math.min(players.length, 6);
  let castles: any[] = [];
  let connections: number[][] = [];

  if (pCount <= 2) {
    castles = [
      { id: 1, cx: 150, cy: 300, ownerId: players[0].id, isBase: true },
      { id: 2, cx: 350, cy: 150, ownerId: null, isBase: false },
      { id: 3, cx: 350, cy: 450, ownerId: null, isBase: false },
      { id: 4, cx: 500, cy: 300, ownerId: null, isBase: false },
      { id: 5, cx: 650, cy: 150, ownerId: null, isBase: false },
      { id: 6, cx: 650, cy: 450, ownerId: null, isBase: false },
      { id: 7, cx: 850, cy: 300, ownerId: players[1]?.id || players[0].id, isBase: true }
    ];
    connections = [[1,2], [1,3], [2,4], [3,4], [4,5], [4,6], [5,7], [6,7]];
  } else if (pCount === 3) {
    castles = [
      { id: 1, cx: 500, cy: 100, ownerId: players[0].id, isBase: true },
      { id: 2, cx: 200, cy: 500, ownerId: players[1].id, isBase: true },
      { id: 3, cx: 800, cy: 500, ownerId: players[2].id, isBase: true },
      { id: 4, cx: 500, cy: 300, ownerId: null, isBase: false },
      { id: 5, cx: 350, cy: 400, ownerId: null, isBase: false },
      { id: 6, cx: 650, cy: 400, ownerId: null, isBase: false }
    ];
    connections = [[1,4], [2,5], [3,6], [4,5], [5,6], [6,4]];
  } else if (pCount === 4) {
    castles = [
      { id: 1, cx: 200, cy: 150, ownerId: players[0].id, isBase: true },
      { id: 2, cx: 800, cy: 150, ownerId: players[1].id, isBase: true },
      { id: 3, cx: 800, cy: 450, ownerId: players[2].id, isBase: true },
      { id: 4, cx: 200, cy: 450, ownerId: players[3].id, isBase: true },
      { id: 5, cx: 500, cy: 150, ownerId: null, isBase: false },
      { id: 6, cx: 800, cy: 300, ownerId: null, isBase: false },
      { id: 7, cx: 500, cy: 450, ownerId: null, isBase: false },
      { id: 8, cx: 200, cy: 300, ownerId: null, isBase: false },
      { id: 9, cx: 500, cy: 300, ownerId: null, isBase: false }
    ];
    connections = [[1,5], [1,8], [2,5], [2,6], [3,6], [3,7], [4,7], [4,8], [5,9], [6,9], [7,9], [8,9]];
  } else if (pCount === 5) {
    castles = [
      { id: 1, cx: 500, cy: 80, ownerId: players[0].id, isBase: true },
      { id: 2, cx: 850, cy: 250, ownerId: players[1].id, isBase: true },
      { id: 3, cx: 750, cy: 520, ownerId: players[2].id, isBase: true },
      { id: 4, cx: 250, cy: 520, ownerId: players[3].id, isBase: true },
      { id: 5, cx: 150, cy: 250, ownerId: players[4].id, isBase: true },
      { id: 6, cx: 500, cy: 230, ownerId: null, isBase: false },
      { id: 7, cx: 650, cy: 330, ownerId: null, isBase: false },
      { id: 8, cx: 550, cy: 430, ownerId: null, isBase: false },
      { id: 9, cx: 450, cy: 430, ownerId: null, isBase: false },
      { id: 10, cx: 350, cy: 330, ownerId: null, isBase: false },
      { id: 11, cx: 500, cy: 330, ownerId: null, isBase: false }
    ];
    connections = [[1,6], [2,7], [3,8], [4,9], [5,10], [6,7], [7,8], [8,9], [9,10], [10,6], [6,11], [7,11], [8,11], [9,11], [10,11]];
  } else {
    castles = [
      { id: 1, cx: 500, cy: 80, ownerId: players[0].id, isBase: true },
      { id: 2, cx: 800, cy: 220, ownerId: players[1].id, isBase: true },
      { id: 3, cx: 800, cy: 420, ownerId: players[2].id, isBase: true },
      { id: 4, cx: 500, cy: 520, ownerId: players[3].id, isBase: true },
      { id: 5, cx: 200, cy: 420, ownerId: players[4].id, isBase: true },
      { id: 6, cx: 200, cy: 220, ownerId: players[5].id, isBase: true },
      { id: 7, cx: 500, cy: 220, ownerId: null, isBase: false },
      { id: 8, cx: 650, cy: 300, ownerId: null, isBase: false },
      { id: 9, cx: 650, cy: 400, ownerId: null, isBase: false },
      { id: 10, cx: 500, cy: 420, ownerId: null, isBase: false },
      { id: 11, cx: 350, cy: 400, ownerId: null, isBase: false },
      { id: 12, cx: 350, cy: 300, ownerId: null, isBase: false },
      { id: 13, cx: 500, cy: 320, ownerId: null, isBase: false }
    ];
    connections = [[1,7], [2,8], [3,9], [4,10], [5,11], [6,12], [7,8], [8,9], [9,10], [10,11], [11,12], [12,7], [7,13], [8,13], [9,13], [10,13], [11,13], [12,13]];
  }
  return { castles, connections };
};

export const CastleQuizGame: React.FC<Props> = ({ room, user }) => {
  const isHost = user.id === room.players[0].id;
  const gamePlayers = room.players || [];

  const [localGameState, setLocalGameState] = useState<'setup' | 'generating' | 'playing' | 'gameOver'>('setup');
  
  // Новые состояния для двух режимов
  const [gameMode, setGameMode] = useState<'single' | 'multi'>('single');
  const [theme, setTheme] = useState<string>('Киберпанк');
  const [playerThemes, setPlayerThemes] = useState<Record<string, string>>({});
  const [activeThemesArray, setActiveThemesArray] = useState<string[]>([]);
  
  const [turnPlayerId, setTurnPlayerId] = useState<string>(gamePlayers[0].id);
  const [winner, setWinner] = useState<string | null>(null);
  
  const [castles, setCastles] = useState<any[]>([]);
  const [connections, setConnections] = useState<number[][]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  
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
        if (data.gameMode) setGameMode(data.gameMode);
        if (data.theme) setTheme(data.theme);
        if (data.playerThemes) setPlayerThemes(data.playerThemes);
        if (data.activeThemesArray) setActiveThemesArray(data.activeThemesArray);
        if (data.turnPlayerId) setTurnPlayerId(data.turnPlayerId);
        if (data.castles) setCastles(data.castles);
        if (data.connections) setConnections(data.connections);
        setQuestions(data.questions || []); 
        setHistory(data.history || []);
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

  const handleSetGameMode = (mode: 'single' | 'multi') => {
    update(ref(db, `rooms/${room.id}/gameState`), { gameMode: mode });
  };

  const handleSetPlayerTheme = (t: string) => {
    update(ref(db, `rooms/${room.id}/gameState/playerThemes`), { [user.id]: t });
  };

  const handleStartGame = async () => {
    if (!isHost || isProcessingLocal) return;
    setIsProcessingLocal(true);
    try {
        await update(ref(db, `rooms/${room.id}/gameState`), { phase: 'generating' });

        let batch;
        let finalThemes: string[] = [];

        if (gameMode === 'multi') {
            finalThemes = Object.values(playerThemes).filter(t => t.trim().length > 0);
            if (finalThemes.length === 0) finalThemes = ['Случайная тема'];
            batch = await generateQuizBatch({ themes: finalThemes, history: [] });
            update(ref(db, `rooms/${room.id}/gameState`), { activeThemesArray: finalThemes, theme: 'Мульти-Режим' });
        } else {
            batch = await generateQuizBatch({ theme, history: [] });
            update(ref(db, `rooms/${room.id}/gameState`), { theme });
        }

        if (!batch || batch.length === 0) {
            batch = [{ question: "Сеть ИИ недоступна. Начать резервный бой?", options: ["Да", "В бой"], correctAnswer: "Да", fact: "ИИ оффлайн." }];
        }
        
        const initialHistory = batch.map((q: any) => q.question);
        const generatedMap = generateMapLayout(gamePlayers);

        await update(ref(db, `rooms/${room.id}/gameState`), {
          phase: 'playing', turnPlayerId: gamePlayers[0].id, 
          castles: generatedMap.castles, connections: generatedMap.connections,
          questions: batch, history: initialHistory, attackingCastle: null, questionData: null,
          feedback: null, isGenerating: false, winner: null, timeLeft: QUESTION_TIME_LIMIT
        });
    } catch (error) { console.error("Start Error:", error); } 
    finally { setIsProcessingLocal(false); }
  };

  const getPlayerColor = (ownerId: string | null, isGlow = false) => {
    if (!ownerId) return isGlow ? '#4b5563' : '#111115'; 
    const pIndex = gamePlayers.findIndex(p => p.id === ownerId);
    if (pIndex === -1) return isGlow ? '#4b5563' : '#111115';
    return isGlow ? GLOW_COLORS[pIndex % 6] : PLAYER_COLORS[pIndex % 6];
  };

  const canAttack = (targetCastleId: number) => {
    const target = castles.find(c => c.id === targetCastleId);
    if (!target || target.ownerId === turnPlayerId) return false;
    const myCastles = castles.filter(c => c.ownerId === turnPlayerId).map(c => c.id);
    return connections.some(conn => {
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
            let newBatch;
            if (gameMode === 'multi') {
                newBatch = await generateQuizBatch({ themes: activeThemesArray, history: currentHistory });
            } else {
                newBatch = await generateQuizBatch({ theme, history: currentHistory });
            }

            if (newBatch && newBatch.length > 0) {
                currentQuestions = newBatch;
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
    let finalMessage = isCorrect ? '[ УЗЕЛ ВЗЛОМАН ]' : '[ ОТКАЗ ДОСТУПА ]';

    const targetCastle = castles.find(c => c.id === attackingCastle);
    const newCastles = castles.map(c => c.id === attackingCastle && isCorrect ? { ...c, ownerId: turnPlayerId } : c);

    if (isCorrect && targetCastle?.isBase) {
      newPhase = 'gameOver'; gameWinner = turnPlayerId; finalMessage = '[ СИСТЕМА УНИЧТОЖЕНА ]';
    }

    try {
        await update(ref(db, `rooms/${room.id}/gameState`), {
          feedback: { message: finalMessage, fact: questionData?.fact || 'Таймаут соединения', isCorrect },
          castles: newCastles, phase: newPhase, winner: gameWinner
        });

        if (newPhase === 'playing') {
          setTimeout(() => {
            const currentPlayerIndex = gamePlayers.findIndex(p => p.id === turnPlayerId);
            const nextPlayerId = gamePlayers[(currentPlayerIndex + 1) % gamePlayers.length].id;
            
            update(ref(db, `rooms/${room.id}/gameState`), {
              attackingCastle: null, questionData: null, feedback: null,
              turnPlayerId: nextPlayerId
            });
          }, 4500);
        }
    } catch (error) { console.error("Answer Error:", error); setIsProcessingLocal(false); }
  };

  if (localGameState === 'setup' || localGameState === 'generating') {
    return (
      <SetupScreen 
        isHost={isHost} theme={theme} setTheme={(t) => {setTheme(t); update(ref(db, `rooms/${room.id}/gameState`), { theme: t });}} 
        handleStartGame={handleStartGame} isProcessing={localGameState === 'generating' || isProcessingLocal} 
        gameMode={gameMode} setGameMode={handleSetGameMode}
        playerThemes={playerThemes} setPlayerTheme={handleSetPlayerTheme}
        players={gamePlayers} userId={user.id}
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-[#020204] text-white p-2 md:p-6 font-sans overflow-hidden">
      
      {/* HUD-панель для любого числа игроков */}
      <div className="w-full max-w-6xl mb-4 md:mb-6 flex flex-col items-center z-10">
        
        {/* Центральный блок информации */}
        <div className="bg-gray-900/80 border border-gray-800 backdrop-blur-md px-6 py-2 rounded-2xl shadow-xl flex items-center space-x-6 mb-4">
          <div className="text-[10px] md:text-xs text-cyan-500 font-bold tracking-[0.2em] uppercase border border-cyan-500/30 px-3 py-1 rounded-full">
            {theme}
          </div>
          <div className="text-gray-400 text-[10px] md:text-xs tracking-widest uppercase">
            Остаток пакетов: <span className="text-white font-bold">{questions.length}</span>
          </div>
        </div>

        {/* Сетка игроков */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full">
          {gamePlayers.map((p, idx) => {
            const isActive = turnPlayerId === p.id;
            const color = PLAYER_COLORS[idx % 6];
            return (
              <div 
                key={p.id}
                className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 border bg-[#111115]
                  ${isActive 
                    ? 'scale-110 shadow-lg z-10' 
                    : 'opacity-60 scale-95 border-gray-800'}`}
                style={{ borderColor: isActive ? color : '', boxShadow: isActive ? `0 0 20px ${color}40` : '' }}
              >
                <img src={p.avatar} alt="P" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2" style={{ borderColor: color }}/>
                <div className="text-left hidden md:block max-w-[100px]">
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
                    {isActive ? 'АКТИВЕН' : `Игрок ${idx + 1}`}
                  </div>
                  <div className="font-bold text-sm truncate text-gray-200">{p.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Интерактивная Карта */}
      <div className="w-full max-w-6xl flex-grow flex items-center justify-center">
        <CastleMap 
          castles={castles} connections={connections} turnPlayerId={turnPlayerId} userId={user.id}
          attackingCastle={attackingCastle} isProcessingLocal={isProcessingLocal}
          canAttack={canAttack} getPlayerColor={getPlayerColor} handleCastleClick={handleCastleClick}
        />
      </div>

      {/* Адаптивное Окно Победы */}
      {localGameState === 'gameOver' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in">
          <div className="text-center p-4 w-full max-w-5xl overflow-hidden flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] break-words leading-tight w-full">
              СИСТЕМА ВЗЛОМАНА
            </h1>
            <p className="text-lg sm:text-xl md:text-3xl text-gray-400 mb-12 tracking-widest uppercase break-words w-full">
              АДМИНИСТРАТОР: <span className="font-bold text-white block sm:inline mt-2 sm:mt-0">{room.players.find(p => p.id === winner)?.name}</span>
            </p>
            {isHost && (
               <button 
                onClick={() => update(ref(db, `rooms/${room.id}/gameState`), { phase: 'setup' })}
                className="w-full sm:w-auto px-12 py-5 bg-[#111115] border-2 border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/20 hover:text-cyan-400 text-white rounded-xl font-bold uppercase tracking-[0.2em] transition-all shadow-xl"
               >
                 Завершить сессию
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