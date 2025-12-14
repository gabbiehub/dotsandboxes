import React from 'react';
import { useGame } from './hooks/useGame';
import { GameScreen } from './types';
import { GameLayout } from './components/GameLayout';
import { LoginScreen } from './components/screens/LoginScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { ActiveGameScreen } from './components/screens/ActiveGameScreen';
import { AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const { screen, username, setUsername, serverUrl, setServerUrl, roomId, setRoomId, gridSize, setGridSize, error, roomList, gameState, playerNum, player1Name, player2Name, actions } = useGame();

  return (
    <GameLayout>
      <AnimatePresence mode="wait">
        {screen === GameScreen.LOGIN && (
            <LoginScreen key="login" username={username} setUsername={setUsername} serverUrl={serverUrl} setServerUrl={setServerUrl} onConnect={actions.connect} error={error} />
        )}

        {screen === GameScreen.LOBBY && (
            <LobbyScreen key="lobby" username={username} roomId={roomId} setRoomId={setRoomId} gridSize={gridSize} setGridSize={setGridSize} roomList={roomList} onCreate={actions.createRoom} onJoin={actions.joinRoom} onJoinSpecific={actions.joinRoom} onRefresh={actions.refreshRooms} error={error} />
        )}

        {screen === GameScreen.GAME && gameState && (
            <ActiveGameScreen key="game" gameState={gameState} playerNum={playerNum} roomId={roomId} player1Name={player1Name} player2Name={player2Name} onLeave={actions.leaveGame} />
        )}
      </AnimatePresence>
    </GameLayout>
  );
};

export default App;