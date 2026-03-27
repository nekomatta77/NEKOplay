import React from 'react';

export const BoardScreen: React.FC = () => {
  return (
    <div className="bg-[#041329] text-[#d6e3ff] font-['Inter'] min-h-screen select-none pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329]">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#bcc6e5]">menu</span>
          <h1 className="font-['Manrope'] font-black tracking-widest uppercase text-[#d6e3ff] text-xl">
            MONOPOLY
          </h1>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#1c2a41] border-2 border-[#bcc6e5] overflow-hidden">
            <img alt="Player Profile" className="w-full h-full object-cover" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
          </div>
        </div>
      </header>

      <main className="pt-20 pb-8 flex flex-col items-center px-4">
        {/* The Board - Grid 11x11 */}
        <div className="w-full aspect-square max-w-md relative bg-[#010e24] rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-0.5 p-0.5">
            {/* TOP ROW */}
            <div className="bg-[#2c3951] flex flex-col items-center justify-end pb-1 border-b-4 border-[#ffb4ab]">
              <span className="text-[6px] font-bold text-[#c5c6cd]">FREE</span>
            </div>
            <div className="bg-[#0d1c32] border-b-4 border-[#ffb4ab]"></div>
            <div className="bg-[#0d1c32] border-b-4 border-[#ffb4ab]"></div>
            <div className="bg-[#0d1c32] border-b-4 border-[#ff0000]"></div>
            <div className="bg-[#0d1c32] border-b-4 border-[#ff0000]"></div>
            <div className="bg-[#0d1c32]"></div> {/* Train */}
            <div className="bg-[#0d1c32] border-b-4 border-[#ffff00]"></div>
            <div className="bg-[#0d1c32] border-b-4 border-[#ffff00]"></div>
            <div className="bg-[#0d1c32]"></div> {/* Water */}
            <div className="bg-[#0d1c32] border-b-4 border-[#ffff00]"></div>
            <div className="bg-[#2c3951] flex flex-col items-center justify-end pb-1">
              <span className="text-[6px] font-bold text-[#c5c6cd]">JAIL</span>
            </div>

            {/* MIDDLE ROWS */}
            <div className="bg-[#0d1c32] border-r-4 border-[#ff8000]"></div>
            
            {/* Center Content (Log & Dice) */}
            <div className="col-span-9 row-span-9 bg-[#010e24] flex flex-col p-4 relative">
              {/* Action Log */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4 no-scrollbar">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d1c32]">
                  <span className="material-symbols-outlined text-[#38debb] text-sm">casino</span>
                  <p className="text-[10px] text-[#c5c6cd]"><span className="text-[#d6e3ff] font-bold">Alex</span> rolled a 7.</p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-[#0d1c32]">
                  <span className="material-symbols-outlined text-[#bcc6e5] text-sm">apartment</span>
                  <p className="text-[10px] text-[#c5c6cd]"><span className="text-[#d6e3ff] font-bold">Alex</span> purchased <span className="text-[#38debb]">Park Place</span> for $350.</p>
                </div>
              </div>

              {/* Main Action / Dice */}
              <div className="flex flex-col items-center gap-4 mt-auto">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#2c3951] rounded-lg shadow-inner flex items-center justify-center border border-[#44474d]/20">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="w-1 h-1 bg-[#d6e3ff] rounded-full"></div>
                      <div className="w-1 h-1 bg-[#d6e3ff] rounded-full"></div>
                      <div className="w-1 h-1 bg-[#d6e3ff] rounded-full"></div>
                      <div className="w-1 h-1 bg-[#d6e3ff] rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-[#2c3951] rounded-lg shadow-inner flex items-center justify-center border border-[#44474d]/20">
                    <div className="w-1.5 h-1.5 bg-[#38debb] rounded-full"></div>
                  </div>
                </div>
                <button className="w-full py-4 rounded-xl bg-gradient-to-br from-[#bcc6e5] to-[#0e1830] text-[#263049] font-['Manrope'] font-extrabold tracking-widest text-sm shadow-lg active:scale-95 transition-transform uppercase">
                  Roll 2 Dice
                </button>
              </div>
            </div>

            <div className="bg-[#0d1c32] border-l-4 border-[#00ff00]"></div>
            <div className="bg-[#0d1c32] border-r-4 border-[#ff8000]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#00ff00]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#00ff00]"></div>
            <div className="bg-[#0d1c32] border-r-4 border-[#ff8000]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#0000ff]"></div>
            <div className="bg-[#0d1c32] border-r-4 border-[#800080]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-r-4 border-[#800080]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#0000ff]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#0000ff]"></div>
            <div className="bg-[#0d1c32] border-r-4 border-[#800080]"></div>
            <div className="bg-[#0d1c32] border-l-4 border-[#0000ff]"></div>

            {/* BOTTOM ROW */}
            <div className="bg-[#2c3951] flex flex-col items-center justify-center border-t-4 border-[#bcc6e5]">
              <span className="text-[8px] font-black text-[#bcc6e5]">GO</span>
            </div>
            <div className="bg-[#0d1c32] border-t-4 border-[#a52a2a]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-t-4 border-[#a52a2a]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-t-4 border-[#87ceeb]"></div>
            <div className="bg-[#0d1c32]"></div>
            <div className="bg-[#0d1c32] border-t-4 border-[#87ceeb]"></div>
            <div className="bg-[#0d1c32] border-t-4 border-[#87ceeb]"></div>
            <div className="bg-[#2c3951] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[#ffb4ab] text-lg">local_police</span>
            </div>
          </div>

          {/* Player Token (Abstract) */}
          <div className="absolute top-[85%] left-[85%] w-4 h-4 rounded-full bg-[#38debb] ring-2 ring-[#041329] shadow-md transition-all duration-500"></div>
        </div>

        {/* Quick Stats Bento */}
        <div className="w-full max-w-md mt-6 grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-[#0d1c32] flex flex-col">
            <span className="text-[#c5c6cd] text-[10px] uppercase font-bold tracking-wider">Properties Owned</span>
            <span className="text-2xl font-['Manrope'] font-extrabold text-[#d6e3ff] mt-1">12</span>
          </div>
          <div className="p-4 rounded-xl bg-[#0d1c32] flex flex-col">
            <span className="text-[#c5c6cd] text-[10px] uppercase font-bold tracking-wider">Net Worth</span>
            <span className="text-2xl font-['Manrope'] font-extrabold text-[#38debb] mt-1">$4,850</span>
          </div>
        </div>
      </main>

      {/* Bottom Player Panel */}
      <footer className="fixed bottom-0 w-full z-50 bg-[#0d1c32]/90 backdrop-blur-md px-4 pb-6 pt-4 rounded-t-3xl shadow-[0_-10px_25px_rgba(1,14,36,0.4)] border-t border-[#44474d]/20">
        <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Active Player */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[#1c2a41] text-[#38debb] rounded-xl p-3 ring-2 ring-[#38debb]/30 min-w-[80px]">
            <img alt="Alex" className="w-10 h-10 rounded-full border-2 border-[#38debb] object-cover mb-1" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
            <span className="text-[10px] font-bold truncate w-full text-center">Alex</span>
            <span className="text-[12px] font-black text-[#d6e3ff]">$1,500</span>
          </div>
          {/* Player 2 */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center text-[#c5c6cd] p-3 min-w-[80px]">
            <img alt="Jordan" className="w-10 h-10 rounded-full border border-[#44474d] opacity-60 object-cover mb-1" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan" />
            <span className="text-[10px] font-medium truncate w-full text-center">Jordan</span>
            <span className="text-[12px] font-bold text-[#c5c6cd]">$1,240</span>
          </div>
          {/* Player 3 */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center text-[#c5c6cd] p-3 min-w-[80px]">
             <img alt="Sam" className="w-10 h-10 rounded-full border border-[#44474d] opacity-60 object-cover mb-1" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" />
            <span className="text-[10px] font-medium truncate w-full text-center">Sam</span>
            <span className="text-[12px] font-bold text-[#c5c6cd]">$980</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BoardScreen;