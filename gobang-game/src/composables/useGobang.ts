// src/composables/useGobang.ts

import { ref, computed } from 'vue';
import type { Player, Position, GameState, GameMode, ProfessionalPhase, Pattern } from '../types/game';
import { BOARD_SIZE, WIN_COUNT } from '../types/game';

export function useGobang() {
  const initBoard = (): Player[][] => {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  };

  const board = ref<Player[][]>(initBoard());
  const currentPlayer = ref<'black' | 'white'>('black');
  const winner = ref<Player>(null);
  const isGameOver = ref(false);
  const moveHistory = ref<Position[]>([]);
  const mode = ref<GameMode>('basic');
  const professionalPhase = ref<ProfessionalPhase>('normal');
  const fiveOffers = ref<Position[]>([]);
  const forbiddenMoves = ref<Position[]>([]);

  const lastMove = computed(() => {
    return moveHistory.value.length > 0 
      ? moveHistory.value[moveHistory.value.length - 1] 
      : null;
  });

  // 检查某个方向的棋型
  const checkPattern = (row: number, col: number, dx: number, dy: number, player: Player): Pattern => {
    if (!player) return { count: 0, openEnds: 0, type: 'dead' };

    let count = 1;
    let leftOpen = false;
    let rightOpen = false;

    // 正向检查
    let i = 1;
    while (true) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (board.value[newRow][newCol] === player) {
        count++;
        i++;
      } else if (board.value[newRow][newCol] === null) {
        rightOpen = true;
        break;
      } else {
        break;
      }
    }

    // 反向检查
    i = 1;
    while (true) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
      if (board.value[newRow][newCol] === player) {
        count++;
        i++;
      } else if (board.value[newRow][newCol] === null) {
        leftOpen = true;
        break;
      } else {
        break;
      }
    }

    const openEnds = (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0);
    let type: 'live' | 'dead' | 'half' = 'dead';
    if (openEnds === 2) type = 'live';
    else if (openEnds === 1) type = 'half';

    return { count, openEnds, type };
  };

  // 检查是否为禁手（仅对黑方）
  const isForbiddenMove = (row: number, col: number): boolean => {
    if (mode.value !== 'professional') return false;
    
    // 临时放置黑子
    board.value[row][col] = 'black';

    const directions = [
      [0, 1],   // 横向
      [1, 0],   // 纵向
      [1, 1],   // 主对角线
      [1, -1]   // 副对角线
    ];

    let liveThreeCount = 0;
    let fourCount = 0;
    let longConnect = false;

    for (const [dx, dy] of directions) {
      const pattern = checkPattern(row, col, dx, dy, 'black');
      
      if (pattern.count >= 6) {
        longConnect = true;
        break;
      }

      if (pattern.count === 3 && pattern.type === 'live') {
        liveThreeCount++;
      }

      if (pattern.count === 4) {
        fourCount++;
      }
    }

    board.value[row][col] = null;

    if (longConnect) return true;
    if (liveThreeCount >= 2) return true;
    if (fourCount >= 2) return true;

    return false;
  };

  // 更新禁手位置
  const updateForbiddenMoves = () => {
    if (mode.value !== 'professional' || currentPlayer.value !== 'black') {
      forbiddenMoves.value = [];
      return;
    }

    const forbidden: Position[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board.value[row][col] === null && isForbiddenMove(row, col)) {
          forbidden.push({ row, col });
        }
      }
    }
    forbiddenMoves.value = forbidden;
  };

  // 检查是否获胜
  const checkWin = (row: number, col: number): boolean => {
    const player = board.value[row][col];
    if (!player) return false;

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

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

  // 落子
  const makeMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    // **新增：专业模式第一手必须在中心**
    const centerPos = Math.floor(BOARD_SIZE / 2);
    if (mode.value === 'professional' && moveHistory.value.length === 0) {
      if (row !== centerPos || col !== centerPos) {
        return false; // 第一手不在中心，拒绝落子
      }
    }

    // 专业模式：五手两打阶段 - 记录提供的选点
    if (mode.value === 'professional' && professionalPhase.value === 'five-offer') {
      if (fiveOffers.value.length < 2) {
        if (isForbiddenMove(row, col)) {
          return false;
        }
        fiveOffers.value.push({ row, col });
        
        if (fiveOffers.value.length === 2) {
          professionalPhase.value = 'five-choose';
          currentPlayer.value = 'white';
        }
        return true;
      }
      return false;
    }

    // 专业模式：检查禁手
    if (mode.value === 'professional' && currentPlayer.value === 'black') {
      if (isForbiddenMove(row, col)) {
        winner.value = 'white';
        isGameOver.value = true;
        return false;
      }
    }

    board.value[row][col] = currentPlayer.value;
    moveHistory.value.push({ row, col });

    if (checkWin(row, col)) {
      winner.value = currentPlayer.value;
      isGameOver.value = true;
      return true;
    }

    if (moveHistory.value.length === BOARD_SIZE * BOARD_SIZE) {
      isGameOver.value = true;
      return true;
    }

    // 专业模式阶段判断
    if (mode.value === 'professional') {
      if (moveHistory.value.length === 3) {
        professionalPhase.value = 'three-swap';
        currentPlayer.value = 'white';
        updateForbiddenMoves();
        return true;
      } else if (moveHistory.value.length === 4 && professionalPhase.value === 'three-swap') {
        professionalPhase.value = 'normal';
      } else if (moveHistory.value.length === 5 && professionalPhase.value === 'normal') {
        professionalPhase.value = 'five-offer';
        currentPlayer.value = 'black';
        fiveOffers.value = [];
        updateForbiddenMoves();
        return true;
      }
    }

    currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
    updateForbiddenMoves();
    
    return true;
  };

  // 三手交换
  const swapPlayers = () => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'three-swap') {
      return;
    }

    for (const pos of moveHistory.value) {
      const currentColor = board.value[pos.row][pos.col];
      board.value[pos.row][pos.col] = currentColor === 'black' ? 'white' : 'black';
    }

    currentPlayer.value = 'black';
    professionalPhase.value = 'normal';
    
    updateForbiddenMoves();
  };

  // 拒绝三手交换
  const declineSwap = () => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'three-swap') {
      return;
    }

    currentPlayer.value = 'black';
    professionalPhase.value = 'normal';
    
    updateForbiddenMoves();
  };

  // **修改：五手两打 - 白方选择一个选点（不能交换）**
  const chooseFiveOffer = (offerIndex: number) => {
    if (mode.value !== 'professional' || 
        professionalPhase.value !== 'five-choose' ||
        offerIndex < 0 || offerIndex >= fiveOffers.value.length) {
      return;
    }

    const chosen = fiveOffers.value[offerIndex];
    board.value[chosen.row][chosen.col] = 'black';
    moveHistory.value.push(chosen);

    fiveOffers.value = [];
    
    // 直接进入正常对弈，白方继续
    currentPlayer.value = 'white';
    professionalPhase.value = 'normal';
    
    updateForbiddenMoves();
  };

  // 悔棋
  const undo = () => {
    if (moveHistory.value.length === 0) return;

    if (mode.value === 'professional') {
      if (professionalPhase.value === 'five-offer' && fiveOffers.value.length > 0) {
        fiveOffers.value.pop();
        return;
      }
      
      if (professionalPhase.value !== 'normal') {
        return;
      }
    }

    const lastMovePos = moveHistory.value.pop()!;
    board.value[lastMovePos.row][lastMovePos.col] = null;
    
    if (isGameOver.value) {
      isGameOver.value = false;
      winner.value = null;
    } else {
      currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
    }
    
    updateForbiddenMoves();
  };

  // 设置游戏模式
  const setMode = (newMode: GameMode) => {
    mode.value = newMode;
    restart();
  };

  // 重新开始
  const restart = () => {
    board.value = initBoard();
    currentPlayer.value = 'black';
    winner.value = null;
    isGameOver.value = false;
    moveHistory.value = [];
    professionalPhase.value = 'normal';
    fiveOffers.value = [];
    forbiddenMoves.value = [];
  };

  const gameState = computed<GameState>(() => ({
    board: board.value,
    currentPlayer: currentPlayer.value,
    winner: winner.value,
    isGameOver: isGameOver.value,
    moveHistory: moveHistory.value,
    mode: mode.value,
    professionalPhase: professionalPhase.value,
    fiveOffers: fiveOffers.value,
    forbiddenMoves: forbiddenMoves.value
  }));

  return {
    board,
    currentPlayer,
    winner,
    isGameOver,
    moveHistory,
    lastMove,
    mode,
    professionalPhase,
    fiveOffers,
    forbiddenMoves,
    gameState,
    makeMove,
    undo,
    restart,
    setMode,
    swapPlayers,
    declineSwap,
    chooseFiveOffer
  };
}