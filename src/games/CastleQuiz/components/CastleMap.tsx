import React from 'react';

interface CastleMapProps {
  castles: any[];
  connections: number[][];
  turnPlayerId: string;
  userId: string;
  attackingCastle: number | null;
  isProcessingLocal: boolean;
  canAttack: (id: number) => boolean;
  getPlayerColor: (id: string | null, isGlow?: boolean) => string;
  handleCastleClick: (id: number) => void;
}

export const CastleMap: React.FC<CastleMapProps> = ({ 
  castles, connections, turnPlayerId, userId, attackingCastle, isProcessingLocal, canAttack, getPlayerColor, handleCastleClick 
}) => {

  // Функция для отрисовки идеального гексагона (шестиугольника)
  const getHexagonPath = (cx: number, cy: number, r: number) => {
    return `M ${cx},${cy - r} 
            L ${cx + r * 0.866},${cy - r * 0.5} 
            L ${cx + r * 0.866},${cy + r * 0.5} 
            L ${cx},${cy + r} 
            L ${cx - r * 0.866},${cy + r * 0.5} 
            L ${cx - r * 0.866},${cy - r * 0.5} Z`;
  };

  return (
    <div className="relative w-full max-w-6xl aspect-[16/9] lg:aspect-[21/9] bg-[#050508] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Сетка в стиле радара */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Жесткий viewBox (1000x600) гарантирует, что на ЛЮБОМ устройстве карта не растянется и сохранит идеальные пропорции */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Линии связи (Потоки данных) */}
        {connections.map((conn, i) => {
          const from = castles.find(c => c.id === conn[0]);
          const to = castles.find(c => c.id === conn[1]);
          if (!from || !to) return null;
          
          const isOwnedConn = from.ownerId && from.ownerId === to.ownerId;
          const strokeColor = isOwnedConn ? getPlayerColor(from.ownerId, true) : "#1f2937";
          
          return (
            <g key={`conn-${i}`}>
              {/* Фоновая толстая тусклая линия */}
              <line 
                x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy} 
                stroke={strokeColor} opacity="0.2" strokeWidth="6" 
              />
              {/* Яркая пунктирная линия с анимацией потока */}
              <line 
                x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy} 
                stroke={strokeColor} strokeWidth={isOwnedConn ? "3" : "2"} 
                strokeDasharray="10 10" className="animate-[dash_2s_linear_infinite]"
                filter={isOwnedConn ? "url(#glow)" : ""}
              />
            </g>
          );
        })}

        {/* Узлы (Шестиугольники) */}
        {castles.map(castle => {
          const isClickable = canAttack(castle.id) && turnPlayerId === userId && !attackingCastle && !isProcessingLocal;
          const color = getPlayerColor(castle.ownerId);
          const glowColor = getPlayerColor(castle.ownerId, true);
          const size = castle.isBase ? 40 : 25;
          
          return (
            <g 
              key={castle.id} 
              className={`transition-all duration-300 ${isClickable ? 'cursor-pointer' : ''}`}
              style={{ transformOrigin: `${castle.cx}px ${castle.cy}px`, transform: isClickable ? 'scale(1.15)' : 'scale(1)' }}
              onClick={() => handleCastleClick(castle.id)}
            >
              {/* Фоновое свечение базы */}
              {castle.ownerId && (
                <circle cx={castle.cx} cy={castle.cy} r={size * 1.5} fill={glowColor} opacity="0.1" className="animate-pulse" />
              )}
              
              {/* Вращающееся внешнее кольцо-радар */}
              <circle 
                cx={castle.cx} cy={castle.cy} r={size + 10} 
                fill="none" stroke={glowColor} strokeWidth="2" opacity="0.3" 
                strokeDasharray="15 15" 
                className="animate-[spin_6s_linear_infinite]" 
              />

              {/* Тело гексагона */}
              <path 
                d={getHexagonPath(castle.cx, castle.cy, size)}
                fill={castle.ownerId ? color : '#111115'}
                stroke={isClickable ? "#ffffff" : glowColor}
                strokeWidth={isClickable ? "4" : "2"}
                filter={castle.ownerId ? "url(#glow)" : ""}
                className="transition-colors duration-500"
              />

              {/* Иконка внутри гексагона */}
              {castle.isBase ? (
                <text x={castle.cx} y={castle.cy} fontSize="20" fill="#fff" textAnchor="middle" dominantBaseline="central" className="font-bold">★</text>
              ) : (
                <circle cx={castle.cx} cy={castle.cy} r="4" fill={castle.ownerId ? "#000" : "#fff"} opacity="0.8" />
              )}
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes dash { to { stroke-dashoffset: -20; } }
      `}</style>
    </div>
  );
};