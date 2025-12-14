import React from 'react';
import { motion } from 'framer-motion';

export const GameLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#F0F4F8] text-slate-700 font-sans overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pastel-p1/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-pastel-p2/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        layout
        className="relative z-10 mx-auto max-w-md min-h-screen flex flex-col bg-white/60 backdrop-blur-xl shadow-2xl sm:border-x border-white/50"
      >
        {children}
      </motion.div>
    </div>
  );
};