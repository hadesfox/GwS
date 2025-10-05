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
  const updateManaByTotalMoves = () => {
    const totalMoves = moveHistory.value.length;
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

  // src/composables/useGobang.ts (第2部分 - 技能系统和游戏逻辑)
  // 接续第1部分

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

    // 处理调虎离山效果
    if (diversionTurnsLeft.value > 0) {
      console.log(
        `Diversion active - skipping opponent turn (${diversionTurnsLeft.value} turns left)`
      );
      diversionTurnsLeft.value--;
      // 不切换玩家，让同一玩家继续
      if (mode.value === "professional") {
        updateForbiddenMoves();
      }
      return true;
    }

    currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";

    if (skipNextTurn.value === currentPlayer.value) {
      console.log(`${currentPlayer.value} skips turn due to Still Water`);
      skipNextTurn.value = null;
      currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
    }

    // 减少飞沙走石禁用计数
    if (flySandBanned.value.black > 0) {
      flySandBanned.value.black--;
    }
    if (flySandBanned.value.white > 0) {
      flySandBanned.value.white--;
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
    currentPlayer.value = "black";
    winner.value = null;
    isGameOver.value = false;
    moveHistory.value = [];
    professionalPhase.value = "normal";
    fiveOffers.value = [];
    forbiddenMoves.value = [];
    hasSwapped.value = false;

    blackMana.value = {
      current: 0,
      max: MAX_MANA,
      moveCounter: 0,
    };
    whiteMana.value = {
      current: 0,
      max: MAX_MANA,
      moveCounter: 0,
    };

    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null,
    };
    skipNextTurn.value = null;
    counterWindowOpen.value = false;
    counterWindowPlayer.value = null;

    flySandBanned.value = {
      black: 0,
      white: 0,
    };
    diversionTurnsLeft.value = 0;

    if (mode.value === "professional") {
      const centerPos = Math.floor(BOARD_SIZE / 2);
      board.value[centerPos][centerPos] = "black";
      moveHistory.value.push({ row: centerPos, col: centerPos });
      currentPlayer.value = "black";
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
    gameState,
    skillState,
    skipNextTurn,
    counterWindowOpen,
    counterWindowPlayer,
    flySandBanned,
    diversionTurnsLeft,
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
