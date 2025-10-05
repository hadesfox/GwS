// src/types/game.ts

export type Player = 'black' | 'white' | null;
export type GameMode = 'basic' | 'professional';
export type ProfessionalPhase = 
  | 'normal'           // 正常对弈
  | 'three-swap'       // 等待三手交换决定
  | 'five-offer'       // 等待黑方提供两个选点
  | 'five-choose';     // 等待白方选择并决定是否交换

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
  mode: GameMode;
  professionalPhase?: ProfessionalPhase;
  fiveOffers?: Position[];  // 五手两打的两个选点
  forbiddenMoves?: Position[]; // 禁手位置
}

export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;

// 棋型定义
export interface Pattern {
  count: number;      // 连续棋子数
  openEnds: number;   // 开口数（0-2）
  type: 'live' | 'dead' | 'half';  // 活、死、半
}