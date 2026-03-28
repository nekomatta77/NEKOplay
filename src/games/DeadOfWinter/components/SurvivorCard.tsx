// src/games/DeadOfWinter/components/SurvivorCard.tsx
import React from 'react';
import { SurvivorData } from '../data/survivors';
import { AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  survivor: SurvivorData;
}

export default function SurvivorCard({ survivor }: Props) {
  return (
    <div className="relative shrink-0 w-32 sm:w-40 rounded-xl overflow-hidden border border-slate-700 shadow-2xl group cursor-pointer transition-all hover:-translate-y-1 hover:border-slate-400 bg-slate-900">
      {/* Картинка персонажа (временная заглушка пока загружается) */}
      <img 
        src={survivor.image} 
        alt={survivor.name} 
        className="w-full h-auto object-cover aspect-[2/3] bg-slate-800 transition-opacity duration-300"
        loading="lazy"
        onError={(e) => {
          // Если ссылка битая, показываем чистый серый фон с именем
          (e.target as HTMLImageElement).style.opacity = '0';
          (e.target as HTMLImageElement).parentElement!.style.background = '#1e293b';
        }}
      />
      
      {/* Градиентный оверлей снизу для текста */}
      <div className="absolute inset-0 bg-gradient-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-2 sm:p-3">
        
        {/* Влияние (в правом верхнем углу) */}
        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm border border-yellow-500/50 px-2 py-1 rounded-full shadow-xl flex items-center gap-1" title="Влияние">
          <InfluenceIcon className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-extrabold text-white text-xs sm:text-sm">{survivor.influence}</span>
        </div>

        <div className="relative z-10">
          <h4 className="text-white font-black text-xs sm:text-sm leading-tight drop-shadow-md truncate group-hover:text-red-300 transition">
            {survivor.name.toUpperCase()}
          </h4>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono mb-2 truncate">
            {survivor.profession}
          </p>
          
          {/* Характеристики */}
          <div className="flex gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold font-mono">
            <div className="flex items-center gap-1 bg-slate-950/80 border border-red-900 px-2 py-1 rounded-md text-red-200" title={`Атака: ${survivor.attack}+`}>
              <AttackIcon className="w-3.5 h-3.5 text-red-500" />
              <span>{survivor.attack}+</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/80 border border-blue-900 px-2 py-1 rounded-md text-blue-200" title={`Поиск: ${survivor.search}+`}>
              <SearchIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>{survivor.search}+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}