<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Player, Position, ProfessionalPhase } from '../types/game';
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
  hasSwapped?: boolean; // 新增
}

interface Emits {
  (e: 'makeMove', row: number, col: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isGameOver: false,
  lastMove: null,
  forbiddenMoves: () => [],
  fiveOffers: () => [],
  professionalPhase: 'normal',
  hasSwapped: false
});

const emit = defineEmits<Emits>();

const windowWidth = ref(window.innerWidth);

const cellSize = computed(() => {
  const containerSize = Math.min(windowWidth.value - 40, 600);
  return containerSize / BOARD_SIZE;
});

// 判断是否可以下棋
const canMove = computed(() => {
  if (props.isGameOver) return false;
  
  // **新增：五手两打选择阶段的锁定逻辑**
  if (props.professionalPhase === 'five-choose') {
    if (props.hasSwapped) {
      // 交换后：黑方选择，黑方棋盘锁定
      if (props.playerSide === 'black') return false;
    } else {
      // 未交换：白方选择，白方棋盘锁定
      if (props.playerSide === 'white') return false;
    }
  }
  
  // 第2手时黑方下白子
  if (props.moveCount === 1) {
    return props.playerSide === 'black';
  }
  
  return props.currentPlayer === props.playerSide;
});

const handleClick = (row: number, col: number) => {
  if (!canMove.value) return;
  emit('makeMove', row, col);
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
  <div class="game-board" :class="{ 'disabled': !canMove }">
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
            'not-my-turn': !canMove
          }"
          :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
          @click="handleClick(rowIndex, colIndex)"
        >
          <div v-if="!cell && isForbidden(rowIndex, colIndex)" class="forbidden-mark">
            ✕
          </div>
          
          <div v-if="isFiveOffer(rowIndex, colIndex)" class="offer-mark">
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
</template>

<style scoped>
.game-board {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.game-board.disabled {
  opacity: 0.6;
  pointer-events: none;
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
</style>