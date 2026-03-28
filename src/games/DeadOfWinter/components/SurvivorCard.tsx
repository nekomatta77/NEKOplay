// src/games/DeadOfWinter/components/SurvivorCard.tsx
// Анализ каждой строки для максимальной точности

import React from 'react';
import { SurvivorData } from '../data/survivors';
import { AttackIcon, SearchIcon, InfluenceIcon } from './Icons';

interface Props {
  survivor: SurvivorData;
}

export default function SurvivorCard({ survivor }: Props) {
  return (
    // Анализ строки: snap-center гарантирует, что карточка при скролле примагнитится к центру
    // relative и z-index нужны для абсолютно позиционированных табличек
    <div className="flex flex-col items-center justify-end h-full w-32 sm:w-40 lg:w-48 shrink-0 group cursor-pointer relative z-0">
      
      {/* Контейнер для самой карточки и значков */}
      <div className="relative w-full aspect-[2/3] transition-transform duration-300 group-hover:-translate-y-2">
        
        {/* === ИСПРАВЛЕНИЕ: ЖЕЛТАЯ ТАБЛИЧКА ВЛИЯНИЯ === */}
        {/* Анализ строки: -top-3.5 -right-3.5 z-30 гарантирует, что табличка выходит за правый верхний угол и не перекрывается артом */}
        {/* backdrop-blur-sm и background bg-slate-950/95 делают её читаемой на любом фоне */}
        <div className="absolute -top-3.5 -right-3.5 z-30 bg-slate-950/95 backdrop-blur-sm border-2 border-yellow-500 px-2 py-1 rounded-full shadow-2xl flex items-center gap-1.5" title="Влияние">
          <InfluenceIcon className="w-4 h-4 text-yellow-400" />
          <span className="font-extrabold text-white text-xs sm:text-sm leading-none">{survivor.influence}</span>
        </div>

        {/* Рамка карточки */}
        <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-slate-700 group-hover:border-slate-400 shadow-[0_10px_25px_rgba(0,0,0,0.6)] bg-slate-900 relative">
          
          {/* Арт персонажа на всю карточку */}
          {/* object-cover и transition-opacity для плавного появления арта */}
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

          {/* === ГРАМОТНОЕ РЕШЕНИЕ ДЛЯ ТЕКСТА === */}
          {/* Анализ строки: h-1/3 bg-gradient-to-t делает темную градиентную подложку внизу карточки */}
          {/* pointer-events-none гарантирует, что клики проходят сквозь текст на карточку */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col justify-end p-3 pb-4 pointer-events-none z-10">
            {/* Имя — Крупное, Четкое */}
            <h4 className="text-white font-black text-xs sm:text-sm lg:text-base leading-tight drop-shadow-lg truncate w-full group-hover:text-red-300 transition-colors">
              {survivor.name.toUpperCase()}
            </h4>
            {/* Профессия — Чуть меньше, моноширинный шрифт */}
            <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 font-mono mt-0.5 truncate w-full">
              {survivor.profession}
            </p>
          </div>
        </div>

        {/* Значок Атаки — выходит за левый нижний угол */}
        {/* Анализ строки: border-2 border-red-900 px-2 py-1 text-red-200 shadow-xl */}
        <div className="absolute -bottom-3.5 -left-3.5 z-20 flex items-center gap-1.5 bg-slate-950/95 backdrop-blur-sm border-2 border-red-900 px-2 py-1 rounded-lg text-red-200 shadow-xl" title={`Атака: ${survivor.attack}+`}>
          <AttackIcon className="w-4 h-4 text-red-500 drop-shadow-md" />
          <span className="font-bold font-mono text-xs sm:text-sm leading-none">{survivor.attack}+</span>
        </div>

        {/* Значок Поиска — выходит за правый нижний угол */}
        {/* Анализ строки: border-2 border-blue-900 px-2 py-1 text-blue-200 shadow-xl */}
        <div className="absolute -bottom-3.5 -right-3.5 z-20 flex items-center gap-1.5 bg-slate-950/95 backdrop-blur-sm border-2 border-blue-900 px-2 py-1 rounded-lg text-blue-200 shadow-xl" title={`Поиск: ${survivor.search}+`}>
          <SearchIcon className="w-4 h-4 text-blue-500 drop-shadow-md" />
          <span className="font-bold font-mono text-xs sm:text-sm leading-none">{survivor.search}+</span>
        </div>

      </div>
    </div>
  );
}