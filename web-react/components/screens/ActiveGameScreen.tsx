import React from 'react';
import GameBoard from '../GameBoard';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';

export const ActiveGameScreen = ({ gameState, playerNum, roomId, player1Name, player2Name, onLeave }: any) => {
  const isMyTurn = gameState.turn === playerNum;
  const isGameOver = gameState.game_over;
  
  // FIX: Handle 0 total score case to avoid NaN
  const total = (gameState.scores[0] + gameState.scores[1]);
  const p1Width = total === 0 ? 50 : (gameState.scores[0] / total) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-white z-20 flex justify-between items-center border-b border-slate-100 shadow-sm shrink-0 h-16">
        <button onClick={onLeave} className="p-2 -ml-2 text-slate-400 hover:bg-slate-50 hover:text-red-400 rounded-xl transition-colors">
            <RotateCcw size={20} strokeWidth={2.5} />
        </button>
        <div className="font-black text-slate-300 tracking-widest uppercase text-xs">Room: {roomId}</div>
        <div className="w-8"></div>
      </div>

      {/* Score Board */}
      <div className="bg-white px-6 pb-6 pt-2 z-10 shadow-sm rounded-b-[2.5rem] shrink-0">
        <div className="flex justify-between items-end mb-4">
            <div className={`transition-all duration-300 ${gameState.turn === 0 ? 'scale-105 opacity-100' : 'opacity-50 grayscale'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-pastel-p1 shadow-[0_0_10px_currentColor]" />
                    <span className="text-xs font-bold text-slate-400 uppercase">{player1Name} {playerNum===0 && '(You)'}</span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-slate-800 leading-none">{gameState.scores[0]}</div>
            </div>
            
            <div className="pb-2 text-slate-200 font-black text-xl">VS</div>

            <div className={`transition-all duration-300 ${gameState.turn === 1 ? 'scale-105 opacity-100' : 'opacity-50 grayscale'} text-right`}>
                <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">{playerNum===1 && '(You)'} {player2Name}</span>
                    <div className="w-2 h-2 rounded-full bg-pastel-p2 shadow-[0_0_10px_currentColor]" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-slate-800 leading-none">{gameState.scores[1]}</div>
            </div>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex ring-4 ring-slate-50">
            <motion.div 
                initial={{ width: '50%' }}
                animate={{ width: `${p1Width}%` }} 
                className="bg-pastel-p1 relative"
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </motion.div>
            <div className="flex-1 bg-pastel-p2 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-0 relative z-0">
        {/* Adjusted padding/sizing logic to be safer on small screens */}
        <div className="w-full aspect-square max-w-[min(100%,_calc(100vh_-_350px))] sm:max-w-[420px] relative">
            <GameBoard gameState={gameState} playerNum={playerNum} isMyTurn={isMyTurn} />
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-6 py-6 pb-8 bg-white border-t border-slate-100 rounded-t-[2.5rem] shrink-0 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
         <AnimatePresence mode="wait">
            {isMyTurn ? (
                <motion.div 
                    key="myturn"
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    className="bg-slate-800 text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-slate-300 transform active:scale-95 transition-transform"
                >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="font-bold text-lg tracking-wide">YOUR TURN</span>
                </motion.div>
            ) : (
                <motion.div 
                    key="waiting"
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    className="bg-slate-50 border-2 border-slate-100 text-slate-400 py-4 px-6 rounded-2xl flex items-center justify-center gap-3"
                >
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-slate-400"></div>
                    <span className="font-bold tracking-wide">OPPONENT'S TURN</span>
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Game Over Modal (Unchanged) */}
      <AnimatePresence>
        {isGameOver && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
                    className="bg-white w-full max-w-sm p-8 rounded-[3rem] shadow-2xl text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pastel-p1 to-pastel-p2" />
                    
                    <div className="w-24 h-24 bg-yellow-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                        <Trophy size={48} className="text-yellow-400 drop-shadow-sm" fill="currentColor" />
                    </div>
                    
                    <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Game Over!</h2>
                    
                    <div className="py-6 space-y-2">
                        {gameState.winner === -1 
                            ? <p className="text-2xl font-bold text-slate-500">It's a Draw! 🤝</p>
                            : (
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Winner</p>
                                    <p className={`text-3xl font-black ${gameState.winner === 0 ? 'text-pastel-p1' : 'text-pastel-p2'}`}>
                                        {gameState.winner === 0 ? player1Name : player2Name}
                                    </p>
                                </div>
                            )
                        }
                    </div>
                    <Button onClick={onLeave} fullWidth className="shadow-xl">Back to Lobby</Button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};