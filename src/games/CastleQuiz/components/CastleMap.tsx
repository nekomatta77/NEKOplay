import React, { useState, useEffect } from 'react';

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
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => setIsPortrait(window.innerWidth < 768);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Математический поворот координат для телефонов (90 градусов)
  const getCoord = (cx: number, cy: number) => {
    return isPortrait ? { x: cy, y: 1000 - cx } : { x: cx, y: cy };
  };

  // Правильный гексагон, который тоже поворачивается вместе с экраном
  const getHexagonPath = (x: number, y: number, r: number) => {
    if (isPortrait) {
      return `M ${x},${y - r} L ${x + r * 0.866},${y - r * 0.5} L ${x + r * 0.866},${y + r * 0.5} L ${x},${y + r} L ${x - r * 0.866},${y + r * 0.5} L ${x - r * 0.866},${y - r * 0.5} Z`;
    } else {
      return `M ${x - r * 0.5},${y - r * 0.866} L ${x + r * 0.5},${y - r * 0.866} L ${x + r},${y} L ${x + r * 0.5},${y + r * 0.866} L ${x - r * 0.5},${y + r * 0.866} L ${x - r},${y} Z`;
    }
  };

  return (
    <div className={`relative w-full ${isPortrait ? 'aspect-[3/5] max-w-sm' : 'aspect-[16/9] lg:aspect-[21/9] max-w-6xl'} bg-[#050508] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all`}>
      
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <svg className="absolute inset-0 w-full h-full" viewBox={isPortrait ? "0 0 600 1000" : "0 0 1000 600"} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {connections.map((conn, i) => {
          const fromRaw = castles.find(c => c.id === conn[0]);
          const toRaw = castles.find(c => c.id === conn[1]);
          if (!fromRaw || !toRaw) return null;
          
          const from = getCoord(fromRaw.cx, fromRaw.cy);
          const to = getCoord(toRaw.cx, toRaw.cy);

          const isOwnedConn = fromRaw.ownerId && fromRaw.ownerId === toRaw.ownerId;
          const strokeColor = isOwnedConn ? getPlayerColor(fromRaw.ownerId, true) : "#1f2937";
          
          return (
            <g key={`conn-${i}`}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={strokeColor} opacity="0.2" strokeWidth="6" />
              <line 
                x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                stroke={strokeColor} strokeWidth={isOwnedConn ? "3" : "2"} 
                strokeDasharray="10 10" className="animate-[dash_2s_linear_infinite]"
                filter={isOwnedConn ? "url(#glow)" : ""}
              />
            </g>
          );
        })}

        {castles.map(castle => {
          const isClickable = canAttack(castle.id) && turnPlayerId === userId && !attackingCastle && !isProcessingLocal;
          const color = getPlayerColor(castle.ownerId);
          const glowColor = getPlayerColor(castle.ownerId, true);
          const size = castle.isBase ? 40 : 25;
          const pos = getCoord(castle.cx, castle.cy);
          
          return (
            <g 
              key={castle.id} 
              className={`transition-all duration-300 ${isClickable ? 'cursor-pointer' : ''}`}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px`, transform: isClickable ? 'scale(1.15)' : 'scale(1)' }}
              onClick={() => handleCastleClick(castle.id)}
            >
              {castle.ownerId && (
                <circle cx={pos.x} cy={pos.y} r={size * 1.5} fill={glowColor} opacity="0.1" className="animate-pulse" />
              )}
              
              <circle 
                cx={pos.x} cy={pos.y} r={size + 10} 
                fill="none" stroke={glowColor} strokeWidth="2" opacity="0.3" 
                strokeDasharray="15 15" 
                className="animate-[spin_6s_linear_infinite]" 
              />

              <path 
                d={getHexagonPath(pos.x, pos.y, size)}
                fill={castle.ownerId ? color : '#111115'}
                stroke={isClickable ? "#ffffff" : glowColor}
                strokeWidth={isClickable ? "4" : "2"}
                filter={castle.ownerId ? "url(#glow)" : ""}
                className="transition-colors duration-500"
              />

              {castle.isBase ? (
                <text x={pos.x} y={pos.y} fontSize="20" fill="#fff" textAnchor="middle" dominantBaseline="central" className="font-bold">★</text>
              ) : (
                <circle cx={pos.x} cy={pos.y} r="4" fill={castle.ownerId ? "#000" : "#fff"} opacity="0.8" />
              )}
            </g>
          );
        })}
      </svg>
      <style>{`@keyframes dash { to { stroke-dashoffset: -20; } }`}</style>
    </div>
  );
};