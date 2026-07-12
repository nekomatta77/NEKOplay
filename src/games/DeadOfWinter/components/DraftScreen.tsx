// src/games/DeadOfWinter/components/DraftScreen.tsx
import React, { useState } from 'react';
import { GameState } from '../store/gameState';
import { SURVIVORS } from '../data/survivors';

interface Props {
  gameState: GameState;
  currentPlayerId: string;
  onPick: (survivorId: string) => void;
}

export default function DraftScreen({ gameState, currentPlayerId, onPick }: Props) {
  const isMyTurn = gameState.activePlayerId === currentPlayerId;
  const activePlayerName = gameState.players.find(p => p.id === gameState.activePlayerId)?.name;
  
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  const handleCardClick = (survivorId: string) => {
    if (!isMyTurn) return;
    setFlippedCard(survivorId);
    
    // Имитация просмотра карты перед взятием
    setTimeout(() => {
      onPick(survivorId);
      setFlippedCard(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950 pointer-events-none" />
      
      <div className="relative z-10 text-center mb-12">
        <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">Выбор Выживших</h2>
        <p className={`text-lg font-medium ${isMyTurn ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`}>
          {isMyTurn ? 'Ваша очередь! Выберите карту.' : `Ожидайте, выбирает: ${activePlayerName}`}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-6 max-w-5xl">
        {gameState.draftPool.map((survivorId, index) => {
          const isFlipped = flippedCard === survivorId;
          const survivor = SURVIVORS[survivorId];

          return (
            <div 
              key={index}
              onClick={() => handleCardClick(survivorId)}
              className={`relative w-40 h-56 rounded-xl cursor-pointer perspective-1000 transition-transform duration-300 ${isMyTurn ? 'hover:-translate-y-2' : ''}`}
            >
              <div className={`w-full h-full duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* РУБАШКА */}
                <div className="absolute inset-0 w-full h-full backface-hidden bg-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20"></div>
                  <span className="text-zinc-700 font-black text-4xl opacity-50">?</span>
                </div>
                {/* ЛИЦЕВАЯ СТОРОНА (показывается при клике) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-zinc-800 border-2 border-cyan-500 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                   <img src={survivor.image} className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />
                   <div className="absolute bottom-0 w-full bg-black/80 p-2 text-center backdrop-blur-sm">
                     <p className="text-white font-bold text-sm">{survivor.name}</p>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}