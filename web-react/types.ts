export interface GameBoard {
  horizontal: number[][]; // 0 or 1
  vertical: number[][];   // 0 or 1
  boxes: number[][];      // -1 (unclaimed), 0 (P1), 1 (P2)
}

export interface GameState {
  board: GameBoard;
  scores: [number, number];
  turn: 0 | 1;
  game_over: boolean;
  winner: -1 | 0 | 1;
  player2?: string; // Sometimes sent in GAME_START
}

export interface ServerMessage {
  op: 'LOGIN_OK' | 'ROOM_JOINED' | 'GAME_START' | 'GAME_STATE' | 'ERROR' | 'PONG' | 'ROOM_LIST';
  room_id?: string;
  player_num?: number;
  player1?: string;
  player2?: string;
  msg?: string;
  rooms?: RoomInfo[]; // For ROOM_LIST
  // GameState fields are merged into the root of the message in the provided legacy code
  // but let's handle the dynamic nature in the service.
  board?: GameBoard;
  scores?: [number, number];
  turn?: 0 | 1;
  game_over?: boolean;
  winner?: -1 | 0 | 1;
  grid_size?: number; // New: 3, 4, or 5
}

export interface RoomInfo {
  room_id: string;
  player_count: number;
  players: string[]; // Usernames
  grid_size: number;
  status: 'waiting' | 'playing';
}

export interface Player {
  name: string;
  color: string;
  lightColor: string;
  id: 0 | 1;
}

export enum GameScreen {
  LOGIN,
  LOBBY,
  GAME
}

export interface LineCoordinates {
  type: 'H' | 'V';
  x: number;
  y: number;
}