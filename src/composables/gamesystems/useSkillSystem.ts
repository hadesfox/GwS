import { ref } from 'vue';
import type { Player, Position, SkillType } from '../../types/game';
import { SKILLS } from '../../types/game';
import { BOARD_SIZE } from '../../types/game';

export type SkillState = {
  isSelecting: boolean;
  skillType: SkillType | null;
  player: Player | null;
  canCounter?: boolean;
  counterTarget?: Player;
};

export function useSkillSystem(
  board: any,
  moveHistory: any,
  currentPlayer: any,
  winner: any,
  isGameOver: any,
  isExtraTurn: any,
  potentialWinner: any,
  isExtraTurnEnabled: any,
  updateForbiddenMoves: () => void,
  consumeMana: (player: Player, amount: number) => boolean
) {
  // 技能状态
  const skillState = ref<SkillState>({
    isSelecting: false,
    skillType: null,
    player: null
  });

  // 反制窗口状态
  const counterWindowOpen = ref(false);
  const counterWindowPlayer = ref<Player | null>(null);

  // 静如止水效果
  const skipNextTurn = ref<Player | null>(null);

  // 飞沙走石禁用状态
  const flySandBanned = ref<{ [key in Player]: number }>({
    black: 0,
    white: 0
  });

  // 调虎离山效果
  const diversionTurnsLeft = ref(0);

  // 最后移除的棋子
  const lastRemovedPiece = ref<{
    row: number;
    col: number;
    color: Player;
    removedBy: Player;
  } | null>(null);

  // 两极反转效果
  const reverseEffect = ref<{
    targetPlayer: Player | null;
    casterPlayer: Player | null;
    casterLocked: boolean;
    casterCanMove: number; // 可以连下的步数
    showProgressBar: boolean;
  }>({
    targetPlayer: null,
    casterPlayer: null,
    casterLocked: false,
    casterCanMove: 0,
    showProgressBar: false
  });

  // 随机摆放棋子的辅助函数
  const randomlyPlacePieces = (pieces: Array<{ row: number; col: number; color: Player }>) => {
    const availablePositions: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board.value[row][col] === null) {
          availablePositions.push({ row, col });
        }
      }
    }

    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [
        availablePositions[j],
        availablePositions[i]
      ];
    }

    pieces.forEach((piece, index) => {
      if (index < availablePositions.length) {
        const pos = availablePositions[index];
        board.value[pos.row][pos.col] = piece.color;
      }
    });
  };

  // 取消技能选择
  const cancelSkillSelection = () => {
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null
    };
  };

  // 执行霸王回马技能
  const executeMightyPower = () => {
    if (skillState.value.skillType !== 'mighty-power') return;

    const player = skillState.value.player!;
    const skill = SKILLS.find((s) => s.id === 'mighty-power')!;

    // 清空棋盘
    board.value = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    moveHistory.value = [];

    // 消耗法力
    consumeMana(player, skill.manaCost);

    // 设置游戏结束
    winner.value = player;
    isGameOver.value = true;
    isExtraTurn.value = false;
    potentialWinner.value = null;

    // 重置技能状态
    cancelSkillSelection();
  };

  // 关闭反制窗口
  const closeCounterWindow = () => {
    if (counterWindowOpen.value && skillState.value.skillType === 'mighty-power') {
      executeMightyPower();
    }

    counterWindowOpen.value = false;
    counterWindowPlayer.value = null;
  };

  // 执行技能效果
  const executeSkillEffect = (row: number, col: number): boolean => {
    if (!skillState.value.isSelecting || !skillState.value.skillType) {
      return false;
    }

    const player = skillState.value.player!;
    const skillType = skillState.value.skillType;
    const skill = SKILLS.find((s) => s.id === skillType);

    if (!skill) return false;

    switch (skillType) {
      case 'fly-sand': {
        if (board.value[row][col] === null) {
          return false;
        }

        // 记录被删除的棋子信息
        lastRemovedPiece.value = {
          row: row,
          col: col,
          color: board.value[row][col]!,
          removedBy: player
        };

        // 移除棋子
        board.value[row][col] = null;

        // 从历史记录中移除
        const moveIndex = moveHistory.value.findIndex(
          (move: Position) => move.row === row && move.col === col
        );
        if (moveIndex !== -1) {
          moveHistory.value.splice(moveIndex, 1);
        }

        // 消耗法力
        consumeMana(player, skill.manaCost);

        // 重置技能状态
        cancelSkillSelection();

        // 更新禁手
        updateForbiddenMoves();

        return true;
      }

      case 'cleaner': {
        if (row < 0 || row >= BOARD_SIZE) {
          return false;
        }

        const startRow = Math.max(0, row - 1);
        const endRow = Math.min(BOARD_SIZE - 1, row + 1);

        // 清空指定行范围
        for (let r = startRow; r <= endRow; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (board.value[r][c] !== null) {
              board.value[r][c] = null;

              // 从历史记录中移除
              const moveIndex = moveHistory.value.findIndex(
                (move: Position) => move.row === r && move.col === c
              );
              if (moveIndex !== -1) {
                moveHistory.value.splice(moveIndex, 1);
              }
            }
          }
        }

        // 消耗法力
        consumeMana(player, skill.manaCost);

        // 重置技能状态
        cancelSkillSelection();

        // 更新禁手
        updateForbiddenMoves();
        return true;
      }

      default:
        return false;
    }
  };

  // 使用技能
  const useSkill = (player: Player, skillId: SkillType): boolean => {
    const skill = SKILLS.find((s) => s.id === skillId);

    if (!skill) return false;

    // 检查法力是否足够
    if (!consumeMana(player, skill.manaCost)) {
      return false;
    }

    // 检查飞沙走石是否被禁用
    if (skillId === 'fly-sand') {
      const banCount = flySandBanned.value[player];
      if (banCount > 0) {
        // 恢复消耗的法力
        const mana = player === 'black' ? 'blackMana' : 'whiteMana';
        // TODO: 需要获取法力值引用并恢复
        return false;
      }
    }

    switch (skillId) {
      case 'fly-sand':
        skillState.value = {
          isSelecting: true,
          skillType: 'fly-sand',
          player: player
        };
        return true;

      case 'still-water': {
        const opponent = player === 'black' ? 'white' : 'black';
        skipNextTurn.value = opponent;
        return true;
      }

      case 'mighty-power': {
        const opponent = player === 'black' ? 'white' : 'black';
        counterWindowOpen.value = true;
        counterWindowPlayer.value = opponent;

        skillState.value = {
          isSelecting: false,
          skillType: 'mighty-power',
          player: player,
          canCounter: true,
          counterTarget: opponent
        };
        return true;
      }

      case 'reverse': {
        const opponent = player === 'black' ? 'white' : 'black';

        // 锁定施法者3秒
        reverseEffect.value = {
          targetPlayer: opponent,
          casterPlayer: player,
          casterLocked: true,
          casterCanMove: 0,
          showProgressBar: true
        };

        // 3秒后解锁，允许连下两步
        setTimeout(() => {
          reverseEffect.value.casterLocked = false;
          reverseEffect.value.casterCanMove = 2;
        }, 3000);
        return true;
      }

      case 'comeback': {
        if (!counterWindowOpen.value || counterWindowPlayer.value !== player) {
          return false;
        }

        const attacker = skillState.value.player!;

        // 收集当前所有棋子
        const currentPieces: Array<{ row: number; col: number; color: Player }> = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board.value[row][col] !== null) {
              currentPieces.push({
                row, col, color: board.value[row][col] as Player
              });
            }
          }
        }

        // 清空棋盘并随机重新摆放
        board.value = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        randomlyPlacePieces(currentPieces);

        // 更新历史记录
        moveHistory.value = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board.value[row][col] !== null) {
              moveHistory.value.push({ row, col });
            }
          }
        }

        // 恢复攻击者的法力
        const mightyPowerSkill = SKILLS.find((s) => s.id === 'mighty-power')!;
        // TODO: 需要获取攻击者的法力值引用并恢复

        // 关闭反制窗口
        counterWindowOpen.value = false;
        counterWindowPlayer.value = null;

        // 重置技能状态
        cancelSkillSelection();

        // 更新禁手
        updateForbiddenMoves();
        return true;
      }

      case 'capture': {
        const opponent = player === 'black' ? 'white' : 'black';
        flySandBanned.value[opponent] = 2;
        return true;
      }

      case 'diversion': {
        diversionTurnsLeft.value = 3;
        return true;
      }

      case 'cleaner': {
        skillState.value = {
          isSelecting: true,
          skillType: 'cleaner',
          player: player
        };
        return true;
      }

      case 'honesty': {
        // 检查是否有可以捡回的棋子
        if (!lastRemovedPiece.value || lastRemovedPiece.value.removedBy === player) {
          // 恢复消耗的法力
          // TODO: 需要获取法力值引用并恢复
          return false;
        }

        const piece = lastRemovedPiece.value;
        let targetRow = piece.row;
        let targetCol = piece.col;
        
        // 检查原位置是否为空
        if (board.value[piece.row][piece.col] === null) {
          // 原位置为空，直接放回原位
        } else {
          // 原位置被占用，尝试在周围8个相邻位置寻找空位
          let foundEmpty = false;
          
          // 检查周围8个方向
          const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
          ];
          
          for (const [dr, dc] of directions) {
            const r = piece.row + dr;
            const c = piece.col + dc;
            
            // 检查位置是否在棋盘范围内且为空
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board.value[r][c] === null) {
              targetRow = r;
              targetCol = c;
              foundEmpty = true;
              break;
            }
          }
          
          if (!foundEmpty) {
            // 恢复消耗的法力
            // TODO: 需要获取法力值引用并恢复
            return false;
          }
        }

        // 将棋子放置在目标位置
        board.value[targetRow][targetCol] = piece.color;
        moveHistory.value.push({ row: targetRow, col: targetCol });

        // 清除已使用的记录
        lastRemovedPiece.value = null;

        // 更新禁手
        updateForbiddenMoves();
        return true;
      }

      case 'water-drop': {
        // 只有在静如止水生效时才能使用
        if (!skipNextTurn.value) {
          // 恢复消耗的法力
          // TODO: 需要获取法力值引用并恢复
          return false;
        }

        const targetPlayer = skipNextTurn.value;

        // 找到目标玩家的最后一步棋
        let lastPiecePos: Position | null = null;
        for (let i = moveHistory.value.length - 1; i >= 0; i--) {
          const pos = moveHistory.value[i];
          if (board.value[pos.row][pos.col] === targetPlayer) {
            lastPiecePos = pos;
            break;
          }
        }

        if (!lastPiecePos) {
          // 恢复消耗的法力
          // TODO: 需要获取法力值引用并恢复
          return false;
        }

        // 清空该棋子
        board.value[lastPiecePos.row][lastPiecePos.col] = null;
        const moveIndex = moveHistory.value.findIndex(
          (move: Position) => move.row === lastPiecePos!.row && move.col === lastPiecePos!.col
        );
        if (moveIndex !== -1) {
          moveHistory.value.splice(moveIndex, 1);
        }

        // 更新禁手
        updateForbiddenMoves();
        return true;
      }

      case 'see-you': {
        // 直接获胜（不受额外回合影响）
        winner.value = player;
        isGameOver.value = true;
        isExtraTurn.value = false;
        potentialWinner.value = null;
        return true;
      }

      default:
        return false;
    }
  };

  // 重置技能系统
  const resetSkills = () => {
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null
    };
    skipNextTurn.value = null;
    counterWindowOpen.value = false;
    counterWindowPlayer.value = null;
    
    flySandBanned.value = {
      black: 0,
      white: 0
    };
    diversionTurnsLeft.value = 0;
    
    reverseEffect.value = {
      targetPlayer: null,
      casterPlayer: null,
      casterLocked: false,
      casterCanMove: 0,
      showProgressBar: false
    };
    
    lastRemovedPiece.value = null;
  };

  return {
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
  };
}