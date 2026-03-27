import React from 'react';

export const InventoryScreen: React.FC = () => {
  return (
    <div className="bg-[#041329] min-h-screen text-[#d6e3ff] pb-24 font-['Inter']">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#0d1c32] shadow-[0_10px_25px_rgba(1,14,36,0.4)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1c2a41] border-2 border-[#bcc6e5]/20">
            <img alt="Player" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
          </div>
          <span className="text-xl font-black tracking-widest uppercase text-[#bcc6e5] font-['Manrope']">Portfolio</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[#bcc6e5] text-xl font-extrabold">$2,450,000</span>
          <span className="text-[10px] uppercase tracking-tighter text-[#38debb]">Liquid Assets</span>
        </div>
      </header>

      <main className="px-6 pt-28 max-w-5xl mx-auto">
        {/* Balance & Filter Section */}
        <section className="mb-10">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button className="px-6 py-2 rounded-full font-['Manrope'] text-xs font-bold transition-all bg-[#bcc6e5] text-[#263049] shadow-[0_0_15px_rgba(188,198,229,0.3)]">All</button>
            <button className="px-6 py-2 rounded-full font-['Manrope'] text-xs font-bold transition-all bg-[#1c2a41] text-[#c5c6cd]">Common</button>
            <button className="px-6 py-2 rounded-full font-['Manrope'] text-xs font-bold transition-all bg-[#1c2a41] text-[#c5c6cd]">Rare</button>
            <button className="px-6 py-2 rounded-full font-['Manrope'] text-xs font-bold transition-all bg-[#1c2a41] text-[#c5c6cd]">Epic</button>
          </div>
        </section>

        {/* Brand Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Card: Nike (Epic) */}
          <div className="group relative flex flex-col bg-[#0d1c32] rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg border border-[#44474d]/10">
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-[#27354c]/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-[#38debb] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> +$45
              </span>
            </div>
            <div className="aspect-square flex items-center justify-center p-8 bg-[#112036]">
              <span className="material-symbols-outlined text-6xl text-[#d6e3ff]">footprint</span>
            </div>
            <div className="p-4 bg-[#1c2a41]">
              <h3 className="font-['Manrope'] font-bold text-sm tracking-tight">Nike Global</h3>
              <p className="text-[10px] text-[#c5c6cd] uppercase tracking-widest mt-1">Epic Asset</p>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 to-fuchsia-500"></div>
          </div>

          {/* Locked Card: Apple */}
          <div className="relative flex flex-col bg-[#0d1c32]/40 rounded-xl overflow-hidden border border-[#44474d]/5 grayscale opacity-60">
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-[#27354c]/60 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-[#c5c6cd] text-2xl">lock</span>
              </div>
            </div>
            <div className="aspect-square flex items-center justify-center p-8 bg-[#0d1c32]">
               <span className="material-symbols-outlined text-6xl text-[#c5c6cd] opacity-20">devices</span>
            </div>
            <div className="p-4 bg-[#0d1c32]">
              <h3 className="font-['Manrope'] font-bold text-sm tracking-tight text-[#c5c6cd]">Apple Inc.</h3>
              <p className="text-[10px] text-[#c5c6cd]/40 uppercase tracking-widest mt-1">Locked</p>
            </div>
            <div className="h-1.5 w-full bg-slate-700"></div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default InventoryScreen;