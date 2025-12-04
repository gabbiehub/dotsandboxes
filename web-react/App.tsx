import React, { useState, useEffect } from 'react';
import { gameService } from './services/gameService';
import { GameScreen, GameState, ServerMessage, RoomInfo } from './types';
import { Button } from './components/Button';
import GameBoard from './components/GameBoard';
import { RotateCcw, Copy, Users, Trophy, Grid3x3, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.LOGIN);
  const [username, setUsername] = useState('');
  const [serverUrl, setServerUrl] = useState(`ws://${window.location.hostname || 'localhost'}:8080`);
  const [roomId, setRoomId] = useState('');
  const [gridSize, setGridSize] = useState<number>(4); // 3, 4, or 5
  const [error, setError] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  
  // Game State
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerNum, setPlayerNum] = useState<number>(-1);
  const [player1Name, setPlayer1Name] = useState<string>('Player 1');
  const [player2Name, setPlayer2Name] = useState<string>('Player 2');

  useEffect(() => {
    // Determine default server URL
    const host = window.location.hostname || 'localhost';
    if (host !== 'localhost' && host !== '127.0.0.1') {
        setServerUrl(`ws://${host}:8080`);
    }

    const unsubscribe = gameService.subscribe((msg: ServerMessage) => {
      console.log('Received:', msg);
      if (msg.op === 'ERROR') {
        setError(msg.msg || 'Unknown error');
        setTimeout(() => setError(null), 3000);
      }
      
      if (msg.op === 'LOGIN_OK') {
        setScreen(GameScreen.LOBBY);
      }

      if (msg.op === 'ROOM_JOINED') {
        if (msg.player_num !== undefined) setPlayerNum(msg.player_num);
        if (msg.room_id) setRoomId(msg.room_id);
      }

      if (msg.op === 'GAME_START') {
        setScreen(GameScreen.GAME);
        // Set names: current user is already in username state
        // msg.player2 is sent from server with opponent's name
        if (playerNum === 0) {
          setPlayer1Name(username);
          if (msg.player2) setPlayer2Name(msg.player2);
        } else {
          setPlayer2Name(username);
          // Server sends player1's name in some implementations, or infer from room
          if (msg.player1) setPlayer1Name(msg.player1);
        }
      }

      if (msg.op === 'GAME_STATE') {
        // Construct GameState from message
        if (msg.board && msg.scores) {
            const newGameState = {
                board: msg.board,
                scores: msg.scores,
                turn: msg.turn ?? 0,
                game_over: msg.game_over ?? false,
                winner: msg.winner ?? -1
            };
            setGameState(newGameState);
            
            // Auto-redirect to lobby 5 seconds after game over
            if (newGameState.game_over) {
              setTimeout(() => {
                setScreen(GameScreen.LOBBY);
                setGameState(null);
              }, 5000);
            }
        }
      }

      if (msg.op === 'ROOM_LIST') {
        setRoomList(msg.rooms || []);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-refresh room list when in lobby
  useEffect(() => {
    if (screen === GameScreen.LOBBY) {
      gameService.sendMessage({ op: 'LIST_ROOMS' });
      const interval = setInterval(() => {
        gameService.sendMessage({ op: 'LIST_ROOMS' });
      }, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval);
    }
  }, [screen]);

  const handleConnect = async () => {
    if (!username) {
        setError("Please enter a username");
        return;
    }
    try {
        await gameService.connect(serverUrl, username);
    } catch (e) {
        setError("Could not connect to server");
    }
  };

  const handleCreateRoom = () => {
    if (!roomId) return setError("Enter a Room ID");
    gameService.sendMessage({ op: 'CREATE_ROOM', room_id: roomId, grid_size: gridSize });
  };

  const handleJoinRoom = () => {
    if (!roomId) return setError("Enter a Room ID");
    gameService.sendMessage({ op: 'JOIN_ROOM', room_id: roomId });
  };

  const handleJoinFromList = (room_id: string) => {
    setRoomId(room_id);
    gameService.sendMessage({ op: 'JOIN_ROOM', room_id });
  };

  const refreshRooms = () => {
    gameService.sendMessage({ op: 'LIST_ROOMS' });
  };

  const handleLeave = () => {
      // Refresh page to reset completely or implement clean leave logic
      window.location.reload();
  };

  // --- Renders ---

  if (screen === GameScreen.LOGIN) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-pastel-bg">
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-pastel-p2 rounded-full flex items-center justify-center text-4xl shadow-inner">
                    🎮
                </div>
            </div>
          <h1 className="text-4xl font-black text-pastel-text mb-2 tracking-tight">Dots & Boxes</h1>
          <p className="text-gray-400 mb-8 font-medium">Connect lines, close boxes!</p>
          
          <div className="space-y-4">
            <div className="text-left">
                <label className="ml-2 text-sm font-bold text-gray-400 uppercase">Username</label>
                <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-pastel-p2 transition-colors text-gray-700 font-bold"
                />
            </div>
            
            <div className="text-left">
                 <label className="ml-2 text-sm font-bold text-gray-400 uppercase">Server URL</label>
                <input 
                    type="text" 
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-pastel-p2 transition-colors text-gray-500"
                />
            </div>

            <Button onClick={handleConnect} fullWidth>
              Start Playing
            </Button>
            
            {error && <div className="text-pastel-p1 font-bold mt-2 animate-pulse">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (screen === GameScreen.LOBBY) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-pastel-bg">
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md">
           <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-pastel-text">Lobby</h2>
                <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                    Online as {username}
                </div>
           </div>

           <div className="space-y-4">
            <div>
                 <label className="ml-2 text-sm font-bold text-gray-400 uppercase">Room ID</label>
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="e.g. room1"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xl focus:outline-none focus:border-pastel-p2 transition-colors font-bold text-gray-700"
                    />
                 </div>
            </div>

            <div>
              <label className="ml-2 text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                <Grid3x3 size={14} />
                Grid Size
              </label>
              <div className="flex gap-2 mt-2">
                {[3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`flex-1 py-2 px-4 rounded-xl font-bold transition-all ${
                      gridSize === size
                        ? 'bg-pastel-p2 text-white shadow-md'
                        : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <Button variant="primary" onClick={handleCreateRoom}>
                    Create Room
                </Button>
                <Button variant="secondary" onClick={handleJoinRoom}>
                    Join Room
                </Button>
            </div>
             {error && <div className="text-pastel-p1 font-bold mt-2 text-center">{error}</div>}

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-400 uppercase">Available Rooms</label>
                <button
                  onClick={refreshRooms}
                  className="text-pastel-p2 hover:text-pastel-p1 transition-colors"
                  title="Refresh rooms"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              
              {roomList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No active rooms. Create one to get started!
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {roomList.map((room) => (
                    <div
                      key={room.room_id}
                      onClick={() => room.player_count < 2 && handleJoinFromList(room.room_id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        room.player_count >= 2
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-slate-50 border-slate-100 hover:border-pastel-p2 cursor-pointer hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-700">{room.room_id}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {room.player_count}/2
                            </span>
                            <span className="flex items-center gap-1">
                              <Grid3x3 size={12} />
                              {room.grid_size || 4}×{room.grid_size || 4}
                            </span>
                          </div>
                        </div>
                        {room.player_count >= 2 && (
                          <div className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                            FULL
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
           </div>
           
           <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-gray-400 text-sm">Waiting for game start...</p>
                {playerNum !== -1 && (
                    <div className="mt-4 bg-blue-50 text-blue-600 p-4 rounded-2xl animate-bounce font-bold">
                        Joined {roomId}! Waiting for opponent...
                    </div>
                )}
           </div>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen flex flex-col bg-pastel-bg max-w-xl mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="bg-white p-4 rounded-b-[30px] shadow-sm z-10">
        <div className="flex justify-between items-center mb-4">
            <button onClick={handleLeave} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                <RotateCcw size={20} className="text-gray-500" />
            </button>
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Room: {roomId}</div>
            <div className="p-2">
                <Users size={20} className="text-gray-400" />
            </div>
        </div>

        {/* Score Board */}
        <div className="flex justify-between items-center gap-4">
            <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center transition-all duration-300 ${gameState?.turn === 0 ? 'bg-pastel-p1 text-white shadow-lg scale-105' : 'bg-pastel-p1Light text-pastel-p1'}`}>
                <span className="text-xs font-bold uppercase mb-1">{player1Name || 'Player 1'}</span>
                <span className="text-3xl font-black">{gameState?.scores[0] ?? 0}</span>
            </div>
            
            <div className="text-gray-300 font-black text-xl">VS</div>

            <div className={`flex-1 p-3 rounded-2xl flex flex-col items-center transition-all duration-300 ${gameState?.turn === 1 ? 'bg-pastel-p2 text-white shadow-lg scale-105' : 'bg-pastel-p2Light text-pastel-p2'}`}>
                <span className="text-xs font-bold uppercase mb-1">{player2Name || 'Player 2'}</span>
                <span className="text-3xl font-black">{gameState?.scores[1] ?? 0}</span>
            </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 relative">
        {gameState && (
            <GameBoard 
                gameState={gameState} 
                playerNum={playerNum} 
                isMyTurn={gameState.turn === playerNum}
                player1Name={player1Name}
                player2Name={player2Name}
            />
        )}
      </main>

      {/* Footer Status */}
      <div className="p-6 text-center pb-8">
        {!gameState?.game_over ? (
            <div className={`transform transition-all duration-500 ${gameState?.turn === playerNum ? 'scale-110' : 'scale-100 opacity-80'}`}>
                <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xl shadow-lg border-b-4 transition-colors ${
                    gameState?.turn === playerNum 
                    ? 'bg-white text-gray-800 border-green-400 ring-4 ring-green-100' 
                    : 'bg-slate-100 text-gray-400 border-slate-300'
                }`}>
                    {gameState?.turn === playerNum ? (
                        <>
                            <span className="animate-bounce">✨</span>
                            <span>It's Your Turn!</span>
                            <span className="animate-bounce">✨</span>
                        </>
                    ) : (
                        <>
                            <span className="animate-spin">⏳</span>
                            <span>Waiting for {gameState?.turn === 0 ? (player1Name || 'Player 1') : (player2Name || 'Player 2')}...</span>
                        </>
                    )}
                </div>
            </div>
        ) : (
            /* Game Over Modal Overlay */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white p-8 rounded-[40px] shadow-2xl border-b-8 border-slate-100 w-full max-w-sm text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Trophy size={48} className="text-yellow-500 drop-shadow-sm" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">Game Over!</h2>
                    
                    <div className="py-4">
                        {gameState.winner === -1 ? (
                            <p className="text-xl font-bold text-gray-500">It's a Draw! 🤝</p>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Winner</p>
                                <p className={`text-2xl font-black ${gameState.winner === 0 ? 'text-pastel-p1' : 'text-pastel-p2'}`}>
                                    {gameState.winner === 0 ? (player1Name || 'Player 1') : (player2Name || 'Player 2')}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-3">
                        <p className="text-xs font-bold text-gray-400 bg-slate-50 py-2 rounded-lg">
                            Returning to lobby in 5 seconds...
                        </p>
                        <Button onClick={handleLeave} fullWidth>
                            Back to Lobby Now
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default App;