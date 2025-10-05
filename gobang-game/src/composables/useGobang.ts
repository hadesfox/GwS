// src/composables/useGobang.ts

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

  const skipNextTurn = ref<"black" | "white" | null>(null); // 跳过下一回合的玩家
  const counterWindowOpen = ref(false); // 反制窗口是否开启
  const counterWindowPlayer = ref<"black" | "white" | null>(null); // 可以反制的玩家

  const lastMove = computed(() => {
    return moveHistory.value.length > 0
      ? moveHistory.value[moveHistory.value.length - 1]
      : null;
  });

  // 基于总步数更新法力值
  const updateManaByTotalMoves = () => {
    const totalMoves = moveHistory.value.length;
    const remainder = totalMoves % 4;

    // 余数为3时，黑方获得1法力（即第3、7、11、15...步后）
    if (remainder === 3) {
      if (blackMana.value.current < blackMana.value.max) {
        blackMana.value.current++;
      }
    }
    // 余数为0时，白方获得1法力（即第4、8、12、16...步后）
    else if (remainder === 0 && totalMoves > 0) {
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

    // 收集所有空位置
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board.value[row][col] === null) {
          availablePositions.push({ row, col });
        }
      }
    }

    // 随机打乱可用位置
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [
        availablePositions[j],
        availablePositions[i],
      ];
    }

    // 将棋子放到随机位置
    pieces.forEach((piece, index) => {
      if (index < availablePositions.length) {
        const pos = availablePositions[index];
        board.value[pos.row][pos.col] = piece.color;
      }
    });
  };

  // 使用技能
  const useSkill = (player: "black" | "white", skillId: SkillType): boolean => {
    const mana = player === "black" ? blackMana : whiteMana;
    const skill = SKILLS.find((s) => s.id === skillId);

    if (!skill) return false;

    // 检查法力值是否足够
    if (mana.value.current < skill.manaCost) {
      return false;
    }

    // 根据技能类型执行不同的效果
    switch (skillId) {
      case "fly-sand":
        skillState.value = {
          isSelecting: true,
          skillType: "fly-sand",
          player: player,
        };
        return true;

      case "still-water": {
        // 静如止水：对方跳过下一回合
        const opponent = player === "black" ? "white" : "black";
        skipNextTurn.value = opponent;

        // 消耗法力值
        mana.value.current -= skill.manaCost;

        console.log(
          `${player} used Still Water - ${opponent} will skip next turn`
        );
        return true;
      }

      case "mighty-power": {
        // 力拔山兮：开启反制窗口
        const opponent = player === "black" ? "white" : "black";
        counterWindowOpen.value = true;
        counterWindowPlayer.value = opponent;

        // 暂存技能信息，等待反制判断
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
        // 东山再起：只能在反制窗口内使用
        if (!counterWindowOpen.value || counterWindowPlayer.value !== player) {
          console.log("Cannot use Comeback - no counter window open");
          return false;
        }

        // 执行反制
        const attacker = skillState.value.player!;

        // 保存当前所有棋子的位置和颜色
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

        // 清空棋盘
        board.value = Array(BOARD_SIZE)
          .fill(null)
          .map(() => Array(BOARD_SIZE).fill(null));

        // 随机重新摆放棋子
        randomlyPlacePieces(currentPieces);

        // 清空移动历史（因为位置已改变）
        moveHistory.value = [];
        // 重新记录当前棋盘上的棋子（按新位置）
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board.value[row][col] !== null) {
              moveHistory.value.push({ row, col });
            }
          }
        }

        // 消耗双方法力值
        mana.value.current -= skill.manaCost; // 反制者消耗法力
        const attackerMana = attacker === "black" ? blackMana : whiteMana;
        const mightyPowerSkill = SKILLS.find((s) => s.id === "mighty-power")!;
        attackerMana.value.current -= mightyPowerSkill.manaCost; // 攻击者也消耗法力

        // 关闭反制窗口
        counterWindowOpen.value = false;
        counterWindowPlayer.value = null;

        // 重置技能状态
        skillState.value = {
          isSelecting: false,
          skillType: null,
          player: null,
        };

        // 更新禁手
        if (mode.value === "professional") {
          updateForbiddenMoves();
        }

        console.log(
          `${player} countered with Comeback - pieces randomly rearranged!`
        );
        return true;
      }

      default:
        console.log(`Skill ${skillId} not implemented yet`);
        return false;
    }
  };

  // 执行力拔山兮的函数（当反制窗口关闭且无反制时调用）
  const executeMightyPower = () => {
    if (skillState.value.skillType !== "mighty-power") return;

    const player = skillState.value.player!;
    const skill = SKILLS.find((s) => s.id === "mighty-power")!;
    const mana = player === "black" ? blackMana : whiteMana;

    // 清空棋盘
    board.value = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));
    moveHistory.value = [];

    // 消耗法力值
    mana.value.current -= skill.manaCost;

    // 设置胜利者
    winner.value = player;
    isGameOver.value = true;

    // 重置技能状态
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null,
    };

    console.log(`${player} wins with Mighty Power!`);
  };

  // 关闭反制窗口的函数
  const closeCounterWindow = () => {
    if (
      counterWindowOpen.value &&
      skillState.value.skillType === "mighty-power"
    ) {
      // 没有反制，执行力拔山兮
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

        // 消耗法力值
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

      default:
        return false;
    }
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

  const makeMove = (row: number, col: number): boolean => {
    if (isGameOver.value || board.value[row][col] !== null) {
      return false;
    }

    // 专业模式：五手两打阶段
    if (
      mode.value === "professional" &&
      professionalPhase.value === "five-offer"
    ) {
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
          professionalPhase.value = "five-choose";
          currentPlayer.value = hasSwapped.value ? "black" : "white";
        }
        return true;
      }
      return false;
    }

    // 专业模式：检查禁手
    if (mode.value === "professional" && currentPlayer.value === "black") {
      if (isForbiddenMove(row, col)) {
        winner.value = "white";
        isGameOver.value = true;
        return false;
      }
    }

    // 基础模式和专业模式分开处理落子颜色
    if (mode.value === "basic") {
      board.value[row][col] = currentPlayer.value;
    } else {
      // 专业模式：第2手特殊处理 - 黑方下白子
      if (moveHistory.value.length === 1) {
        board.value[row][col] = "white";
      } else {
        board.value[row][col] = currentPlayer.value;
      }
    }

    moveHistory.value.push({ row, col });

    // 更新法力值
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

    // 专业模式特殊阶段判断
    if (mode.value === "professional") {
      // 第2手后仍是黑方回合（准备下第3手黑子）
      if (moveHistory.value.length === 2) {
        currentPlayer.value = "black";
        updateForbiddenMoves();
        return true;
      }
      // 第3手后进入三手交换
      else if (moveHistory.value.length === 3) {
        professionalPhase.value = "three-swap";
        currentPlayer.value = "white";
        updateForbiddenMoves();
        return true;
      }
      // 三手交换决定后
      else if (
        moveHistory.value.length === 4 &&
        professionalPhase.value === "three-swap"
      ) {
        professionalPhase.value = "normal";
      }
      // 第4手后进入五手两打
      else if (
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

    // 基础模式和专业模式正常阶段：轮流切换玩家
    currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";

    // 检查下一个玩家是否需要跳过（静如止水效果）
    if (skipNextTurn.value === currentPlayer.value) {
      console.log(`${currentPlayer.value} skips turn due to Still Water`);
      skipNextTurn.value = null;
      currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
    }

    // 专业模式更新禁手
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

    // 重置法力值
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

    // 重置技能状态
    skillState.value = {
      isSelecting: false,
      skillType: null,
      player: null,
    };
    skipNextTurn.value = null;
    counterWindowOpen.value = false;
    counterWindowPlayer.value = null;

    // 专业模式开局：第1手中心黑子
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

  // 在 useGobang 函数中添加作弊函数
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
    makeMove,
    undo,
    restart,
    setMode,
    swapPlayers,
    declineSwap,
    chooseFiveOffer,
    useSkill,
    executeSkillEffect,
    closeCounterWindow,
    executeMightyPower,
    addManaCheat,
  };
}
