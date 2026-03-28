// src/games/DeadOfWinter/components/SurvivorCard.tsx
import React from 'react';
import { SurvivorData } from '../data/survivors';
import { AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  survivor: SurvivorData;
}

export default function SurvivorCard({ survivor }: Props) {
  return (
    // ВАЖНО: py-4 и px-3 создают "безопасную зону" вокруг карточки.
    // Теперь таблички, вылетающие за пределы карточки, останутся внутри этого padding'а и не обрежутся браузером!
    // Ширина теперь вычисляется автоматически благодаря h-full и aspect-[2/3]
    <div className="h-full shrink-0 group cursor-pointer py-4 px-3 sm:px-4 flex items-center justify-center">
      
      <div className="relative h-full aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-2">
        
        {/* Желтая табличка Влияния */}
        <div className="absolute -top-4 -right-4 z-30 bg-slate-950/95 backdrop-blur-sm border-2 border-yellow-500 px-2 sm:px-2.5 py-1 rounded-full shadow-2xl flex items-center gap-1 sm:gap-1.5" title="Влияние">
          <InfluenceIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
          <span className="font-extrabold text-white text-xs sm:text-sm leading-none">{survivor.influence}</span>
        </div>

        {/* Рамка карточки */}
        <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-slate-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] bg-slate-900 relative">
          
          {/* Арт персонажа */}
          <img 
            src={survivor.image} 
            alt={survivor.name} 
            className="w-full h-full object-cover transition-opacity duration-300 bg-slate-800"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0';
              (e.target as HTMLImageElement).parentElement!.style.background = '#1e293b';
            }}
          />

          {/* Градиент и Текст (с авто-переносом) */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 sm:h-1/3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col justify-end p-2 sm:p-3 pb-3 sm:pb-4 pointer-events-none z-10">
            {/* break-words и line-clamp-2 аккуратно перенесут имя на вторую строку, если оно длинное */}
            <h4 className="text-white font-black text-xs sm:text-sm lg:text-base leading-tight drop-shadow-lg break-words whitespace-pre-wrap line-clamp-2 w-full group-hover:text-red-300 transition-colors">
              {survivor.name.toUpperCase()}
            </h4>
            <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 font-mono mt-0.5 truncate w-full">
              {survivor.profession}
            </p>
          </div>
        </div>

        {/* Красная табличка Атаки */}
        <div className="absolute -bottom-4 -left-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-950/95 backdrop-blur-sm border-2 border-red-900 px-1.5 sm:px-2 py-1 rounded-lg text-red-200 shadow-xl" title={`Атака: ${survivor.attack}+`}>
          <AttackIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 drop-shadow-md" />
          <span className="font-bold font-mono text-xs sm:text-sm leading-none">{survivor.attack}+</span>
        </div>

        {/* Синяя табличка Поиска */}
        <div className="absolute -bottom-4 -right-4 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-950/95 backdrop-blur-sm border-2 border-blue-900 px-1.5 sm:px-2 py-1 rounded-lg text-blue-200 shadow-xl" title={`Поиск: ${survivor.search}+`}>
          <SearchIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 drop-shadow-md" />
          <span className="font-bold font-mono text-xs sm:text-sm leading-none">{survivor.search}+</span>
        </div>

      </div>
    </div>
  );
}