import React from 'react';

export const AuctionModal: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#041329]/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0d1c32]/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#44474d]/10 overflow-hidden">
        
        {/* Modal Header */}
        <div className="relative h-40 bg-[#010e24] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c32] to-transparent z-10"></div>
          <div className="absolute bottom-6 left-6 z-20 flex items-end gap-4">
            <div className="w-16 h-24 bg-[#38debb] rounded-xl shadow-lg border-4 border-[#010e24] flex flex-col p-2">
              <div className="h-3 w-full bg-black/20 rounded-sm mb-auto"></div>
              <span className="material-symbols-outlined text-[#041329] text-3xl mx-auto">apartment</span>
            </div>
            <div>
              <span className="text-[#38debb] font-['Manrope'] font-bold tracking-widest text-xs uppercase">Live Auction</span>
              <h2 className="text-2xl font-['Manrope'] font-extrabold text-[#d6e3ff] tracking-tight">Park Place</h2>
            </div>
          </div>
          {/* Timer */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-[#93000a]/20 px-4 py-2 rounded-full border border-[#ffb4ab]/20">
            <span className="material-symbols-outlined text-[#ffb4ab]">timer</span>
            <span className="text-[#ffb4ab] font-['Manrope'] font-black text-lg">15s</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Current Bid */}
          <div className="flex flex-col items-center py-4 rounded-3xl bg-[#1c2a41]/40 border border-[#44474d]/5">
            <span className="text-[#c5c6cd] text-xs uppercase tracking-[0.2em] mb-1">Current Bid</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#38debb] font-['Manrope'] font-bold text-xl">$</span>
              <span className="text-5xl font-['Manrope'] font-black text-[#d6e3ff]">450</span>
            </div>
          </div>

          {/* Bid Controls */}
          <div className="grid grid-cols-3 gap-3">
            <button className="flex flex-col items-center py-3 bg-[#1c2a41] active:scale-95 rounded-xl border border-[#44474d]/20">
              <span className="text-[10px] text-[#77819e] uppercase tracking-widest mb-1">Increment</span>
              <span className="text-lg font-['Manrope'] font-black text-[#bcc6e5]">+$50</span>
            </button>
            <button className="flex flex-col items-center py-3 bg-[#1c2a41] active:scale-95 rounded-xl border border-[#44474d]/20">
              <span className="text-[10px] text-[#77819e] uppercase tracking-widest mb-1">Standard</span>
              <span className="text-lg font-['Manrope'] font-black text-[#bcc6e5]">+$100</span>
            </button>
            <button className="flex flex-col items-center py-3 bg-[#1c2a41] active:scale-95 rounded-xl border border-[#44474d]/20">
              <span className="text-[10px] text-[#77819e] uppercase tracking-widest mb-1">Power</span>
              <span className="text-lg font-['Manrope'] font-black text-[#bcc6e5]">+$500</span>
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <button className="flex-1 py-4 bg-gradient-to-br from-[#bcc6e5] to-[#0e1830] text-[#263049] font-['Manrope'] font-extrabold rounded-xl shadow-xl active:scale-[0.98]">
              Place Custom Bid
            </button>
            <button className="px-8 py-4 bg-[#27354c] text-[#c5c6cd] hover:text-[#ffb4ab] font-['Manrope'] font-bold rounded-xl border border-[#44474d]/20">
              Pass
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionModal;