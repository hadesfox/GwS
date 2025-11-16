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
  manaGrowthMode?: 'default' | 'alternate';  // 新增
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
  totalMoves: 0,
  manaGrowthMode: 'default'  // 新增
});

const emit = defineEmits<Emits>();

const manaDotsArray = computed(() => {
  return Array.from({ length: 30 }, (_, i) => i < (props.mana?.current || 0));
});

const windowWidth = ref(window.innerWidth);
const hoverRow = ref<number | null>(null);

const cellSize = computed(() => {
  let containerSize;
  
  // 根据不同屏幕尺寸设置棋盘大小
  if (windowWidth.value > 1100) {
    // 大屏幕
    containerSize = Math.min(windowWidth.value - 40, 600);
  } else if (windowWidth.value > 768) {
    // 平板
    containerSize = Math.min(windowWidth.value - 60, 500);
  } else if (windowWidth.value > 480) {
    // 手机
    containerSize = Math.min(windowWidth.value - 40, 400);
  } else {
    // 小屏手机
    containerSize = Math.min(windowWidth.value - 30, 300);
  }
  
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
  
  if (props.manaGrowthMode === 'default') {
    // 标准模式：每4步
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
  } else {
    // 快速模式：每2步
    const remainder = (props.totalMoves - 1) % 2;
    
    if (props.playerSide === 'black') {
      // 黑方在余数为1时获得法力
      return remainder === 0 ? 1 : 0;
    } else {
      // 白方在余数为0时获得法力
      return remainder === 1 ? 1 : 0;
    }
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
        <div class="mana-header">
          <span class="mana-label">💎 法力值</span>
          <span class="mana-count">{{ mana.current }}/{{ mana.max }}</span>
        </div>
        <div class="mana-content">
          <div class="mana-hint-left">
            <span v-if="stepsToNextMana > 0">再走{{ stepsToNextMana }}步+1</span>
            <span v-else>&nbsp;</span>
          </div>
          <div class="mana-dots-container">
            <div 
              v-for="(isActive, index) in manaDotsArray" 
              :key="index"
              class="mana-dot"
              :class="{ 
                'active': isActive,
                'special': (index + 1) % 10 === 0
              }"
            >
            </div>
          </div>
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
@import '../styles/components/game-board.css';
</style>