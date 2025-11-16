<script setup lang="ts">
import type { Player, GameMode, ProfessionalPhase } from '../types/game';

interface Props {
  currentPlayer: 'black' | 'white';
  winner: Player;
  isGameOver: boolean;
  moveCount: number;
  mode: GameMode;
  professionalPhase?: ProfessionalPhase;
  isExtraTurn?: boolean;
  potentialWinner?: Player;
}

const props = defineProps<Props>();

const getPhaseText = () => {
  if (props.mode !== 'professional') return '';
  
  switch (props.professionalPhase) {
    case 'three-swap':
      return '等待三手交换决定';
    case 'five-offer':
      return '黑方提供五手选点';
    case 'five-choose':
      return '白方选择并决定交换';
    default:
      return '正常对弈';
  }
};
</script>

<template>
  <div class="game-info">
    <!-- 模式标识 -->
    <div class="mode-badge">
      <span v-if="mode === 'basic'" class="badge basic">基础模式</span>
      <span v-else class="badge professional">专业模式 (连珠)</span>
    </div>

    <!-- 游戏状态 -->
    <div v-if="!isGameOver" class="current-state">
      <!-- 额外回合提示 -->
      <div v-if="isExtraTurn" class="extra-turn-notice">
        ⚡ <span class="notice-text">
          {{ potentialWinner === 'black' ? '黑棋' : '白棋' }}达成胜利条件！
          {{ currentPlayer === 'black' ? '黑棋' : '白棋' }}进入反制回合
        </span>
      </div>
      
      <div class="current-player">
        <span class="label">当前玩家：</span>
        <span class="player" :class="currentPlayer">
          {{ currentPlayer === 'black' ? '黑棋' : '白棋' }}
        </span>
      </div>
      
      <div v-if="mode === 'professional' && professionalPhase !== 'normal'" class="phase-info">
        {{ getPhaseText() }}
      </div>
    </div>
    
    <div v-else class="game-result">
      <div v-if="winner" class="winner">
        🎉 
        <span :class="winner">
          {{ winner === 'black' ? '黑棋' : '白棋' }}
        </span>
        获胜！
      </div>
      <div v-else class="draw">
        平局！
      </div>
    </div>

    <!-- 步数统计 -->
    <div class="stats">
      <div class="stat-item">
        <span class="stat-label">已走步数</span>
        <span class="stat-value">{{ moveCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/components/game-info.css';
</style>