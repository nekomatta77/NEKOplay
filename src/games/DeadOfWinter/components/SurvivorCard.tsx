// src/games/DeadOfWinter/components/SurvivorCard.tsx
import React from 'react';
import { SurvivorData } from '../data/survivors';
import { AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  survivor: SurvivorData;
}

export default function SurvivorCard({ survivor }: Props) {
  return (
    <div className="relative shrink-0 h-full aspect-[2/3] rounded-xl overflow-hidden border border-slate-700 shadow-2xl group cursor-pointer transition-all hover:-translate-y-1 hover:border-slate-400 bg-slate-900">
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
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-2 sm:p-3">
        
        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm border border-yellow-500/50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-xl flex items-center gap-1" title="Влияние">
          <InfluenceIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
          <span className="font-extrabold text-white text-[10px] sm:text-xs">{survivor.influence}</span>
        </div>

        <div className="relative z-10">
          <h4 className="text-white font-black text-[10px] sm:text-xs leading-tight drop-shadow-md truncate group-hover:text-red-300 transition">
            {survivor.name.toUpperCase()}
          </h4>
          <p className="text-[8px] sm:text-[9px] text-slate-400 font-mono mb-1.5 truncate">
            {survivor.profession}
          </p>
          
          <div className="flex gap-1 text-[9px] sm:text-[10px] font-bold font-mono">
            <div className="flex items-center gap-1 bg-slate-950/80 border border-red-900 px-1.5 py-0.5 rounded-md text-red-200">
              <AttackIcon className="w-3 h-3 text-red-500" />
              <span>{survivor.attack}+</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950/80 border border-blue-900 px-1.5 py-0.5 rounded-md text-blue-200">
              <SearchIcon className="w-3 h-3 text-blue-500" />
              <span>{survivor.search}+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}