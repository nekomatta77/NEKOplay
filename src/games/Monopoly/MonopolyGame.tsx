import React, { useState } from 'react';
import LobbyScreen from './components/LobbyScreen';
import BoardScreen from './components/BoardScreen';
import InventoryScreen from './components/InventoryScreen';
import AuctionModal from './components/AuctionModal';
import LootboxModal from './components/LootboxModal';
import { useMonopolyState } from './state';

export const MonopolyGame: React.FC<{ roomId: string; userId: string; userName?: string; userAvatar?: string }> = ({ 
  roomId, 
  userId, 
  userName = `Player_${userId.substring(0, 4)}`, // Fallback если имя не передано
  userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
}) => {
  // Подключаем наш Firebase хук
  const { gameState, toggleReady, startGame } = useMonopolyState(roomId, userId, userName, userAvatar);
  
  const [showAuction, setShowAuction] = useState(false);
  const [showLootbox, setShowLootbox] = useState(false);
  // Временное состояние для навигации внутри игры (инвентарь)
  const [internalScreen, setInternalScreen] = useState<'board' | 'inventory'>('board');

  // Пока данные грузятся из Firebase
  if (!gameState) {
    return <div className="min-h-screen bg-[#041329] text-[#d6e3ff] flex flex-col items-center justify-center font-['Manrope'] font-bold">Подключение к серверу...</div>;
  }

  // Определение текущего экрана на основе статуса из Firebase
  const currentScreen = gameState.status; 

  return (
    <div className="bg-[#041329] min-h-screen text-[#d6e3ff] font-['Inter'] selection:bg-[#38debb]/30 overflow-hidden relative">
      
      {currentScreen === 'lobby' && (
        <LobbyScreen 
          gameState={gameState}
          currentUserId={userId}
          onToggleReady={toggleReady}
          onStartGame={startGame}
        />
      )}

      {currentScreen === 'playing' && internalScreen === 'board' && (
        <>
          <BoardScreen />
          
          <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 scale-75 opacity-50">
            <button onClick={() => setShowAuction(!showAuction)} className="p-2 bg-red-500 rounded text-xs">Аукцион</button>
            <button onClick={() => setShowLootbox(true)} className="p-2 bg-purple-500 rounded text-xs">Лутбокс</button>
            <button onClick={() => setInternalScreen('inventory')} className="p-2 bg-blue-500 rounded text-xs">В инвентарь</button>
          </div>
        </>
      )}

      {currentScreen === 'playing' && internalScreen === 'inventory' && (
        <>
          <InventoryScreen />
          <button onClick={() => setInternalScreen('board')} className="fixed bottom-6 left-6 z-[100] p-4 bg-[#0d1c32] rounded-full border border-[#bcc6e5]/20 shadow-lg active:scale-95 transition-transform">
             <span className="material-symbols-outlined text-[#bcc6e5]">arrow_back</span>
          </button>
        </>
      )}

      {showAuction && <AuctionModal />}

      {showLootbox && (
        <LootboxModal onClose={() => {
          setShowLootbox(false);
          setInternalScreen('inventory'); 
        }} />
      )}

    </div>
  );
};

export default MonopolyGame;