// src/composables/useGobang.ts (第1部分 - 状态定义和辅助函数)

import { ref, computed } from "vue";
import type {
  Player,
  Position,
  GameState,
  GameMode,
  ProfessionalPhase,
  Pattern,
  ManaState,
  SkillType,
  SkillState,
} from "../types/game";
import { BOARD_SIZE, WIN_COUNT, MAX_MANA, SKILLS } from "../types/game";

export function useGobang() {
  const initBoard = (): Player[][] => {
    return Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
  };

  const board = ref<Player[][]>(initBoard());
  const currentPlayer = ref<"black" | "white">("black");
  const winner = ref<Player>(null);
  const isGameOver = ref(false);
  const moveHistory = ref<Position[]>([]);
  const mode = ref<GameMode>("basic");
  const professionalPhase = ref<ProfessionalPhase>("normal");
  const fiveOffers = ref<Position[]>([]);
  const forbiddenMoves = ref<Position[]>([]);
  const hasSwapped = ref(false);

  // 法力值状态
  const blackMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0,
  });

  // 在状态变量部分添加
  const manaGrowthMode = ref<"default" | "alternate">("default"); // 'default' 是现有模式，'alternate' 是新模式

  const whiteMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0,
  });

  // 技能相关状态
  const skillState = ref<SkillState>({
    isSelecting: false,
    skillType: null,
    player: null,
    canCounter: false,
    counterTarget: undefined,
  });

  const skipNextTurn = ref<"black" | "white" | null>(null);
  const counterWindowOpen = ref(false);
  const counterWindowPlayer = ref<"black" | "white" | null>(null);

  // 新技能状态
  const flySandBanned = ref<{
    black: number;
    white: number;
  }>({
    black: 0,
    white: 0,
  });

  const diversionTurnsLeft = ref<number>(0);

  const lastMove = computed(() => {
    return moveHistory.value.length > 0
      ? moveHistory.value[moveHistory.value.length - 1]
      : null;
  });

  // 基于总步数更新法力值
  // 修改 updateManaByTotalMoves 函数
  const updateManaByTotalMoves = () => {
    const totalMoves = moveHistory.value.length;

    if (manaGrowthMode.value === "default") {
      // 现有模式：每4步为一轮，第3步黑方+1，第4步白方+1
      const remainder = totalMoves % 4;

      if (remainder === 3) {
        if (blackMana.value.current < blackMana.value.max) {
          blackMana.value.current++;
        }
      } else if (remainder === 0 && totalMoves > 0) {
        if (whiteMana.value.current < whiteMana.value.max) {
          whiteMana.value.current++;
        }
      }
    } else {
      // 新模式：(步数-1)/2，余数为1则黑方+1，余数为0则白方+1
      if (totalMoves > 0) {
        const divided = (totalMoves - 1) / 2;
        const remainder = (totalMoves - 1) % 2;

        if (remainder === 1) {
          // 黑方获得法力
          if (blackMana.value.current < blackMana.value.max) {
            blackMana.value.current++;
          }
        } else if (remainder === 0) {
          // 白方获得法力
          if (whiteMana.value.current < whiteMana.value.max) {
            whiteMana.value.current++;
          }
        }
      }
    }
  };

  // 添加切换模式的函数
  const toggleManaGrowthMode = () => {
    manaGrowthMode.value =
      manaGrowthMode.value === "default" ? "alternate" : "default";
    console.log(`Mana growth mode switched to: ${manaGrowthMode.value}`);
  };

  // 随机摆放棋子的辅助函数
  const randomlyPlacePieces = (
    pieces: Array<{ row: number; col: number; color: Player }>
  ) => {
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
        availablePositions[i],
      ];
    }

    pieces.forEach((piece, index) => {
      if (index < availablePositions.length) {
        const pos = availablePositions[index];
        board.value[pos.row][pos.col] = piece.color;
      }
    });
  };

  // 作弊函数
  const addManaCheat = () => {
    if (blackMana.value.current < blackMana.value.max) {
      blackMana.value.current = Math.min(
        blackMana.value.current + 2,
        blackMana.value.max
      );
    }
    if (whiteMana.value.current < whiteMana.value.max) {
      whiteMana.value.current = Math.min(
        whiteMana.value.current + 2,
        whiteMana.value.max
      );
    }
    console.log("Cheat activated: +2 mana for both players");
  };

  const checkPattern = (
    row: number,
    col: number,
    dx: number,
    dy: number,
    player: Player
  ): Pattern => {
    if (!player) return { count: 0, openEnds: 0, type: "dead" };

    let count = 1;
    let leftOpen = false;
    let rightOpen = false;

    let i = 1;
    while (true) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE
      )
        break;
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
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE
      )
        break;
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
    let type: "live" | "dead" | "half" = "dead";
    if (openEnds === 2) type = "live";
    else if (openEnds === 1) type = "half";

    return { count, openEnds, type };
  };

  const isForbiddenMove = (row: number, col: number): boolean => {
    if (mode.value !== "professional") return false;

    board.value[row][col] = "black";

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
      const pattern = checkPattern(row, col, dx, dy, "black");

      if (pattern.count >= 6) {
        longConnect = true;
        break;
      }

      if (pattern.count === 3 && pattern.type === "live") {
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
    if (mode.value !== "professional" || currentPlayer.value !== "black") {
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
      [1, -1],
    ];

    for (const [dx, dy] of directions) {
      let count = 1;

      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE ||
          board.value[newRow][newCol] !== player
        ) {
          break;
        }
        count++;
      }

      for (let i = 1; i < WIN_COUNT; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE ||
          board.value[newRow][newCol] !== player
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

  const lastRemovedPiece = ref<{
    row: number;
    col: number;
    color: Player;
    removedBy: "black" | "white";
  } | null>(null);

  // 使用技能
  const useSkill = (player: "black" | "white", skillId: SkillType): boolean => {
    const mana = player === "black" ? blackMana : whiteMana;
    const skill = SKILLS.find((s) => s.id === skillId);

    if (!skill) return false;

    if (mana.value.current < skill.manaCost) {
      return false;
    }

    // 检查飞沙走石是否被禁用
    if (skillId === "fly-sand") {
      const banCount =
        player === "black"
          ? flySandBanned.value.black
          : flySandBanned.value.white;
      if (banCount > 0) {
        console.log(
          `${player} cannot use fly-sand - banned for ${banCount} more turns`
        );
        return false;
      }
    }

    switch (skillId) {
      case "fly-sand":
        skillState.value = {
          isSelecting: true,
          skillType: "fly-sand",
          player: player,
        };
        return true;

      case "still-water": {
        const opponent = player === "black" ? "white" : "black";
        skipNextTurn.value = opponent;
        mana.value.current -= skill.manaCost;
        console.log(
          `${player} used Still Water - ${opponent} will skip next turn`
        );
        return true;
      }

      case "mighty-power": {
        const opponent = player === "black" ? "white" : "black";
        counterWindowOpen.value = true;
        counterWindowPlayer.value = opponent;

        skillState.value = {
          isSelecting: false,
          skillType: "mighty-power",
          player: player,
          canCounter: true,
          counterTarget: opponent,
        };

        console.log(
          `${player} is attempting Mighty Power - ${opponent} can counter!`
        );
        return true;
      }

      case "reverse": {
        const opponent = player === "black" ? "white" : "black";

        // 锁定施法者3秒
        reverseEffect.value = {
          targetPlayer: opponent,
          casterPlayer: player,
          casterLocked: true,
          casterCanMove: 0,
          showProgressBar: true,
        };

        mana.value.current -= skill.manaCost;

        // 3秒后解锁，允许连下两步
        setTimeout(() => {
          reverseEffect.value.casterLocked = false;
          reverseEffect.value.casterCanMove = 2;
          console.log(`${player} unlocked - can make 2 consecutive moves`);
        }, 3000);

        console.log(
          `${player} used Reverse - locked for 3 seconds, then can move twice`
        );
        return true;
      }

      case "comeback": {
        if (!counterWindowOpen.value || counterWindowPlayer.value !== player) {
          console.log("Cannot use Comeback - no counter window open");
          return false;
        }

        const attacker = skillState.value.player!;

        const currentPieces: Array<{
          row: number;
          col: number;
          color: Player;
        }> = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board.value[row][col] !== null) {
              currentPieces.push({
                row,
                col,
                color: board.value[row][col],
              });
            }
          }
        }

        board.value = Array(BOARD_SIZE)
          .fill(null)
          .map(() => Array(BOARD_SIZE).fill(null));
        randomlyPlacePieces(currentPieces);

        moveHistory.value = [];
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board.value[row][col] !== null) {
              moveHistory.value.push({ row, col });
            }
          }
        }

        mana.value.current -= skill.manaCost;
        const attackerMana = attacker === "black" ? blackMana : whiteMana;
        const mightyPowerSkill = SKILLS.find((s) => s.id === "mighty-power")!;
        attackerMana.value.current -= mightyPowerSkill.manaCost;

        counterWindowOpen.value = false;
        counterWindowPlayer.value = null;

        skillState.value = {
          isSelecting: false,
          skillType: null,
          player: null,
        };

        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        console.log(
          `${player} countered with Comeback - pieces randomly rearranged!`
        );
        return true;
      }

      case "capture": {
        const opponent = player === "black" ? "white" : "black";
        if (opponent === "black") {
          flySandBanned.value.black = 2;
        } else {
          flySandBanned.value.white = 2;
        }
        mana.value.current -= skill.manaCost;
        console.log(
          `${player} used Capture - ${opponent} cannot use fly-sand for 2 turns`
        );
        return true;
      }

      case "diversion": {
        diversionTurnsLeft.value = 3;
        mana.value.current -= skill.manaCost;
        console.log(`${player} used Diversion - opponent will skip 3 turns`);
        return true;
      }

      case "cleaner": {
        skillState.value = {
          isSelecting: true,
          skillType: "cleaner",
          player: player,
        };
        return true;
      }

      case "honesty": {
        // 检查是否有可以捡回的棋子
        if (
          !lastRemovedPiece.value ||
          lastRemovedPiece.value.removedBy === player
        ) {
          console.log("Cannot use Honesty - no piece removed by opponent");
          return false;
        }

        // 将棋子放回原位
        const piece = lastRemovedPiece.value;
        board.value[piece.row][piece.col] = piece.color;
        moveHistory.value.push({ row: piece.row, col: piece.col });

        mana.value.current -= skill.manaCost;

        // 清除已使用的记录
        lastRemovedPiece.value = null;

        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        console.log(`${player} used Honesty - retrieved the removed piece`);
        return true;
      }

      case "water-drop": {
        // 只有在静如止水生效时才能使用
        if (!skipNextTurn.value) {
          console.log("Cannot use Water Drop - Still Water is not active");
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
          console.log("Cannot use Water Drop - target player has no pieces");
          return false;
        }

        // 清空该棋子
        board.value[lastPiecePos.row][lastPiecePos.col] = null;
        const moveIndex = moveHistory.value.findIndex(
          (move) =>
            move.row === lastPiecePos!.row && move.col === lastPiecePos!.col
        );
        if (moveIndex !== -1) {
          moveHistory.value.splice(moveIndex, 1);
        }

        mana.value.current -= skill.manaCost;

        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        console.log(
          `${player} used Water Drop - removed ${targetPlayer}'s last piece`
        );
        return true;
      }

      case "see-you": {
        // 直接获胜
        mana.value.current -= skill.manaCost;
        winner.value = player;
        isGameOver.value = true;
        console.log(`${player} used See You Again and wins!`);
        return true;
      }

      default:
        console.log(`Skill ${skillId} not implemented yet`);
        return false;
    }
  };

  const executeMightyPower = () => {
    if (skillState.value.skillType !== "mighty-power") return;

    const player = skillState.value.player!;
    const skill = SKILLS.find((s) => s.id === "mighty-power")!;
    const mana = player === "black" ? blackMana : whiteMana;

    board.value = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
    moveHistory.value = [];

    mana.value.current -= skill.manaCost;

    winner.value = player;
    isGameOver.value = true;

    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null,
    };

    console.log(`${player} wins with Mighty Power!`);
  };

  const closeCounterWindow = () => {
    if (
      counterWindowOpen.value &&
      skillState.value.skillType === "mighty-power"
    ) {
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
    const mana = player === "black" ? blackMana : whiteMana;
    const skill = SKILLS.find((s) => s.id === skillType);

    if (!skill) return false;

    switch (skillType) {
      case "fly-sand": {
        if (board.value[row][col] === null) {
          return false;
        }

        // 记录被删除的棋子信息
        lastRemovedPiece.value = {
          row: row,
          col: col,
          color: board.value[row][col]!,
          removedBy: player,
        };

        board.value[row][col] = null;

        const moveIndex = moveHistory.value.findIndex(
          (move) => move.row === row && move.col === col
        );
        if (moveIndex !== -1) {
          moveHistory.value.splice(moveIndex, 1);
        }

        mana.value.current -= skill.manaCost;

        skillState.value = {
          isSelecting: false,
          skillType: null,
          player: null,
        };

        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        return true;
      }

      case "cleaner": {
        if (row < 0 || row >= BOARD_SIZE) {
          return false;
        }

        const startRow = Math.max(0, row - 1);
        const endRow = Math.min(BOARD_SIZE - 1, row + 1);

        for (let r = startRow; r <= endRow; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (board.value[r][c] !== null) {
              board.value[r][c] = null;

              const moveIndex = moveHistory.value.findIndex(
                (move) => move.row === r && move.col === c
              );
              if (moveIndex !== -1) {
                moveHistory.value.splice(moveIndex, 1);
              }
            }
          }
        }

        mana.value.current -= skill.manaCost;

        skillState.value = {
          isSelecting: false,
          skillType: null,
          player: null,
        };

        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        console.log(`Cleaned rows ${startRow} to ${endRow}`);
        return true;
      }

      default:
        return false;
    }
  };

  const cancelSkillSelection = () => {
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null,
    };
  };

  const makeMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    // 检查是否被两极反转锁定
    if (
      reverseEffect.value.casterLocked &&
      currentPlayer.value === reverseEffect.value.casterPlayer
    ) {
      console.log(`${currentPlayer.value} is locked by Reverse effect`);
      return false;
    }

    if (
      mode.value === "professional" &&
      professionalPhase.value === "five-offer"
    ) {
      if (fiveOffers.value.length < 2) {
        if (hasSwapped.value) {
          // 交换过,白方提供落点
        } else {
          if (isForbiddenMove(row, col)) {
            return false;
          }
        }

        fiveOffers.value.push({ row, col });

        if (fiveOffers.value.length === 2) {
          professionalPhase.value = "five-choose";
          currentPlayer.value = hasSwapped.value ? "black" : "white";
        }
        return true;
      }
      return false;
    }

    if (mode.value === "professional" && currentPlayer.value === "black") {
      if (isForbiddenMove(row, col)) {
        winner.value = "white";
        isGameOver.value = true;
        return false;
      }
    }

    if (mode.value === "basic") {
      board.value[row][col] = currentPlayer.value;
    } else {
      if (moveHistory.value.length === 1) {
        board.value[row][col] = "white";
      } else {
        board.value[row][col] = currentPlayer.value;
      }
    }

    moveHistory.value.push({ row, col });

    updateManaByTotalMoves();

    if (checkWin(row, col)) {
      winner.value = currentPlayer.value;
      isGameOver.value = true;
      return true;
    }

    if (moveHistory.value.length === BOARD_SIZE * BOARD_SIZE) {
      isGameOver.value = true;
      return true;
    }

    if (mode.value === "professional") {
      if (moveHistory.value.length === 2) {
        currentPlayer.value = "black";
        updateForbiddenMoves();
        return true;
      } else if (moveHistory.value.length === 3) {
        professionalPhase.value = "three-swap";
        currentPlayer.value = "white";
        updateForbiddenMoves();
        return true;
      } else if (
        moveHistory.value.length === 4 &&
        professionalPhase.value === "three-swap"
      ) {
        professionalPhase.value = "normal";
      } else if (
        moveHistory.value.length === 4 &&
        professionalPhase.value === "normal"
      ) {
        professionalPhase.value = "five-offer";
        currentPlayer.value = hasSwapped.value ? "white" : "black";
        fiveOffers.value = [];
        updateForbiddenMoves();
        return true;
      }
    }

    // 处理两极反转的连续下棋
    if (
      reverseEffect.value.casterCanMove > 0 &&
      currentPlayer.value === reverseEffect.value.casterPlayer
    ) {
      reverseEffect.value.casterCanMove--;
      console.log(
        `${currentPlayer.value} can make ${reverseEffect.value.casterCanMove} more consecutive moves`
      );

      // 如果用完了连续下棋的机会，切换玩家并清除进度条
      if (reverseEffect.value.casterCanMove === 0) {
        reverseEffect.value.showProgressBar = false;
        reverseEffect.value.targetPlayer = null;
        reverseEffect.value.casterPlayer = null;

        currentPlayer.value =
          currentPlayer.value === "black" ? "white" : "black";

        if (skipNextTurn.value === currentPlayer.value) {
          console.log(`${currentPlayer.value} skips turn due to Still Water`);
          skipNextTurn.value = null;
          currentPlayer.value =
            currentPlayer.value === "black" ? "white" : "black";
        }
      }
      // 否则不切换玩家，继续让同一玩家下棋

      // 专业模式的特殊阶段处理
      if (mode.value === "professional") {
        if (moveHistory.value.length === 2) {
          currentPlayer.value = "black";
          updateForbiddenMoves();
          return true;
        } else if (moveHistory.value.length === 3) {
          professionalPhase.value = "three-swap";
          currentPlayer.value = "white";
          updateForbiddenMoves();
          return true;
        } else if (
          moveHistory.value.length === 4 &&
          professionalPhase.value === "three-swap"
        ) {
          professionalPhase.value = "normal";
        } else if (
          moveHistory.value.length === 4 &&
          professionalPhase.value === "normal"
        ) {
          professionalPhase.value = "five-offer";
          currentPlayer.value = hasSwapped.value ? "white" : "black";
          fiveOffers.value = [];
          updateForbiddenMoves();
          return true;
        }
      }

      return true;
    }

    // 处理调呈离山效果
    if (diversionTurnsLeft.value > 0) {
      console.log(
        `Diversion active - ${currentPlayer.value} skips turn (${diversionTurnsLeft.value} turns left)`
      );
      diversionTurnsLeft.value--;
      if (mode.value === "professional") {
        updateForbiddenMoves();
      }
      return true;
    }

    // 在切换玩家之前，减少当前玩家的禁用计数
    if (currentPlayer.value === "black" && flySandBanned.value.black > 0) {
      flySandBanned.value.black--;
      console.log(
        `Black fly-sand ban decreased: ${flySandBanned.value.black} turns left`
      );
    }
    if (currentPlayer.value === "white" && flySandBanned.value.white > 0) {
      flySandBanned.value.white--;
      console.log(
        `White fly-sand ban decreased: ${flySandBanned.value.white} turns left`
      );
    }

    currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";

    // 处理静如止水效果
    if (skipNextTurn.value === currentPlayer.value) {
      console.log(`${currentPlayer.value} skips turn due to Still Water`);
      skipNextTurn.value = null;
      currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
    }

    if (mode.value === "professional") {
      updateForbiddenMoves();
    }
    // 修正：减少飞沙走石禁用计数 - 每个完整回合（黑白各走一次）减1
    // 当白方走完后（即将切换到黑方时），减少计数
    if (currentPlayer.value === "black") {
      // 刚刚白方走完，现在轮到黑方，代表一个完整回合结束
      if (flySandBanned.value.black > 0) {
        flySandBanned.value.black--;
        console.log(
          `Black fly-sand ban decreased: ${flySandBanned.value.black} turns left`
        );
      }
      if (flySandBanned.value.white > 0) {
        flySandBanned.value.white--;
        console.log(
          `White fly-sand ban decreased: ${flySandBanned.value.white} turns left`
        );
      }
    }

    if (mode.value === "professional") {
      updateForbiddenMoves();
    }

    return true;
  };

  const swapPlayers = () => {
    if (
      mode.value !== "professional" ||
      professionalPhase.value !== "three-swap"
    ) {
      return;
    }

    for (const pos of moveHistory.value) {
      const currentColor = board.value[pos.row][pos.col];
      board.value[pos.row][pos.col] =
        currentColor === "black" ? "white" : "black";
    }

    hasSwapped.value = true;
    currentPlayer.value = "black";
    professionalPhase.value = "normal";

    updateForbiddenMoves();
  };

  const declineSwap = () => {
    if (
      mode.value !== "professional" ||
      professionalPhase.value !== "three-swap"
    ) {
      return;
    }

    hasSwapped.value = false;
    currentPlayer.value = "white";
    professionalPhase.value = "normal";

    updateForbiddenMoves();
  };

  // src/composables/useGobang.ts (第3部分 - 剩余函数和返回值)
  // 接续第2部分

  const chooseFiveOffer = (offerIndex: number) => {
    if (
      mode.value !== "professional" ||
      professionalPhase.value !== "five-choose" ||
      offerIndex < 0 ||
      offerIndex >= fiveOffers.value.length
    ) {
      return;
    }

    const chosen = fiveOffers.value[offerIndex];
    const pieceColor = hasSwapped.value ? "white" : "black";
    board.value[chosen.row][chosen.col] = pieceColor;
    moveHistory.value.push(chosen);

    fiveOffers.value = [];

    currentPlayer.value = hasSwapped.value ? "black" : "white";
    professionalPhase.value = "normal";

    updateForbiddenMoves();
  };

  const undo = () => {
    if (mode.value === "professional") {
      return;
    }

    if (moveHistory.value.length === 0) return;

    const lastMovePos = moveHistory.value.pop()!;
    board.value[lastMovePos.row][lastMovePos.col] = null;

    if (isGameOver.value) {
      isGameOver.value = false;
      winner.value = null;
    } else {
      currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
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

// 根据法力值模式设置初始法力值
  if (manaGrowthMode.value === 'alternate') {
    // 快速模式：黑方开局1点法力
    blackMana.value = {
      current: 1,
      max: MAX_MANA,
      moveCounter: 0
    };
    whiteMana.value = {
      current: 0,
      max: MAX_MANA,
      moveCounter: 0
    };
  } else {
    // 标准模式：双方都是0
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
  }

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
  }));

  // 修改两极反转相关状态
  const reverseEffect = ref<{
    targetPlayer: "black" | "white" | null;
    casterPlayer: "black" | "white" | null;
    casterLocked: boolean;
    casterCanMove: number; // 可以连下的步数
    showProgressBar: boolean;
  }>({
    targetPlayer: null,
    casterPlayer: null,
    casterLocked: false,
    casterCanMove: 0,
    showProgressBar: false,
  });

  return {
    // ... 现有的返回值
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
    gameState,
    skillState,
    skipNextTurn,
    counterWindowOpen,
    counterWindowPlayer,
    flySandBanned, // 新增
    diversionTurnsLeft, // 新增
    lastRemovedPiece,
    reverseEffect,
    manaGrowthMode,
    toggleManaGrowthMode,
    makeMove,
    undo,
    restart,
    setMode,
    swapPlayers,
    declineSwap,
    chooseFiveOffer,
    useSkill,
    executeSkillEffect,
    cancelSkillSelection,
    closeCounterWindow,
    executeMightyPower,
    addManaCheat,
  };
}
