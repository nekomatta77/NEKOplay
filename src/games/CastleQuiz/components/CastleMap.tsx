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
  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-gray-950/80 rounded-[2rem] border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm">
      {/* Сетка на фоне */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <svg className="absolute inset-0 w-full h-full drop-shadow-2xl" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Линии связей */}
        {connections.map((conn, i) => {
          const from = castles.find(c => c.id === conn[0]);
          const to = castles.find(c => c.id === conn[1]);
          if (!from || !to) return null;
          
          const isOwnedConn = from.ownerId && from.ownerId === to.ownerId;
          const strokeColor = isOwnedConn ? getPlayerColor(from.ownerId, true) : "#1f2937";
          
          return (
            <line 
              key={i}
              x1={`${from.cx}`} y1={`${from.cy}`} 
              x2={`${to.cx}`} y2={`${to.cy}`} 
              stroke={strokeColor} 
              strokeWidth={isOwnedConn ? "1.5" : "1"} 
              strokeLinecap="round"
              className="transition-colors duration-500"
              filter={isOwnedConn ? "url(#glow)" : ""}
            />
          );
        })}

        {/* Узлы (замки) */}
        {castles.map(castle => {
          const isClickable = canAttack(castle.id) && turnPlayerId === userId && !attackingCastle && !isProcessingLocal;
          const color = getPlayerColor(castle.ownerId);
          const glowColor = getPlayerColor(castle.ownerId, true);
          
          return (
            <g 
              key={castle.id} 
              className={`transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-[1.15]' : ''}`}
              style={{ transformOrigin: `${castle.cx}px ${castle.cy}px` }}
              onClick={() => handleCastleClick(castle.id)}
            >
              {/* Пульсирующая аура */}
              <circle cx={`${castle.cx}`} cy={`${castle.cy}`} r={castle.isBase ? "10" : "8"} fill={glowColor} opacity="0.15" className="animate-pulse" />
              
              {/* Полигон замка (Ромб/Гексагон) */}
              <polygon 
                points={
                  castle.isBase 
                  ? `${castle.cx},${castle.cy-6} ${castle.cx+5},${castle.cy-3} ${castle.cx+5},${castle.cy+3} ${castle.cx},${castle.cy+6} ${castle.cx-5},${castle.cy+3} ${castle.cx-5},${castle.cy-3}`
                  : `${castle.cx},${castle.cy-4} ${castle.cx+3.5},${castle.cy-2} ${castle.cx+3.5},${castle.cy+2} ${castle.cx},${castle.cy+4} ${castle.cx-3.5},${castle.cy+2} ${castle.cx-3.5},${castle.cy-2}`
                }
                fill={color}
                stroke={isClickable ? "#ffffff" : glowColor}
                strokeWidth={isClickable ? "0.8" : "0.4"}
                filter={castle.ownerId ? "url(#glow)" : ""}
                className="transition-colors duration-500"
              />

              {/* Иконка внутри */}
              {castle.isBase ? (
                <text x={`${castle.cx}`} y={`${castle.cy}`} fontSize="4" fill="#fff" textAnchor="middle" dominantBaseline="central" className="font-bold">★</text>
              ) : (
                <circle cx={`${castle.cx}`} cy={`${castle.cy}`} r="1" fill="#fff" opacity="0.8" />
              )}

              {/* Индикатор возможной атаки */}
              {isClickable && (
                <circle cx={`${castle.cx}`} cy={`${castle.cy}`} r={castle.isBase ? "8" : "6"} fill="none" stroke="#fff" strokeWidth="0.4" strokeDasharray="1 1" className="animate-[spin_4s_linear_infinite]" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};