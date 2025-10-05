// src/types/game.ts

export type Player = 'black' | 'white' | null;

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: Player[][];
  currentPlayer: 'black' | 'white';
  winner: Player;
  isGameOver: boolean;
  moveHistory: Position[];
}

export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;