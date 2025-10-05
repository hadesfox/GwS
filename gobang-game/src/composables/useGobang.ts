// src/composables/useGobang.ts

import { ref, computed } from 'vue';
import type { Player, Position, GameState, GameMode, ProfessionalPhase, Pattern, ManaState, SkillType, SkillState } from '../types/game';
import { BOARD_SIZE, WIN_COUNT, MAX_MANA, MOVES_PER_MANA, SKILLS } from '../types/game';

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
  const hasSwapped = ref(false);

  // 法力值状态
  const blackMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0
  });

  const whiteMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0
  });

  // 技能选择状态
  const skillState = ref<SkillState>({
    isSelecting: false,
    skillType: null,
    player: null
  });

  const lastMove = computed(() => {
    return moveHistory.value.length > 0 
      ? moveHistory.value[moveHistory.value.length - 1] 
      : null;
  });

  // 更新法力值
  const updateMana = (player: 'black' | 'white') => {
    const mana = player === 'black' ? blackMana : whiteMana;
    
    mana.value.moveCounter++;
    
    if (mana.value.moveCounter >= MOVES_PER_MANA) {
      mana.value.moveCounter = 0;
      if (mana.value.current < mana.value.max) {
        mana.value.current++;
      }
    }
  };

  // 使用技能
  const useSkill = (player: 'black' | 'white', skillId: SkillType): boolean => {
    const mana = player === 'black' ? blackMana : whiteMana;
    const skill = SKILLS.find(s => s.id === skillId);
    
    if (!skill) return false;
    
    // 检查法力值是否足够
    if (mana.value.current < skill.manaCost) {
      return false;
    }
    
    // 根据技能类型执行不同的效果
    switch (skillId) {
      case 'fly-sand':
        // 飞沙走石：进入选择模式，让玩家选择要移除的棋子
        skillState.value = {
          isSelecting: true,
          skillType: 'fly-sand',
          player: player
        };
        return true;
      
      default:
        console.log(`Skill ${skillId} not implemented yet`);
        return false;
    }
  };

  // 执行技能效果
  const executeSkillEffect = (row: number, col: number): boolean => {
    if (!skillState.value.isSelecting || !skillState.value.skillType) {
      return false;
    }
    
    const player = skillState.value.player!;
    const skillType = skillState.value.skillType;
    const mana = player === 'black' ? blackMana : whiteMana;
    const skill = SKILLS.find(s => s.id === skillType);
    
    if (!skill) return false;
    
    switch (skillType) {
      case 'fly-sand': {
        // 飞沙走石：移除指定位置的棋子
        if (board.value[row][col] === null) {
          // 该位置没有棋子，无效操作
          return false;
        }
        
        // 移除棋子
        board.value[row][col] = null;
        
        // 从移动历史中移除该位置（如果存在）
        const moveIndex = moveHistory.value.findIndex(
          move => move.row === row && move.col === col
        );
        if (moveIndex !== -1) {
          moveHistory.value.splice(moveIndex, 1);
        }
        
        // 消耗法力值
        mana.value.current -= skill.manaCost;
        
        // 重置技能状态
        skillState.value = {
          isSelecting: false,
          skillType: null,
          player: null
        };
        
        // 更新禁手位置（如果是专业模式）
        if (mode.value === 'professional') {
          updateForbiddenMoves();
        }
        
        return true;
      }
      
      default:
        return false;
    }
  };

  // 取消技能选择
  const cancelSkillSelection = () => {
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null
    };
  };

  const checkPattern = (row: number, col: number, dx: number, dy: number, player: Player): Pattern => {
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

  const isForbiddenMove = (row: number, col: number): boolean => {
    if (mode.value !== 'professional') return false;
    
    board.value[row][col] = 'black';

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
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

  const makeMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    // 专业模式：五手两打阶段
    if (mode.value === 'professional' && professionalPhase.value === 'five-offer') {
      if (fiveOffers.value.length < 2) {
        if (hasSwapped.value) {
          // 交换过，白方提供落点
        } else {
          // 未交换，黑方提供落点，检查禁手
          if (isForbiddenMove(row, col)) {
            return false;
          }
        }
        
        fiveOffers.value.push({ row, col });
        
        if (fiveOffers.value.length === 2) {
          professionalPhase.value = 'five-choose';
          currentPlayer.value = hasSwapped.value ? 'black' : 'white';
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

    // 基础模式和专业模式分开处理落子颜色
    if (mode.value === 'basic') {
      // 基础模式：直接按当前玩家颜色落子
      board.value[row][col] = currentPlayer.value;
    } else {
      // 专业模式：第2手特殊处理 - 黑方下白子
      if (moveHistory.value.length === 1) {
        board.value[row][col] = 'white';
      } else {
        board.value[row][col] = currentPlayer.value;
      }
    }
    
    moveHistory.value.push({ row, col });
    
    // 更新法力值
    updateMana(currentPlayer.value);

    if (checkWin(row, col)) {
      winner.value = currentPlayer.value;
      isGameOver.value = true;
      return true;
    }

    if (moveHistory.value.length === BOARD_SIZE * BOARD_SIZE) {
      isGameOver.value = true;
      return true;
    }

    // 专业模式特殊阶段判断
    if (mode.value === 'professional') {
      // 第2手后仍是黑方回合（准备下第3手黑子）
      if (moveHistory.value.length === 2) {
        currentPlayer.value = 'black';
        updateForbiddenMoves();
        return true;
      }
      // 第3手后进入三手交换
      else if (moveHistory.value.length === 3) {
        professionalPhase.value = 'three-swap';
        currentPlayer.value = 'white';
        updateForbiddenMoves();
        return true;
      }
      // 三手交换决定后
      else if (moveHistory.value.length === 4 && professionalPhase.value === 'three-swap') {
        professionalPhase.value = 'normal';
      }
      // 第4手后进入五手两打
      else if (moveHistory.value.length === 4 && professionalPhase.value === 'normal') {
        professionalPhase.value = 'five-offer';
        currentPlayer.value = hasSwapped.value ? 'white' : 'black';
        fiveOffers.value = [];
        updateForbiddenMoves();
        return true;
      }
    }

    // 基础模式和专业模式正常阶段：轮流切换玩家
    currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
    
    // 专业模式更新禁手
    if (mode.value === 'professional') {
      updateForbiddenMoves();
    }
    
    return true;
  };

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

  const declineSwap = () => {
    if (mode.value !== 'professional' || professionalPhase.value !== 'three-swap') {
      return;
    }

    hasSwapped.value = false;
    currentPlayer.value = 'white';
    professionalPhase.value = 'normal';
    
    updateForbiddenMoves();
  };

  const chooseFiveOffer = (offerIndex: number) => {
    if (mode.value !== 'professional' || 
        professionalPhase.value !== 'five-choose' ||
        offerIndex < 0 || offerIndex >= fiveOffers.value.length) {
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

  const undo = () => {
    if (mode.value === 'professional') {
      return;
    }

    if (moveHistory.value.length === 0) return;

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

  const setMode = (newMode: GameMode) => {
    mode.value = newMode;
    restart();
  };

  const restart = () => {
    board.value = initBoard();
    currentPlayer.value = 'black';
    winner.value = null;
    isGameOver.value = false;
    moveHistory.value = [];
    professionalPhase.value = 'normal';
    fiveOffers.value = [];
    forbiddenMoves.value = [];
    hasSwapped.value = false;

    // 重置法力值
    blackMana.value = {
      current: 0,
      max: MAX_MANA,
      moveCounter: 0
    };
    whiteMana.value = {
      current: 0,
      max: MAX_MANA,
      moveCounter: 0
    };

    // 重置技能状态
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null
    };

    // 专业模式开局：第1手中心黑子
    if (mode.value === 'professional') {
      const centerPos = Math.floor(BOARD_SIZE / 2);
      board.value[centerPos][centerPos] = 'black';
      moveHistory.value.push({ row: centerPos, col: centerPos });
      currentPlayer.value = 'black';
    }
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
    forbiddenMoves: forbiddenMoves.value,
    blackMana: blackMana.value,
    whiteMana: whiteMana.value,
    skillState: skillState.value
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
    hasSwapped,
    blackMana,
    whiteMana,
    skillState,
    gameState,
    makeMove,
    undo,
    restart,
    setMode,
    swapPlayers,
    declineSwap,
    chooseFiveOffer,
    useSkill,
    executeSkillEffect,
    cancelSkillSelection
  };
}