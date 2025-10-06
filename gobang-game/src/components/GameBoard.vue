<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Player, Position, ProfessionalPhase, GameMode, SkillState, ManaState } from '../types/game';
import { BOARD_SIZE } from '../types/game';

interface Props {
  board: Player[][];
  isGameOver: boolean;
  lastMove?: Position | null;
  forbiddenMoves?: Position[];
  fiveOffers?: Position[];
  currentPlayer: 'black' | 'white';
  playerSide: 'black' | 'white';
  professionalPhase?: ProfessionalPhase;
  moveCount: number;
  hasSwapped?: boolean;
  mode: GameMode;
  skillState?: SkillState;
  mana?: ManaState;
  totalMoves?: number;
}

interface Emits {
  (e: 'makeMove', row: number, col: number): void;
  (e: 'executeSkill', row: number, col: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isGameOver: false,
  lastMove: null,
  forbiddenMoves: () => [],
  fiveOffers: () => [],
  professionalPhase: 'normal',
  hasSwapped: false,
  mode: 'basic',
  skillState: () => ({ isSelecting: false, skillType: null, player: null }),
  totalMoves: 0
});

const emit = defineEmits<Emits>();

const windowWidth = ref(window.innerWidth);
const hoverRow = ref<number | null>(null);

const cellSize = computed(() => {
  const containerSize = Math.min(windowWidth.value - 40, 600);
  return containerSize / BOARD_SIZE;
});

const canMove = computed(() => {
  if (props.isGameOver) return false;
  
  if (props.professionalPhase === 'three-swap') {
    return false;
  }
  
  if (props.professionalPhase === 'five-choose') {
    if (props.hasSwapped) {
      if (props.playerSide === 'black') return false;
    } else {
      if (props.playerSide === 'white') return false;
    }
  }
  
  if (props.mode === 'basic') {
    return props.currentPlayer === props.playerSide;
  }
  
  if (props.moveCount === 1) {
    return props.playerSide === 'black';
  }
  
  return props.currentPlayer === props.playerSide;
});

const handleClick = (row: number, col: number) => {
  if (props.skillState?.isSelecting && props.skillState.player === props.playerSide) {
    emit('executeSkill', row, col);
    return;
  }
  
  if (!canMove.value) return;
  emit('makeMove', row, col);
};

const handleMouseEnter = (row: number) => {
  if (props.skillState?.isSelecting && props.skillState.skillType === 'cleaner' && props.skillState.player === props.playerSide) {
    hoverRow.value = row;
  }
};

const handleMouseLeave = () => {
  hoverRow.value = null;
};

const isInCleanerRange = (row: number) => {
  if (!props.skillState?.isSelecting || props.skillState.skillType !== 'cleaner') return false;
  if (hoverRow.value === null) return false;
  
  const startRow = Math.max(0, hoverRow.value - 1);
  const endRow = Math.min(BOARD_SIZE - 1, hoverRow.value + 1);
  
  return row >= startRow && row <= endRow;
};

const isLastMove = (row: number, col: number) => {
  return props.lastMove?.row === row && props.lastMove?.col === col;
};

const isForbidden = (row: number, col: number) => {
  return props.forbiddenMoves?.some(pos => pos.row === row && pos.col === col) || false;
};

const isFiveOffer = (row: number, col: number) => {
  return props.fiveOffers?.some(pos => pos.row === row && pos.col === col) || false;
};

const isValidSkillTarget = (row: number, col: number) => {
  if (!props.skillState?.isSelecting) return false;
  if (props.skillState.skillType === 'fly-sand') {
    return props.board[row][col] !== null;
  }
  return false;
};

const stepsToNextMana = computed(() => {
  if (!props.mana || !props.totalMoves) return 0;
  const remainder = props.totalMoves % 4;
  
  if (props.playerSide === 'black') {
    if (remainder === 0) return 3;
    if (remainder === 1) return 2;
    if (remainder === 2) return 1;
    return 0;
  } else {
    if (remainder === 1) return 3;
    if (remainder === 2) return 2;
    if (remainder === 3) return 1;
    return 0;
  }
});

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});
</script>

<template>
  <div class="game-board" :class="{ 
    'disabled': !canMove,
    'skill-selecting': skillState?.isSelecting && skillState.player === playerSide
  }">
    <!-- 棋盘顶部：玩家标识 + 法力值 -->
    <div class="board-header">
      <div class="player-badge" :class="playerSide">
        <span class="player-icon">{{ playerSide === 'black' ? '⚫' : '⚪' }}</span>
        <span class="player-name">{{ playerSide === 'black' ? '黑方' : '白方' }}</span>
      </div>
      
      <div v-if="mana" class="mana-display">
        <div class="mana-info">
          <span class="mana-label">💎</span>
          <span class="mana-count">{{ mana.current }}/{{ mana.max }}</span>
        </div>
        <div class="mana-mini-bar">
          <div 
            class="mana-fill" 
            :style="{ width: (mana.current / mana.max * 100) + '%' }"
          ></div>
        </div>
        <div v-if="stepsToNextMana > 0" class="mana-hint">
          再走{{ stepsToNextMana }}步+1
        </div>
      </div>
    </div>

    <div class="board-wrapper">
      <!-- 顶部列号 -->
      <div class="coord-row top-coords" :style="{ marginLeft: `${cellSize + 8}px` }">
        <div 
          v-for="col in BOARD_SIZE" 
          :key="`col-${col}`"
          class="coord-label"
          :style="{ width: `${cellSize}px` }"
        >
          {{ col }}
        </div>
      </div>
      
      <div class="board-with-coords">
        <!-- 左侧行号 -->
        <div class="coord-col left-coords">
          <div 
            v-for="row in BOARD_SIZE" 
            :key="`row-${row}`"
            class="coord-label"
            :style="{ height: `${cellSize}px` }"
          >
            {{ row }}
          </div>
        </div>
        
        <!-- 棋盘 -->
        <div 
          class="board-grid"
          :style="{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`
          }"
        >
          <template v-for="(row, rowIndex) in board" :key="`row-${rowIndex}`">
            <div
              v-for="(cell, colIndex) in row"
              :key="`cell-${rowIndex}-${colIndex}`"
              class="cell"
              :class="{ 
                'game-over': isGameOver,
                'forbidden': !cell && isForbidden(rowIndex, colIndex),
                'five-offer': isFiveOffer(rowIndex, colIndex),
                'not-my-turn': !canMove,
                'skill-mode': skillState?.isSelecting,
                'cleaner-range': isInCleanerRange(rowIndex),
                'cleaner-center': hoverRow === rowIndex && skillState?.skillType === 'cleaner'
              }"
              :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
              @click="handleClick(rowIndex, colIndex)"
              @mouseenter="handleMouseEnter(rowIndex)"
              @mouseleave="handleMouseLeave"
            >
              <div v-if="mode === 'professional' && !cell && isForbidden(rowIndex, colIndex)" class="forbidden-mark">
                ✕
              </div>
              
              <div v-if="mode === 'professional' && isFiveOffer(rowIndex, colIndex)" class="offer-mark">
                {{ fiveOffers?.findIndex(pos => pos.row === rowIndex && pos.col === colIndex) + 1 }}
              </div>
              
              <div 
                v-if="cell" 
                class="piece"
                :class="[cell, { 'last-move': isLastMove(rowIndex, colIndex) }]"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
    
    <div v-if="skillState?.isSelecting && skillState.player === playerSide" class="skill-hint">
      <div class="skill-hint-content">
        <span class="skill-hint-icon">⚡</span>
        <span class="skill-hint-text">
          {{ 
            skillState.skillType === 'fly-sand' ? '点击一个棋子将其移除' : 
            skillState.skillType === 'cleaner' ? '悬停鼠标查看清空范围，点击确认' :
            '选择技能目标' 
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.game-board.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.player-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: bold;
}

.player-badge.black {
  background: linear-gradient(135deg, #333, #555);
  color: white;
}

.player-badge.white {
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  color: #333;
}

.player-icon {
  font-size: 20px;
}

.player-name {
  font-size: 14px;
}

.mana-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

.mana-info {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.mana-label {
  font-size: 14px;
}

.mana-count {
  color: #00d4ff;
  font-weight: bold;
  font-size: 13px;
}

.mana-mini-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mana-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0096ff);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.mana-hint {
  font-size: 10px;
  color: #aaa;
  text-align: right;
}

.board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.coord-row {
  display: flex;
  gap: 0;
}

.top-coords {
  margin-bottom: 4px;
}

.coord-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: #8b4513;
}

.board-with-coords {
  display: flex;
  gap: 4px;
}

.coord-col {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-right: 4px;
}

.board-grid {
  display: inline-grid;
  background-color: #daa520;
  border: 2px solid #8b4513;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.cell {
  border: 1px solid #8b4513;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.cell:not(.game-over):not(.forbidden):not(.not-my-turn):hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.cell.game-over,
.cell.not-my-turn {
  cursor: not-allowed;
}

.cell.forbidden {
  background-color: rgba(255, 0, 0, 0.1);
  cursor: not-allowed;
}

.cell.five-offer {
  background-color: rgba(0, 255, 0, 0.2);
}

.cell.skill-mode {
  cursor: crosshair;
}

.cleaner-range {
  border: 3px solid #ff0000 !important;
  box-sizing: border-box;
}

.cleaner-center {
  border: 4px solid #ff0000 !important;
  box-sizing: border-box;
}

.forbidden-mark {
  color: #d32f2f;
  font-size: 20px;
  font-weight: bold;
  pointer-events: none;
}

.offer-mark {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  pointer-events: none;
}

.piece {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
  position: relative;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.piece.last-move::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background-color: rgba(255, 0, 0, 0.6);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.skill-hint {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  font-weight: bold;
  white-space: nowrap;
  z-index: 10;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.skill-hint-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-hint-icon {
  font-size: 18px;
}

.skill-hint-text {
  font-size: 13px;
}
</style>