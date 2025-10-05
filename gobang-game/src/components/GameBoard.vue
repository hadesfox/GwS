<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '../types/game';
import { BOARD_SIZE } from '../types/game';

interface Props {
  board: Player[][];
}

interface Emits {
  (e: 'makeMove', row: number, col: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cellSize = computed(() => {
  const containerSize = Math.min(window.innerWidth - 40, 600);
  return containerSize / BOARD_SIZE;
});

const handleClick = (row: number, col: number) => {
  emit('makeMove', row, col);
};
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
      <div
        v-for="(row, rowIndex) in board"
        :key="`row-${rowIndex}`"
      >
        <div
          v-for="(cell, colIndex) in row"
          :key="`cell-${rowIndex}-${colIndex}`"
          class="cell"
          :style="{ width: `${cellSize}px`, height: `${cellSize}px` }"
          @click="handleClick(rowIndex, colIndex)"
        >
          <div 
            v-if="cell" 
            class="piece"
            :class="cell"
          />
        </div>
      </div>
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
}

.cell {
  border: 1px solid #8b4513;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
}

.cell:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.piece {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #4a4a4a, #000);
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
}

.piece:hover {
  transform: scale(1.05);
}
</style>