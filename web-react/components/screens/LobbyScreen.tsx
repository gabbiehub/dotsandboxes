import React from 'react';
import { Button } from '../Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Grid3x3, RefreshCw, Plus, LogIn } from 'lucide-react';

export const LobbyScreen = ({ 
  username, roomId, setRoomId, gridSize, setGridSize, 
  roomList, onCreate, onJoin, onJoinSpecific, onRefresh, error 
}: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-6 h-screen"
    >
      <div className="flex items-center justify-between mb-8 pt-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Lobby</h2>
          <p className="text-slate-400 font-medium text-sm">Welcome back, {username}</p>
        </div>
        <div className="bg-white px-2 py-2 rounded-full shadow-sm border border-slate-100">
           <div className="w-10 h-10 bg-gradient-to-br from-pastel-p1 to-rose-300 rounded-full flex items-center justify-center text-white font-bold text-lg">
             {username.charAt(0).toUpperCase()}
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-6 border border-white">
        <div className="space-y-5">
            <div>
                <label className="ml-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Room Name</label>
                <input 
                    type="text" 
                    placeholder="Enter Room ID..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-lg font-bold text-slate-700 mt-2 focus:border-pastel-p2 focus:outline-none transition-colors"
                />
            </div>
            
            <div>
                <label className="ml-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Grid Size</label>
                <div className="flex gap-3 mt-2">
                    {[3, 4, 5].map(size => (
                        <button
                            key={size}
                            onClick={() => setGridSize(size)}
                            className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 ${
                                gridSize === size 
                                ? 'bg-pastel-p2 border-pastel-p2 text-white shadow-lg shadow-pastel-p2/20 scale-105' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-pastel-p2'
                            }`}
                        >
                            {size}×{size}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                <Button onClick={onCreate} className="py-3 text-sm"> <Plus size={18} className="mr-2"/> Create</Button>
                <Button variant="secondary" onClick={onJoin} className="py-3 text-sm"> <LogIn size={18} className="mr-2"/> Join</Button>
            </div>
        </div>
        {error && <div className="mt-4 text-center text-red-400 font-bold text-sm bg-red-50 py-2 rounded-xl">{error}</div>}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 px-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Rooms</label>
          <button onClick={onRefresh} className="p-2 bg-white rounded-full text-slate-400 hover:text-pastel-p2 hover:rotate-180 transition-all duration-500 shadow-sm">
            <RefreshCw size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
            <AnimatePresence>
                {roomList.length === 0 ? (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="text-center py-10 text-slate-300 font-medium">
                        No active rooms found.
                    </motion.div>
                ) : (
                    roomList.map((room: any) => (
                        <motion.div
                            key={room.room_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => room.player_count < 2 && onJoinSpecific(room.room_id)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative ${
                                room.player_count >= 2 
                                ? 'bg-slate-50 border-slate-100 opacity-60' 
                                : 'bg-white border-slate-100 hover:border-pastel-p2 hover:shadow-lg hover:shadow-pastel-p2/10'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-700 text-lg">{room.room_id}</h3>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Grid3x3 size={12}/> {room.grid_size}×{room.grid_size}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Users size={12}/> {room.player_count}/2
                                        </span>
                                    </div>
                                </div>
                                {room.player_count < 2 && (
                                    <div className="w-10 h-10 bg-pastel-p2/10 rounded-full flex items-center justify-center text-pastel-p2">
                                        <LogIn size={20} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};