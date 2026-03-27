import React from 'react';
import { MonopolyGameState, MonopolyPlayer } from '../types';

interface LobbyScreenProps {
  gameState: MonopolyGameState;
  currentUserId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ gameState, currentUserId, onToggleReady, onStartGame }) => {
  // ИСПРАВЛЕНИЕ ЗДЕСЬ: Явно указываем TypeScript, что это массив типа MonopolyPlayer[]
  const players = Object.values(gameState.players || {}) as MonopolyPlayer[];
  const currentPlayer = gameState.players[currentUserId];
  const isHost = currentPlayer?.isHost;
  
  // Проверяем, все ли игроки нажали "Готов"
  const allReady = players.length > 1 && players.every((p: MonopolyPlayer) => p.isReady);

  return (
    <div className="pb-32 select-none">
      <header className="w-full top-0 z-50 sticky bg-[#041329] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#bcc6e5] cursor-pointer">grid_view</span>
          <h1 className="font-['Manrope'] uppercase font-black text-xl text-[#d6e3ff] tracking-tighter">
            NOCTURNE BOARDROOM
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#bcc6e5]/20">
          <img alt="Player Avatar" className="w-full h-full object-cover" src={currentPlayer?.avatar} />
        </div>
      </header>

      <main className="px-6 pt-4 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-['Manrope'] text-xs font-bold tracking-[0.2em] text-[#c5c6cd] uppercase">Current Lobby</h2>
            <span className="text-[10px] font-bold text-[#38debb] bg-[#38debb]/10 px-2 py-0.5 rounded-full">
              {players.length}/4 PLAYERS
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {players.map((player: MonopolyPlayer) => (
              <div key={player.id} className={`bg-[#0d1c32] p-4 rounded-xl flex items-center justify-between transition-all ${player.id === currentUserId ? 'border-l-4 border-[#38debb] shadow-lg' : ''}`}>
                <div className="flex items-center gap-4">
                  <img alt={player.name} className={`w-12 h-12 rounded-lg object-cover ${!player.isReady ? 'opacity-80' : ''}`} src={player.avatar} />
                  <div>
                    <p className="font-['Manrope'] font-bold text-sm text-[#d6e3ff]">
                      {player.name} {player.id === currentUserId && '(Вы)'}
                    </p>
                    <p className="text-[10px] text-[#c5c6cd] uppercase tracking-widest font-semibold">
                      {player.isHost ? 'Host' : 'Member'}
                    </p>
                  </div>
                </div>
                {player.isReady ? (
                  <span className="text-[10px] font-black text-[#38debb] shadow-[0_0_15px_rgba(56,222,187,0.4)] px-3 py-1 bg-[#38debb]/10 rounded-full">READY</span>
                ) : (
                  <span className="text-[10px] font-black text-[#ffb4ab] shadow-[0_0_15px_rgba(255,180,171,0.4)] px-3 py-1 bg-[#ffb4ab]/10 rounded-full">NOT READY</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Скины (пока оставляем визуальной заглушкой, подключим к инвентарю позже) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Manrope'] text-xs font-bold tracking-[0.2em] text-[#c5c6cd] uppercase">My Match Skins</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 snap-x">
             <div className="snap-start min-w-[160px] flex-shrink-0 group opacity-50">
              <div className="text-[9px] font-black text-[#c5c6cd]/60 uppercase mb-2 tracking-widest">Inventory</div>
              <div className="relative bg-[#0d1c32] rounded-xl aspect-[3/4] p-3 border border-[#44474d]/20 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-[#44474d] uppercase tracking-tighter text-center">Скины будут доступны<br/>в следующих обновлениях</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-50 bg-[#0d1c32]/80 backdrop-blur-md rounded-t-2xl border-t border-[#44474d]/20 px-6 py-6 pb-8 space-y-3">
        {isHost && allReady && (
          <button 
            onClick={onStartGame}
            className="w-full py-3 rounded-xl bg-[#bcc6e5] text-[#0e1830] font-black font-['Manrope'] text-sm tracking-[0.1em] uppercase shadow-[0_5px_15px_rgba(188,198,229,0.2)] active:scale-95 transition-transform animate-pulse">
            START GAME
          </button>
        )}
        <button 
          onClick={onToggleReady}
          className={`w-full py-5 rounded-2xl font-black font-['Manrope'] text-lg tracking-[0.15em] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 transition-all ${
            currentPlayer?.isReady 
              ? 'bg-transparent border-2 border-[#ffb4ab] text-[#ffb4ab]' 
              : 'bg-gradient-to-r from-[#38debb] to-[#00937a] text-[#002019] shadow-[0_10px_30px_rgba(56,222,187,0.3)]'
          }`}>
          {currentPlayer?.isReady ? 'CANCEL READY' : 'READY'}
        </button>
      </div>
    </div>
  );
};

export default LobbyScreen;