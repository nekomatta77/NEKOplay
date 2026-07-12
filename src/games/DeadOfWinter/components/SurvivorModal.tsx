// src/games/DeadOfWinter/components/SurvivorModal.tsx
import React from 'react';
import { SurvivorData } from '../data/survivors'; // Исправлен импорт типа

interface SurvivorModalProps {
  survivor: SurvivorData;
  onClose: () => void;
}

export default function SurvivorModal({ survivor, onClose }: SurvivorModalProps) {
  if (!survivor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Кнопка закрытия */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center transition-colors hover:bg-rose-900/80"
        >
          ✕
        </button>
        
        {/* Шапка с аватаром */}
        <div className="relative h-64 w-full bg-zinc-800">
          <img 
            src={survivor.image} 
            alt={survivor.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-black uppercase tracking-wider text-white">{survivor.name}</h2>
            <p className="text-cyan-400 font-bold">{survivor.profession}</p>
          </div>
        </div>

        {/* Характеристики */}
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5 text-center">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Влияние</div>
              <div className="text-xl font-bold text-white">{survivor.influence}</div>
            </div>
            <div className="flex-1 bg-rose-950/30 rounded-xl p-3 border border-rose-900/30 text-center shadow-[inset_0_0_10px_rgba(225,29,72,0.1)]">
              <div className="text-[10px] text-rose-500 uppercase tracking-widest mb-1">Атака</div>
              <div className="text-xl font-bold text-rose-200">{survivor.attack}+</div>
            </div>
            <div className="flex-1 bg-cyan-950/30 rounded-xl p-3 border border-cyan-900/30 text-center shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]">
              <div className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1">Поиск</div>
              <div className="text-xl font-bold text-cyan-200">{survivor.search}+</div>
            </div>
          </div>

          {/* Способность персонажа */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="text-amber-500">★</span> {survivor.abilityTitle}
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {survivor.abilityDesc}
            </p>
          </div>
        </div>
        
        {/* Подвал */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-600"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}