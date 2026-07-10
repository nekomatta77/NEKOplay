// src/games/DeadOfWinter/components/ActionMenu.tsx
import React from 'react';

// Предполагаемые типы (можно вынести в отдельный файл)
interface SurvivorStats {
  attack: number;
  search: number;
}

interface ActionMenuProps {
  survivorStats: SurvivorStats;
  selectedDiceValue: number;
  onAction: (actionType: 'attack' | 'search' | 'barricade' | 'clean') => void;
  onClose: () => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ 
  survivorStats, 
  selectedDiceValue, 
  onAction, 
  onClose 
}) => {
  
  // Логика доступности действий на основе значения выбранного кубика
  const canAttack = selectedDiceValue >= survivorStats.attack;
  const canSearch = selectedDiceValue >= survivorStats.search;

  return (
    <div className="absolute z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 p-4 rounded-xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200">
      
      <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
        <span className="text-zinc-400 text-xs uppercase tracking-widest">Выберите действие</span>
        <button onClick={onClose} className="text-zinc-500 hover:text-rose-400 transition-colors">✕</button>
      </div>

      <ActionButton 
        label="Атака зомби" 
        reqValue={survivorStats.attack} 
        isAvailable={canAttack} 
        onClick={() => onAction('attack')} 
        colorClass="hover:border-rose-500/50 hover:bg-rose-900/30 hover:text-rose-200"
      />
      
      <ActionButton 
        label="Поиск" 
        reqValue={survivorStats.search} 
        isAvailable={canSearch} 
        onClick={() => onAction('search')}
        colorClass="hover:border-cyan-500/50 hover:bg-cyan-900/30 hover:text-cyan-200"
      />

      <ActionButton 
        label="Построить баррикаду" 
        reqValue={1} // Для баррикады нужен любой кубик
        isAvailable={true} 
        onClick={() => onAction('barricade')}
        colorClass="hover:border-amber-500/50 hover:bg-amber-900/30 hover:text-amber-200"
      />

      <ActionButton 
        label="Очистить мусор" 
        reqValue={1} // Для очистки нужен любой кубик
        isAvailable={true} 
        onClick={() => onAction('clean')}
        colorClass="hover:border-emerald-500/50 hover:bg-emerald-900/30 hover:text-emerald-200"
      />
    </div>
  );
};

// Вспомогательный компонент кнопки действия
const ActionButton: React.FC<{ 
  label: string; 
  reqValue: number; 
  isAvailable: boolean; 
  onClick: () => void;
  colorClass: string;
}> = ({ label, reqValue, isAvailable, onClick, colorClass }) => (
  <button
    onClick={onClick}
    disabled={!isAvailable}
    className={`
      flex items-center justify-between w-64 px-4 py-3 rounded-md border transition-all duration-200
      ${isAvailable 
        ? `border-white/5 bg-white/5 text-zinc-300 cursor-pointer ${colorClass}` 
        : 'border-transparent bg-zinc-900/30 text-zinc-700 cursor-not-allowed'}
    `}
  >
    <span className="font-medium">{label}</span>
    <span className={`text-xs font-bold px-2 py-1 rounded bg-black/50 ${isAvailable ? 'text-zinc-400' : 'text-zinc-700'}`}>
      {reqValue}+
    </span>
  </button>
);