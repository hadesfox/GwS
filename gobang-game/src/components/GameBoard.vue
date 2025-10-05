<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Player } from '../types/game';
import { BOARD_SIZE } from '../types/game';

interface Props {
  board: Player[][];
  isGameOver: boolean;
  lastMove?: { row: number; col: number } | null;
}

interface Emits {
  (e: 'makeMove', row: number, col: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isGameOver: false,
  lastMove: null
});

const emit = defineEmits<Emits>();

const windowWidth = ref(window.innerWidth);

const cellSize = computed(() => {
  const containerSize = Math.min(windowWidth.value - 40, 600);
  return containerSize / BOARD_SIZE;
});

const handleClick = (row: number, col: number) => {
  if (props.isGameOver) return;
  emit('makeMove', row, col);
};

const isLastMove = (row: number, col: number) => {
  return props.lastMove?.row === row && props.lastMove?.col === col;
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
  <div class="game-board">
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
          :class="{ 'game-over': isGameOver }"
          :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
          @click="handleClick(rowIndex, colIndex)"
        >
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

.cell:not(.game-over):hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.cell.game-over {
  cursor: not-allowed;
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

.piece:not(.last-move):hover {
  transform: scale(1.05);
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