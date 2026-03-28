// src/games/DeadOfWinter/components/SurvivorCard.tsx
import React from 'react';
import { SurvivorData } from '../data/survivors';
import { AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  survivor: SurvivorData;
}

export default function SurvivorCard({ survivor }: Props) {
  return (
    // Общий контейнер (фиксированная ширина, чтобы высота подстраивалась сама через aspect-ratio)
    <div className="flex flex-col items-center justify-end h-full w-28 sm:w-36 lg:w-44 shrink-0 group cursor-pointer">
      
      {/* 1. Имя и профессия над карточкой */}
      <div className="text-center mb-2 flex flex-col justify-end w-full px-1">
        <h4 className="text-white font-black text-[10px] sm:text-xs lg:text-sm leading-tight drop-shadow-md truncate w-full group-hover:text-red-400 transition-colors">
          {survivor.name.toUpperCase()}
        </h4>
        <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-slate-400 font-mono truncate w-full mt-0.5">
          {survivor.profession}
        </p>
      </div>

      {/* 2. Блок с самой карточкой и значками по углам */}
      <div className="relative w-full aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-2">
        
        {/* Влияние (желтый значок) — выходит за правый верхний угол */}
        <div className="absolute -top-3 -right-3 z-20 bg-slate-950/95 backdrop-blur-sm border-2 border-yellow-500/80 px-2 py-1 rounded-full shadow-xl flex items-center gap-1.5" title="Влияние">
          <InfluenceIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 drop-shadow-md" />
          <span className="font-extrabold text-white text-[10px] sm:text-xs leading-none">{survivor.influence}</span>
        </div>

        {/* Контейнер для картинки (обрезает только картинку, но не значки снаружи) */}
        <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-slate-400 shadow-[0_10px_20px_rgba(0,0,0,0.5)] bg-slate-900 relative">
          <img 
            src={survivor.image} 
            alt={survivor.name} 
            className="w-full h-full object-cover bg-slate-800 transition-opacity duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0';
              (e.target as HTMLImageElement).parentElement!.style.background = '#1e293b';
            }}
          />
          {/* Легкое затемнение снизу, чтобы нижняя рамка не сливалась с ярким артом */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        </div>

        {/* Атака (красный значок) — выходит за левый нижний угол */}
        <div className="absolute -bottom-3 -left-3 z-20 flex items-center gap-1 bg-slate-950/95 backdrop-blur-sm border-2 border-red-900 px-2 py-1 rounded-lg text-red-200 shadow-lg" title={`Атака: ${survivor.attack}+`}>
          <AttackIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 drop-shadow-md" />
          <span className="font-bold font-mono text-[10px] sm:text-xs leading-none">{survivor.attack}+</span>
        </div>

        {/* Поиск (синий значок) — выходит за правый нижний угол */}
        <div className="absolute -bottom-3 -right-3 z-20 flex items-center gap-1 bg-slate-950/95 backdrop-blur-sm border-2 border-blue-900 px-2 py-1 rounded-lg text-blue-200 shadow-lg" title={`Поиск: ${survivor.search}+`}>
          <SearchIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 drop-shadow-md" />
          <span className="font-bold font-mono text-[10px] sm:text-xs leading-none">{survivor.search}+</span>
        </div>

      </div>
    </div>
  );
}