import type { Player, Position } from '../types/game';
import { BOARD_SIZE, WIN_COUNT } from '../types/game';

// 初始化棋盘
export const initBoard = (): Player[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

// 检查胜利
export const checkWin = (board: Player[][], row: number, col: number): boolean => {
  const player = board[row][col];
  if (!player) return false;

  const directions = [
    [0, 1],   // 水平
    [1, 0],   // 垂直
    [1, 1],   // 对角线1
    [1, -1],  // 对角线2
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // 检查正方向
    for (let i = 1; i < WIN_COUNT; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE ||
        board[newRow][newCol] !== player
      ) {
        break;
      }
      count++;
    }

    // 检查反方向
    for (let i = 1; i < WIN_COUNT; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE ||
        board[newRow][newCol] !== player
      ) {
        break;
      }
      count++;
    }

    if (count >= WIN_COUNT) {
      return true;
    }
  }

  return false;
};

// 检查潜在获胜者是否仍然满足胜利条件
export const checkWinStillValid = (board: Player[][], potentialWinner: Player): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === potentialWinner && checkWin(board, r, c)) {
        return true;
      }
    }
  }
  return false;
};

// 检查棋盘是否已满
export const isBoardFull = (board: Player[][]): boolean => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
};

// 获取对手
export const getOpponent = (player: Player): Player => {
  return player === 'black' ? 'white' : 'black';
};