// src/games/DeadOfWinter/components/Icons.tsx
import React from 'react';

interface IconProps {
  className?: string;
}

// Ресурсы колонии
export const MoraleIcon = ({ className = "w-5 h-5 text-red-500" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

export const FoodIcon = ({ className = "w-5 h-5 text-emerald-500" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export const WasteIcon = ({ className = "w-5 h-5 text-slate-500" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Угрозы и персонажи
export const ZombieIcon = ({ className = "w-5 h-5 text-lime-500" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,2A3,3,0,0,0,9,5V6H8A2,2,0,0,0,6,8v2.58l-1.29,1.29A1,1,0,0,0,5.41,13.29l1.59-1.59V15a2,2,0,0,0,2,2h6a2,2,0,0,0,2-2V11.71l1.59,1.59a1,1,0,0,0,1.41-1.41L18,10.58V8a2,2,0,0,0-2-2H15V5A3,3,0,0,0,12,2Zm1,4H11V5a1,1,0,0,1,2,0Z"/>
    <path d="M7,18a1,1,0,0,0-1,1v2a1,1,0,0,0,2,0V19A1,1,0,0,0,7,18Z"/>
    <path d="M17,18a1,1,0,0,0-1,1v2a1,1,0,0,0,2,0V19A1,1,0,0,0,17,18Z"/>
  </svg>
);

export const SurvivorIcon = ({ className = "w-5 h-5 text-slate-400" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Характеристики на карточках
export const AttackIcon = ({ className = "w-4 h-4 text-red-400" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.37 11.22L16 14.59 13.41 12 14.59 10.82 19.37 6.04A1.99 1.99 0 0 0 19.37 3.21A1.99 1.99 0 0 0 16.54 3.21L11.76 7.99 10.58 6.81 8 9.4 11.37 12.77 4.14 20H2V17.86L9.23 10.63L8 9.4 5.41 12 6.59 13.18 1.81 17.96A1.99 1.99 0 0 0 1.81 20.79A1.99 1.99 0 0 0 4.64 20.79L9.42 16L10.6 17.18 13.19 14.59 9.82 11.22 17.05 4H19.19V6.14L11.96 13.37L13.14 14.55 15.73 11.96 14.55 10.78 19.33 6 19.37 11.22Z" />
  </svg>
);

export const SearchIcon = ({ className = "w-4 h-4 text-blue-400" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const InfluenceIcon = ({ className = "w-3 h-3 text-white" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,2L15.09,8.26L22,9.27L17,14.14L18.18,21.02L12,17.77L5.82,21.02L7,14.14L2,9.27L8.91,8.26L12,2Z" />
  </svg>
);

// Цели и Кризисы
export const ObjectiveIcon = ({ className = "w-6 h-6 text-blue-400" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

export const CrisisIcon = ({ className = "w-6 h-6 text-red-500" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);