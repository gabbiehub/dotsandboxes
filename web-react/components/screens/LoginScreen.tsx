import React from 'react';
import { Button } from '../Button';
import { motion } from 'framer-motion';

export const LoginScreen = ({ username, setUsername, serverUrl, setServerUrl, onConnect, error }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-24 h-24 bg-gradient-to-tr from-white to-slate-50 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-5xl shadow-xl shadow-indigo-100 border border-white"
          >
            🎲
          </motion.div>
          <h1 className="text-5xl font-black text-slate-800 mb-2 tracking-tighter">
            Dots<span className="text-pastel-p2">&</span>Boxes
          </h1>
          <p className="text-slate-400 font-medium text-lg">Online Strategy Game</p>
        </div>

        <div className="space-y-5 bg-white/80 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 backdrop-blur-sm border border-white/50">
          <div>
            <label className="ml-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <input 
              type="text" 
              placeholder="e.g. MasterMind" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-700 focus:outline-none focus:border-pastel-p2 transition-colors mt-2"
            />
          </div>
          
          <div>
            <label className="ml-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Server IP</label>
            <input 
              type="text" 
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-medium text-slate-500 focus:outline-none focus:border-pastel-p2 transition-colors mt-2"
            />
          </div>

          <div className="pt-4">
            <Button onClick={onConnect} fullWidth className="text-lg py-4 shadow-lg shadow-pastel-p2/30">
              Start Playing
            </Button>
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-red-50 text-red-500 font-bold text-center rounded-2xl border border-red-100"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};