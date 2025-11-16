import { ref, computed } from 'vue';
import type { Player, Position, GameState, GameMode } from '../types/game';
import { BOARD_SIZE } from '../types/game';
import { initBoard, checkWin, checkWinStillValid, isBoardFull, getOpponent } from '../utils/boardUtils';
import { useManaSystem } from './gamesystems/useManaSystem';
import { useSkillSystem } from './gamesystems/useSkillSystem';
import { useProfessionalMode } from './gamesystems/useProfessionalMode';

export function useGobang() {
  // 基础游戏状态
  const board = ref<Player[][]>(initBoard());
  const currentPlayer = ref<Player>('black');
  const winner = ref<Player | null>(null);
  const isGameOver = ref(false);
  const moveHistory = ref<Position[]>([]);
  const lastMove = ref<Position | null>(null);

  // 额外回合反制机制
  const isExtraTurn = ref(false);
  const potentialWinner = ref<Player | null>(null);
  const isExtraTurnEnabled = ref(true);

  // 弹窗提示状态（替换直接DOM操作）
  const alertMessage = ref<string | null>(null);

  // 初始化子系统
  const {
    blackMana,
    whiteMana,
    manaGrowthMode,
    toggleManaGrowthMode,
    updateManaByTotalMoves,
    addManaCheat,
    resetMana,
    getPlayerMana,
    consumeMana
  } = useManaSystem();

  const {
    updateForbiddenMoves,
    isForbiddenMove,
    ...professionalMode
  } = useProfessionalMode(board, moveHistory, currentPlayer, winner, isGameOver);

  const {
    skillState,
    skipNextTurn,
    counterWindowOpen,
    counterWindowPlayer,
    flySandBanned,
    diversionTurnsLeft,
    reverseEffect,
    lastRemovedPiece,
    useSkill,
    executeSkillEffect,
    cancelSkillSelection,
    closeCounterWindow,
    executeMightyPower,
    resetSkills
  } = useSkillSystem(
    board,
    moveHistory,
    currentPlayer,
    winner,
    isGameOver,
    isExtraTurn,
    potentialWinner,
    isExtraTurnEnabled,
    updateForbiddenMoves,
    consumeMana
  );

  // 显示弹窗提示
  const showAlert = (message: string, duration: number = 2000) => {
    alertMessage.value = message;
    setTimeout(() => {
      alertMessage.value = null;
    }, duration);
  };

  // 检查移动是否有效
  const isValidMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    // 检查是否被两极反转锁定
    if (
      reverseEffect.value.casterLocked &&
      currentPlayer.value === reverseEffect.value.casterPlayer
    ) {
      return false;
    }

    return true;
  };

  // 处理专业模式的五手打点
  const handleFiveOfferPhase = (row: number, col: number): boolean => {
    if (professionalMode.mode.value !== 'professional' || professionalMode.professionalPhase.value !== 'five-offer') {
      return false;
    }

    if (professionalMode.fiveOffers.value.length < 2) {
      if (professionalMode.hasSwapped.value) {
        // 交换过,白方提供落点
      } else {
        if (isForbiddenMove(row, col)) {
          return false;
        }
      }

      professionalMode.fiveOffers.value.push({ row, col });

      if (professionalMode.fiveOffers.value.length === 2) {
        professionalMode.professionalPhase.value = 'five-choose';
        professionalMode.currentPlayer.value = professionalMode.hasSwapped.value ? 'black' : 'white';
      }
      return true;
    }
    return false;
  };

  // 处理专业模式的禁手
  const handleProfessionalForbiddenMove = (row: number, col: number): boolean => {
    if (professionalMode.mode.value === 'professional' && currentPlayer.value === 'black') {
      if (isForbiddenMove(row, col)) {
        winner.value = 'white';
        isGameOver.value = true;
        return false;
      }
    }
    return true;
  };

  // 处理落子
  const handlePiecePlacement = (row: number, col: number) => {
    if (professionalMode.mode.value === 'basic') {
      board.value[row][col] = currentPlayer.value;
    } else {
      if (moveHistory.value.length === 1) {
        board.value[row][col] = 'white';
      } else {
        board.value[row][col] = currentPlayer.value;
      }
    }

    moveHistory.value.push({ row, col });
    lastMove.value = { row, col };

    updateManaByTotalMoves(moveHistory.value.length);
  };

  // 处理胜利条件
  const handleWinCondition = (row: number, col: number): boolean => {
    if (checkWin(board.value, row, col)) {
      // 检查是否已经在额外回合中
      if (isExtraTurn.value) {
        // 额外回合还能达成胜利，直接获胜
        winner.value = currentPlayer.value;
        isGameOver.value = true;
        isExtraTurn.value = false;
        potentialWinner.value = null;
        return true;
      } else if (isExtraTurnEnabled.value) {
        // 第一次达成胜利条件，且反制回合已启用，进入额外回合
        potentialWinner.value = currentPlayer.value;
        isExtraTurn.value = true;
        showAlert('对方已达成胜利条件');
      } else {
        // 反制回合未启用，直接获胜
        winner.value = currentPlayer.value;
        isGameOver.value = true;
        return true;
      }
    }
    return false;
  };

  // 处理额外回合
  const handleExtraTurn = (): boolean => {
    if (isExtraTurn.value && currentPlayer.value !== potentialWinner.value) {
      const isWinStillValid = checkWinStillValid(board.value, potentialWinner.value!);
      
      if (!isWinStillValid) {
        // 胜利条件被打破，取消胜利
        isExtraTurn.value = false;
        potentialWinner.value = null;
      } else {
        // 额外回合结束，潜在获胜者正式获胜
        winner.value = potentialWinner.value;
        isGameOver.value = true;
        isExtraTurn.value = false;
        potentialWinner.value = null;
        return true;
      }
    }
    return false;
  };

  // 处理棋盘满的情况
  const handleBoardFull = (): boolean => {
    if (isBoardFull(board.value)) {
      isGameOver.value = true;
      return true;
    }
    return false;
  };

  // 处理两极反转的连续下棋
  const handleReverseEffect = (): boolean => {
    if (
      reverseEffect.value.casterCanMove > 0 &&
      currentPlayer.value === reverseEffect.value.casterPlayer
    ) {
      reverseEffect.value.casterCanMove--;

      // 如果用完了连续下棋的机会，切换玩家并清除进度条
      if (reverseEffect.value.casterCanMove === 0) {
        reverseEffect.value.showProgressBar = false;
        reverseEffect.value.targetPlayer = null;
        reverseEffect.value.casterPlayer = null;

        currentPlayer.value = getOpponent(currentPlayer.value);

        if (skipNextTurn.value === currentPlayer.value) {
          skipNextTurn.value = null;
          currentPlayer.value = getOpponent(currentPlayer.value);
        }
      }
      // 否则不切换玩家，继续让同一玩家下棋

      // 专业模式的特殊阶段处理
      professionalMode.handleProfessionalPhase();

      return true;
    }
    return false;
  };

  // 处理调虎离山效果
  const handleDiversionEffect = (): boolean => {
    if (diversionTurnsLeft.value > 0) {
      diversionTurnsLeft.value--;
      if (professionalMode.mode.value === 'professional') {
        updateForbiddenMoves();
      }
      return true;
    }
    return false;
  };

  // 更新飞沙走石禁用计数
  const updateFlySandBan = () => {
    // 在切换玩家之前，减少当前玩家的禁用计数
    if (currentPlayer.value === 'black' && flySandBanned.value.black > 0) {
      flySandBanned.value.black--;
    }
    if (currentPlayer.value === 'white' && flySandBanned.value.white > 0) {
      flySandBanned.value.white--;
    }

    currentPlayer.value = getOpponent(currentPlayer.value);

    // 处理静如止水效果
    if (skipNextTurn.value === currentPlayer.value) {
      skipNextTurn.value = null;
      currentPlayer.value = getOpponent(currentPlayer.value);
    }

    // 当白方走完后（即将切换到黑方时），减少计数
    if (currentPlayer.value === 'black') {
      // 刚刚白方走完，现在轮到黑方，代表一个完整回合结束
      if (flySandBanned.value.black > 0) {
        flySandBanned.value.black--;
      }
      if (flySandBanned.value.white > 0) {
        flySandBanned.value.white--;
      }
    }

    // 所有状态更新完成后，只调用一次updateForbiddenMoves
    if (professionalMode.mode.value === 'professional') {
      updateForbiddenMoves();
    }
  };

  // 核心下棋函数
  const makeMove = (row: number, col: number): boolean => {
    // 1. 检查移动是否有效
    if (!isValidMove(row, col)) {
      return false;
    }

    // 2. 处理专业模式的五手打点阶段
    if (handleFiveOfferPhase(row, col)) {
      return true;
    }

    // 3. 处理专业模式的禁手
    if (!handleProfessionalForbiddenMove(row, col)) {
      return false;
    }

    // 4. 放置棋子
    handlePiecePlacement(row, col);

    // 5. 检查胜利条件
    if (handleWinCondition(row, col)) {
      return true;
    }

    // 6. 处理额外回合
    if (handleExtraTurn()) {
      return true;
    }

    // 7. 检查棋盘是否满
    if (handleBoardFull()) {
      return true;
    }

    // 8. 处理两极反转效果
    if (handleReverseEffect()) {
      return true;
    }

    // 9. 处理调虎离山效果
    if (handleDiversionEffect()) {
      return true;
    }

    // 10. 更新飞沙走石禁用计数并切换玩家
    updateFlySandBan();

    return true;
  };

  // 撤销功能
  const undo = () => {
    if (professionalMode.mode.value === 'professional') {
      return;
    }

    if (moveHistory.value.length === 0) return;

    const lastMovePos = moveHistory.value.pop()!;
    board.value[lastMovePos.row][lastMovePos.col] = null;

    if (isGameOver.value) {
      isGameOver.value = false;
      winner.value = null;
    } else {
      currentPlayer.value = getOpponent(currentPlayer.value);
    }

    updateForbiddenMoves();
  };

  // 重置游戏
  const restart = () => {
    board.value = initBoard();
    currentPlayer.value = 'black';
    winner.value = null;
    isGameOver.value = false;
    moveHistory.value = [];
    lastMove.value = null;
    isExtraTurn.value = false;
    potentialWinner.value = null;
    alertMessage.value = null;

    // 重置各个子系统
    resetMana();
    resetSkills();
    professionalMode.resetProfessionalMode();
  };

  // 游戏状态计算属性
  const gameState = computed<GameState>(() => ({
    board: board.value,
    currentPlayer: currentPlayer.value,
    winner: winner.value,
    isGameOver: isGameOver.value,
    moveHistory: moveHistory.value,
    mode: professionalMode.mode.value,
    professionalPhase: professionalMode.professionalPhase.value,
    fiveOffers: professionalMode.fiveOffers.value,
    forbiddenMoves: professionalMode.forbiddenMoves.value,
    blackMana: blackMana.value,
    whiteMana: whiteMana.value,
    isExtraTurn: isExtraTurn.value,
    potentialWinner: potentialWinner.value,
  }));

  return {
    // 基础游戏状态
    board,
    currentPlayer,
    winner,
    isGameOver,
    moveHistory,
    lastMove,
    gameState,
    alertMessage,

    // 额外回合反制机制
    isExtraTurn,
    potentialWinner,
    isExtraTurnEnabled,

    // 法力值系统
    blackMana,
    whiteMana,
    manaGrowthMode,
    toggleManaGrowthMode,

    // 专业模式
    ...professionalMode,

    // 技能系统
    skillState,
    skipNextTurn,
    counterWindowOpen,
    counterWindowPlayer,
    flySandBanned,
    diversionTurnsLeft,
    reverseEffect,
    lastRemovedPiece,

    // 游戏操作
    makeMove,
    undo,
    restart,

    // 技能操作
    useSkill,
    executeSkillEffect,
    cancelSkillSelection,
    closeCounterWindow,
    executeMightyPower,

    // 作弊功能
    addManaCheat
  };
}
