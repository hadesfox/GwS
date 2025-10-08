<script setup lang="ts">
import type { Player, GameMode, ProfessionalPhase } from '../types/game';

interface Props {
  currentPlayer: 'black' | 'white';
  winner: Player;
  isGameOver: boolean;
  moveCount: number;
  mode: GameMode;
  professionalPhase?: ProfessionalPhase;
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
.game-info {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  margin: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mode-badge {
  margin-bottom: 15px;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.basic {
  background: rgba(255, 255, 255, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.badge.professional {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  border: 2px solid #ffd700;
  animation: shine 2s infinite;
}

@keyframes shine {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

.current-state {
  margin-bottom: 10px;
}

.current-player {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.label {
  margin-right: 10px;
}

.player {
  padding: 5px 15px;
  border-radius: 20px;
  display: inline-block;
}

.player.black {
  background-color: #333;
  color: white;
}

.player.white {
  background-color: #fff;
  color: #333;
}

.phase-info {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  margin-top: 10px;
  display: inline-block;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.game-result {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  animation: bounce 0.5s ease;
}

.winner span {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  margin: 0 5px;
}

.winner .black {
  background-color: #333;
  color: white;
}

.winner .white {
  background-color: #fff;
  color: #333;
}

.draw {
  color: #ffd700;
}

.stats {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 16px;
}

.stat-label {
  opacity: 0.9;
}

.stat-value {
  font-weight: bold;
  font-size: 20px;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>