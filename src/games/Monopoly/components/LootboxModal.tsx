import React, { useState } from 'react';

// Типы редкости для стилизации карточки
type Rarity = 'common' | 'rare' | 'epic';

interface LootboxModalProps {
  onClose: () => void; // Функция для закрытия окна и перехода в инвентарь/меню
}

export const LootboxModal: React.FC<LootboxModalProps> = ({ onClose }) => {
  // Внутреннее состояние: 'received' (показываем кейс) или 'opened' (показываем скин)
  const [stage, setStage] = useState<'received' | 'opened'>('received');

  // Заглушка данных выпавшего скина (в будущем будем получать из props)
  const droppedSkin = {
    brandName: 'ADIDAS ORIGINAL',
    category: 'Footwear Asset',
    rarity: 'epic' as Rarity,
    bonus: '+15$ Rent',
    icon: 'footprint', // Material Symbol name
  };

  // Настройки стилей в зависимости от редкости
  const rarityConfig: Record<Rarity, { color: string; bg: string; text: string }> = {
    common: { color: 'border-[#c5c6cd]', bg: 'bg-[#1c2a41]', text: 'text-[#c5c6cd]' },
    rare: { color: 'border-[#38debb]', bg: 'bg-[#00937a]/10', text: 'text-[#38debb]' },
    epic: { color: 'border-purple-500', bg: 'bg-purple-950/30', text: 'text-purple-400' },
  };

  const currentRarity = rarityConfig[droppedSkin.rarity];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#041329]/90 backdrop-blur-xl transition-opacity duration-500">
      
      {/* СВЕЧЕНИЕ НА ФОНЕ (Радиальный градиент) */}
      <div className={`absolute inset-0 opacity-40 transition-colors duration-1000 ${stage === 'opened' && droppedSkin.rarity === 'epic' ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/80 via-transparent to-transparent' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#38debb]/20 via-transparent to-transparent'}`}></div>

      <div className="relative w-full max-w-sm flex flex-col items-center transform transition-all duration-500 scale-100 opacity-100">
        
        {/* === СТАДИЯ 1: КЕЙС ПОЛУЧЕН === */}
        {stage === 'received' && (
          <div className="w-full flex flex-col items-center text-center space-y-10 animate-fadeIn">
            <h2 className="font-['Manrope'] font-extrabold text-[#bcc6e5] text-xs uppercase tracking-[0.3em]">
              Match Completed
            </h2>
            
            {/* 3D Иконка Кейса (Заглушка) */}
            <div className="relative group cursor-pointer" onClick={() => setStage('opened')}>
              <div className="absolute inset-0 rounded-full bg-[#38debb]/30 blur-3xl transform group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative w-48 h-48 bg-[#0d1c32] rounded-3xl border border-[#44474d]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-[#38debb] shadow-neon">inventory_2</span>
                {/* Эффект свечения щели */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#38debb] shadow-[0_0_15px_5px_rgba(56,222,187,0.5)] rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-['Inter'] text-[#c5c6cd] text-sm">You earned a reward:</p>
              <p className="font-['Manrope'] font-black text-[#d6e3ff] text-2xl tracking-tight">BRONZE BRAND CASE</p>
            </div>

            <button 
              onClick={() => setStage('opened')}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#38debb] to-[#00937a] text-[#002019] font-black font-['Manrope'] text-lg tracking-[0.15em] uppercase shadow-[0_10px_30px_rgba(56,222,187,0.3)] active:scale-95 transition-transform animate-pulse">
              Open Now
            </button>
          </div>
        )}

        {/* === СТАДИЯ 2: КАРТОЧКА ВЫПАЛА === */}
        {stage === 'opened' && (
          <div className="w-full flex flex-col items-center text-center space-y-8 animate-dropIn">
             <h2 className="font-['Manrope'] font-extrabold text-[#bcc6e5] text-xs uppercase tracking-[0.3em]">
              New Asset Acquired
            </h2>

            {/* Коллекционная карточка */}
            <div className={`relative w-full aspect-[3/4] bg-[#1c2a41] rounded-[2rem] p-6 border-4 ${currentRarity.color} shadow-[0_0_60px_-10px_rgba(168,85,247,0.5)] overflow-hidden`}>
              {/* Глухой фон категории */}
              <div className="absolute top-0 left-0 w-full h-24 bg-[#0d1c32] flex items-center justify-center border-b border-[#44474d]/20">
                <span className={`material-symbols-outlined text-7xl ${currentRarity.text} opacity-30`}>{droppedSkin.icon}</span>
              </div>
              
              <div className="relative mt-20 flex flex-col items-center h-full">
                {/* Иконка */}
                <div className={`w-24 h-24 rounded-full ${currentRarity.bg} ${currentRarity.color} border-2 flex items-center justify-center shadow-inner mb-6`}>
                   <span className={`material-symbols-outlined text-5xl ${currentRarity.text}`}>{droppedSkin.icon}</span>
                </div>
                
                {/* Название и редкость */}
                <div className="flex-1 space-y-2 w-full text-left">
                  <p className="font-['Manrope'] font-black text-[#d6e3ff] text-xl leading-tight uppercase tracking-tight">{droppedSkin.brandName}</p>
                  <p className={`font-['Inter'] text-xs font-bold uppercase tracking-widest ${currentRarity.text}`}>{droppedSkin.rarity} {droppedSkin.category}</p>
                </div>
                
                {/* Буст (Бафф) */}
                <div className="w-full mt-auto bg-[#0d1c32] rounded-xl p-3 border border-[#44474d]/30 flex justify-between items-center">
                    <span className="text-[11px] text-[#c5c6cd] font-semibold uppercase tracking-wider">Asset Boost</span>
                    <span className={`font-['Manrope'] font-extrabold text-sm ${currentRarity.text}`}>{droppedSkin.bonus}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-[#27354c] hover:bg-[#1c2a41] text-[#c5c6cd] font-['Manrope'] font-bold text-sm tracking-widest uppercase border border-[#44474d]/30 transition-colors active:scale-95">
              Add to Portfolio
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LootboxModal;