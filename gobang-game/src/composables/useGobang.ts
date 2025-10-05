// src/composables/useGobang.ts

import { ref, computed } from 'vue';
import type { Player, Position, GameState } from '../types/game';
import { BOARD_SIZE, WIN_COUNT } from '../types/game';

export function useGobang() {
  // 初始化棋盘
  const initBoard = (): Player[][] => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  };

  const board = ref<Player[][]>(initBoard());
  const currentPlayer = ref<'black' | 'white'>('black');
  const winner = ref<Player>(null);
  const isGameOver = ref(false);
  const moveHistory = ref<Position[]>([]);

  // 落子
  const makeMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    board.value[row][col] = currentPlayer.value;
    moveHistory.value.push({ row, col });

    if (checkWin(row, col)) {
      winner.value = currentPlayer.value;
      isGameOver.value = true;
      return true;
    }

    // 检查平局
    if (moveHistory.value.length === BOARD_SIZE * BOARD_SIZE) {
      isGameOver.value = true;
      return true;
    }

    // 切换玩家
    currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
    return true;
  };

  // 检查是否获胜
  const checkWin = (row: number, col: number): boolean => {
    const player = board.value[row][col];
    if (!player) return false;

    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 主对角线
      [1, -1]   // 副对角线
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      // 正方向
      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow < 0 || newRow >= BOARD_SIZE || 
            newCol < 0 || newCol >= BOARD_SIZE || 
            board.value[newRow][newCol] !== player) {
          break;
        }
        count++;
      }

      // 反方向
      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow < 0 || newRow >= BOARD_SIZE || 
            newCol < 0 || newCol >= BOARD_SIZE || 
            board.value[newRow][newCol] !== player) {
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

  // 悔棋
  const undo = () => {
    if (moveHistory.value.length === 0) return;

    const lastMove = moveHistory.value.pop()!;
    board.value[lastMove.row][lastMove.col] = null;
    
    if (isGameOver.value) {
      isGameOver.value = false;
      winner.value = null;
    } else {
      currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
    }
  };

  // 重新开始
  const restart = () => {
    board.value = initBoard();
    currentPlayer.value = 'black';
    winner.value = null;
    isGameOver.value = false;
    moveHistory.value = [];
  };

  const gameState = computed<GameState>(() => ({
    board: board.value,
    currentPlayer: currentPlayer.value,
    winner: winner.value,
    isGameOver: isGameOver.value,
    moveHistory: moveHistory.value
  }));

  return {
    board,
    currentPlayer,
    winner,
    isGameOver,
    moveHistory,
    gameState,
    makeMove,
    undo,
    restart
  };
}