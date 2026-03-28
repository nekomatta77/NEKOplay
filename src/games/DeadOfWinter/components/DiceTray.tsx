// src/games/DeadOfWinter/components/DiceTray.tsx
import React from 'react';

interface Props {
  isVisible: boolean; // Показываем ли мы поднос прямо сейчас
}

export default function DiceTray({ isVisible }: Props) {
  // pointer-events-none на родителя обязателен, чтобы не блокировать клики по игре, когда кубиков нет.
  // opacity-0/100 и transition делают появление плавным.
  return (
    <div className={`fixed inset-0 z-[140] pointer-events-none transition-opacity duration-500 flex items-center justify-center p-5 sm:p-10 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Затемняющий фон за подносом, когда он появляется */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* === ПОДНОС ДЛЯ КУБИКОВ (Атмосферный дизайн) === */}
      {/* z-index чуть выше фона. Плавное появление через animate-zoom-in (мы пропишем её позже в BoardScreen) */}
      <div className={`relative z-10 w-full max-w-5xl aspect-[16/10] sm:aspect-[16/9] bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden transition-transform duration-500 ${isVisible ? 'scale-100 animate-zoom-in' : 'scale-95'} ${isVisible ? 'pointer-events-auto' : ''}`}>
        
        {/* Атмосферная текстура замороженного дерева (фон подноса) */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NDkzYjgiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>
        
        {/* Бортики подноса */}
        <div className="absolute inset-0 border-[20px] border-slate-900 rounded-3xl pointer-events-none shadow-inner"></div>

        {/* === ЗДЕСЬ БУДУТ ПАДАТЬ КУБИКИ === */}
        {/* Мы даем этому div'у ID, чтобы 3D-движок его нашел */}
        <div id="dice-box-container" className="absolute inset-6 rounded-xl overflow-hidden z-20"></div>

        {/* Декоративная полоса (для эстетики) */}
        <div className="absolute bottom-6 left-6 right-6 h-1 bg-red-900/50 rounded-full blur-sm"></div>
      </div>
    </div>
  );
}