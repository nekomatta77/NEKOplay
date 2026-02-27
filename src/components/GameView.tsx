import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Room, User } from '../types';
import { socket } from '../lib/socket';
import { LogOut, RefreshCw, Trophy } from 'lucide-react';

interface GameViewProps {
  room: Room;
  user: User;
  onLeave: () => void;
}

export default function GameView({ room, user, onLeave }: GameViewProps) {
  const isTicTacToe = room.gameType === 'tictactoe';
  const rows = isTicTacToe ? 3 : 6;
  const cols = isTicTacToe ? 3 : 7;

  const [board, setBoard] = useState<(string | null)[]>(Array(rows * cols).fill(null));
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const me = room.players.find(p => p.socketId === socket.id);
  const myIdx = room.players.findIndex(p => p.socketId === socket.id);
  const isMyTurn = currentPlayerIdx === myIdx && !winner && !isDraw;

  useEffect(() => {
    const handleGameAction = (action: any) => {
      if (action.type === 'move') {
        const newBoard = [...board];
        newBoard[action.index] = action.playerSymbol;
        setBoard(newBoard);
        setCurrentPlayerIdx(action.nextPlayerIdx);
        checkWin(newBoard, action.playerSymbol);
      } else if (action.type === 'reset') {
        setBoard(Array(rows * cols).fill(null));
        setCurrentPlayerIdx(0);
        setWinner(null);
        setIsDraw(false);
      }
    };

    socket.on('game_action', handleGameAction);

    return () => {
      socket.off('game_action', handleGameAction);
    };
  }, [board, currentPlayerIdx]);

  const checkWin = (currentBoard: (string | null)[], symbol: string) => {
    if (isTicTacToe) {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6]             // diagonals
      ];
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
          setWinner(symbol);
          return;
        }
      }
      if (!currentBoard.includes(null)) {
        setIsDraw(true);
      }
    } else {
      // Connect 4 logic
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (!currentBoard[idx]) continue;
          
          // Check right
          if (c <= cols - 4 && currentBoard[idx] === currentBoard[idx + 1] && currentBoard[idx] === currentBoard[idx + 2] && currentBoard[idx] === currentBoard[idx + 3]) {
            setWinner(symbol); return;
          }
          // Check down
          if (r <= rows - 4 && currentBoard[idx] === currentBoard[idx + cols] && currentBoard[idx] === currentBoard[idx + 2 * cols] && currentBoard[idx] === currentBoard[idx + 3 * cols]) {
            setWinner(symbol); return;
          }
          // Check diag down-right
          if (r <= rows - 4 && c <= cols - 4 && currentBoard[idx] === currentBoard[idx + cols + 1] && currentBoard[idx] === currentBoard[idx + 2 * cols + 2] && currentBoard[idx] === currentBoard[idx + 3 * cols + 3]) {
            setWinner(symbol); return;
          }
          // Check diag down-left
          if (r <= rows - 4 && c >= 3 && currentBoard[idx] === currentBoard[idx + cols - 1] && currentBoard[idx] === currentBoard[idx + 2 * cols - 2] && currentBoard[idx] === currentBoard[idx + 3 * cols - 3]) {
            setWinner(symbol); return;
          }
        }
      }
      if (!currentBoard.includes(null)) {
        setIsDraw(true);
      }
    }
  };

  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] || winner || isDraw) return;

    let targetIndex = index;

    if (!isTicTacToe) {
      // Connect 4: find lowest empty cell in column
      const col = index % cols;
      let found = false;
      for (let r = rows - 1; r >= 0; r--) {
        const idx = r * cols + col;
        if (!board[idx]) {
          targetIndex = idx;
          found = true;
          break;
        }
      }
      if (!found) return;
    }

    const mySymbol = myIdx === 0 ? 'X' : 'O';
    const nextPlayerIdx = (myIdx + 1) % room.players.length;

    const newBoard = [...board];
    newBoard[targetIndex] = mySymbol;
    setBoard(newBoard);
    setCurrentPlayerIdx(nextPlayerIdx);
    checkWin(newBoard, mySymbol);

    socket.emit('game_action', {
      roomId: room.id,
      action: {
        type: 'move',
        index: targetIndex,
        playerSymbol: mySymbol,
        nextPlayerIdx,
      }
    });
  };

  const handleReset = () => {
    if (!me?.isHost) return;
    
    setBoard(Array(rows * cols).fill(null));
    setCurrentPlayerIdx(0);
    setWinner(null);
    setIsDraw(false);

    socket.emit('game_action', {
      roomId: room.id,
      action: { type: 'reset' }
    });
  };

  const handleLeave = () => {
    socket.emit('leave_room', room.id);
    onLeave();
  };

  const getPlayerSymbol = (idx: number) => idx === 0 ? 'X' : 'O';
  const getPlayerColor = (symbol: string) => symbol === 'X' ? 'bg-indigo-500' : 'bg-emerald-500';
  const getTextColor = (symbol: string) => symbol === 'X' ? 'text-indigo-500' : 'text-emerald-500';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeave}
              className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors shadow-inner"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">{room.name}</h1>
              <div className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">{isTicTacToe ? 'Крестики-нолики' : 'Четыре в ряд'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {me?.isHost && (
              <button
                onClick={handleReset}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors shadow-inner"
              >
                <RefreshCw className="w-4 h-4" />
                Играть снова
              </button>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Играет</div>
              </div>
            </div>
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 shadow-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
        
        {/* Mobile Reset Button */}
        {me?.isHost && (
          <button
            onClick={handleReset}
            className="sm:hidden flex items-center justify-center gap-2 w-full mb-6 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors shadow-inner"
          >
            <RefreshCw className="w-4 h-4" />
            Играть снова
          </button>
        )}

        {/* Status Banner */}
        <div className="mb-8 sm:mb-12 text-center h-20 flex items-center justify-center">
          {winner ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3">
              <Trophy className={`w-14 h-14 drop-shadow-lg ${getTextColor(winner)}`} />
              <h2 className="text-3xl font-black text-white tracking-tight">
                {room.players.find((_, i) => getPlayerSymbol(i) === winner)?.name} Победил!
              </h2>
            </motion.div>
          ) : isDraw ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h2 className="text-3xl font-black text-zinc-400 tracking-tight">Ничья!</h2>
            </motion.div>
          ) : (
            <motion.div 
              key={currentPlayerIdx}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 px-8 py-4 rounded-full shadow-2xl"
            >
              <div className={`w-4 h-4 rounded-full ${getPlayerColor(getPlayerSymbol(currentPlayerIdx))} shadow-[0_0_12px_currentColor] animate-pulse`} />
              <span className="text-lg font-bold text-white tracking-wide">
                {isMyTurn ? "Ваш ход" : `Ходит ${room.players[currentPlayerIdx]?.name}`}
              </span>
            </motion.div>
          )}
        </div>

        {/* Game Board */}
        <div className={`bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-4 sm:p-6 rounded-3xl shadow-2xl w-full ${
          isTicTacToe ? 'max-w-[400px]' : 'max-w-[700px]'
        }`}>
          <div 
            className="grid gap-2 sm:gap-3" 
            style={{ 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
            }}
          >
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!winner || !!isDraw || !isMyTurn}
                className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all duration-300 ${
                  cell 
                    ? 'bg-zinc-950/80 border-2 border-zinc-800/50 shadow-inner' 
                    : isMyTurn && !winner && !isDraw
                      ? 'bg-zinc-800/50 hover:bg-zinc-700/80 cursor-pointer border-2 border-zinc-700/50 hover:border-indigo-500/50 hover:shadow-lg'
                      : 'bg-zinc-900/30 cursor-not-allowed border-2 border-zinc-800/30'
                }`}
              >
                {cell && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className={getTextColor(cell)}
                  >
                    {isTicTacToe ? cell : (
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full ${getPlayerColor(cell)} shadow-[inset_0_-4px_8px_rgba(0,0,0,0.4)]`} />
                    )}
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Players Info */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 gap-6 sm:gap-12 w-full max-w-2xl">
          {room.players.map((player, idx) => {
            const symbol = getPlayerSymbol(idx);
            const isCurrent = currentPlayerIdx === idx && !winner && !isDraw;
            
            return (
              <div key={player.socketId} className={`flex flex-col items-center gap-4 p-5 sm:p-6 rounded-3xl border-2 transition-all duration-500 ${
                isCurrent ? 'bg-zinc-900/80 backdrop-blur-md border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] scale-105' : 'bg-zinc-950/50 border-zinc-800/50 opacity-60'
              }`}>
                <div className="relative">
                  <img src={player.avatar} alt={player.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-800 border-4 border-zinc-800 shadow-xl" />
                  <div className={`absolute -bottom-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-black text-white border-4 border-zinc-900 shadow-lg ${getPlayerColor(symbol)}`}>
                    {symbol}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="font-black text-white text-base sm:text-lg tracking-tight">{player.name}</div>
                  {player.socketId === socket.id && <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Вы</div>}
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};
