import { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';
import { GameScreen, GameState, ServerMessage, RoomInfo } from '../types';

export const useGame = () => {
  const [screen, setScreen] = useState<GameScreen>(GameScreen.LOGIN);
  const [username, setUsername] = useState('');
  const [serverUrl, setServerUrl] = useState(`ws://${window.location.hostname || 'localhost'}:8080`);
  const [roomId, setRoomId] = useState('');
  const [gridSize, setGridSize] = useState<number>(4);
  const [error, setError] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerNum, setPlayerNum] = useState<number>(-1);
  const [player1Name, setPlayer1Name] = useState<string>('Player 1');
  const [player2Name, setPlayer2Name] = useState<string>('Player 2');

  useEffect(() => {
    const host = window.location.hostname || 'localhost';
    if (host !== 'localhost' && host !== '127.0.0.1') {
      setServerUrl(`ws://${host}:8080`);
    }

    const unsubscribe = gameService.subscribe((msg: ServerMessage) => {
      switch (msg.op) {
        case 'ERROR':
          setError(msg.msg || 'Unknown error');
          setTimeout(() => setError(null), 3000);
          break;
        case 'LOGIN_OK':
          setScreen(GameScreen.LOBBY);
          break;
        case 'ROOM_JOINED':
          if (msg.player_num !== undefined) setPlayerNum(msg.player_num);
          if (msg.room_id) setRoomId(msg.room_id);
          break;
        case 'GAME_START':
          setScreen(GameScreen.GAME);
          if (playerNum === 0) {
            setPlayer1Name(username);
            if (msg.player2) setPlayer2Name(msg.player2);
          } else {
            setPlayer2Name(username);
            if (msg.player1) setPlayer1Name(msg.player1);
          }
          break;
        case 'GAME_STATE':
          if (msg.board && msg.scores) {
            const newGameState = {
              board: msg.board,
              scores: msg.scores,
              turn: msg.turn ?? 0,
              game_over: msg.game_over ?? false,
              winner: msg.winner ?? -1
            };
            setGameState(newGameState);
            if (newGameState.game_over) {
              setTimeout(() => {
                setScreen(GameScreen.LOBBY);
                setGameState(null);
                setPlayerNum(-1);
              }, 6000);
            }
          }
          break;
        case 'ROOM_LIST':
          setRoomList(msg.rooms || []);
          break;
      }
    });
    return () => unsubscribe();
  }, [username, playerNum]);

  useEffect(() => {
    if (screen === GameScreen.LOBBY) {
      gameService.sendMessage({ op: 'LIST_ROOMS' });
      const interval = setInterval(() => gameService.sendMessage({ op: 'LIST_ROOMS' }), 3000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  const connect = async () => {
    if (!username) return setError("Please enter a username");
    try { await gameService.connect(serverUrl, username); } 
    catch (e) { setError("Could not connect to server"); }
  };

  const createRoom = () => {
    if (!roomId) return setError("Enter a Room ID");
    gameService.sendMessage({ op: 'CREATE_ROOM', room_id: roomId, grid_size: gridSize });
  };

  const joinRoom = (id?: string) => {
    const targetId = id || roomId;
    if (!targetId) return setError("Enter a Room ID");
    if (id) setRoomId(id);
    gameService.sendMessage({ op: 'JOIN_ROOM', room_id: targetId });
  };

  const leaveGame = () => window.location.reload();

  return {
    screen, username, setUsername, serverUrl, setServerUrl, roomId, setRoomId,
    gridSize, setGridSize, error, roomList, gameState, playerNum,
    player1Name, player2Name,
    actions: { connect, createRoom, joinRoom, refreshRooms: () => gameService.sendMessage({ op: 'LIST_ROOMS' }), leaveGame }
  };
};