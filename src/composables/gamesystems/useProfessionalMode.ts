import { ref, computed } from 'vue';
import type { Player, Position, GameMode } from '../../types/game';
import { BOARD_SIZE, WIN_COUNT } from '../../types/game';

export type ProfessionalPhase = 'normal' | 'three-swap' | 'five-offer' | 'five-choose';

export function useProfessionalMode(
  board: any,
  moveHistory: any,
  currentPlayer: any,
  winner: any,
  isGameOver: any
) {
  // 专业模式状态
  const mode = ref<GameMode>('basic');
  const professionalPhase = ref<ProfessionalPhase>('normal');
  const fiveOffers = ref<Position[]>([]);
  const forbiddenMoves = ref<Position[]>([]);
  const hasSwapped = ref(false);

  // 检查模式
  const checkPattern = (row: number, col: number, dx: number, dy: number, player: Player): { count: number; openEnds: number; type: 'live' | 'dead' | 'half' } => {
    if (!player) return { count: 0, openEnds: 0, type: 'dead' };

    let count = 1;
    let leftOpen = false;
    let rightOpen = false;

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

  // 检查是否为禁手
  const isForbiddenMove = (row: number, col: number): boolean => {
    if (mode.value !== 'professional') return false;

    board.value[row][col] = 'black';

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
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

  // 更新禁手
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

  // 交换玩家
  const swapPlayers = () => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'three-swap') {
      return;
    }

    for (const pos of moveHistory.value) {
      const currentColor = board.value[pos.row][pos.col];
      board.value[pos.row][pos.col] = currentColor === 'black' ? 'white' : 'black';
    }

    hasSwapped.value = true;
    currentPlayer.value = 'black';
    professionalPhase.value = 'normal';

    updateForbiddenMoves();
  };

  // 拒绝交换
  const declineSwap = () => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'three-swap') {
      return;
    }

    hasSwapped.value = false;
    currentPlayer.value = 'white';
    professionalPhase.value = 'normal';

    updateForbiddenMoves();
  };

  // 选择五手打点
  const chooseFiveOffer = (offerIndex: number) => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'five-choose' || offerIndex < 0 || offerIndex >= fiveOffers.value.length) {
      return;
    }

    const chosen = fiveOffers.value[offerIndex];
    const pieceColor = hasSwapped.value ? 'white' : 'black';
    board.value[chosen.row][chosen.col] = pieceColor;
    moveHistory.value.push(chosen);

    fiveOffers.value = [];

    currentPlayer.value = hasSwapped.value ? 'black' : 'white';
    professionalPhase.value = 'normal';

    updateForbiddenMoves();
  };

  // 处理专业模式的特殊阶段
  const handleProfessionalPhase = () => {
    if (mode.value !== 'professional') return;

    switch (moveHistory.value.length) {
      case 2:
        currentPlayer.value = 'black';
        updateForbiddenMoves();
        break;
      case 3:
        professionalPhase.value = 'three-swap';
        currentPlayer.value = 'white';
        updateForbiddenMoves();
        break;
      case 4:
        if (professionalPhase.value === 'three-swap') {
          professionalPhase.value = 'normal';
        } else if (professionalPhase.value === 'normal') {
          professionalPhase.value = 'five-offer';
          currentPlayer.value = hasSwapped.value ? 'white' : 'black';
          fiveOffers.value = [];
          updateForbiddenMoves();
        }
        break;
    }
  };

  // 设置游戏模式
  const setMode = (newMode: GameMode) => {
    mode.value = newMode;
    resetProfessionalMode();
  };

  // 重置专业模式
  const resetProfessionalMode = () => {
    professionalPhase.value = 'normal';
    fiveOffers.value = [];
    forbiddenMoves.value = [];
    hasSwapped.value = false;

    if (mode.value === 'professional') {
      const centerPos = Math.floor(BOARD_SIZE / 2);
      board.value[centerPos][centerPos] = 'black';
      moveHistory.value.push({ row: centerPos, col: centerPos });
      currentPlayer.value = 'black';
    }
  };

  return {
    mode,
    professionalPhase,
    fiveOffers,
    forbiddenMoves,
    hasSwapped,
    isForbiddenMove,
    updateForbiddenMoves,
    swapPlayers,
    declineSwap,
    chooseFiveOffer,
    handleProfessionalPhase,
    setMode,
    resetProfessionalMode
  };
}