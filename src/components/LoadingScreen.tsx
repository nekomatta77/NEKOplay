import React from 'react';
import { motion } from 'motion/react';
import { Cat } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-6 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
      >
        <Cat className="w-16 h-16 text-indigo-400" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-10 relative z-10 flex flex-col items-center"
      >
        <h2 className="text-3xl font-black tracking-tight mb-4">
          <span className="text-white">NEKO</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">play</span>
        </h2>
        
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ animationDelay: '300ms' }} />
        </div>
        
        <p className="mt-6 text-xs font-bold text-zinc-500 uppercase tracking-widest">Загрузка игры...</p>
      </motion.div>
    </div>
  );
}
