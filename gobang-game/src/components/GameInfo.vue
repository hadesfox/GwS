<script setup lang="ts">
import type { Player } from '../types/game';

interface Props {
  currentPlayer: 'black' | 'white';
  winner: Player;
  isGameOver: boolean;
  moveCount: number;
}

defineProps<Props>();
</script>

<template>
  <div class="game-info">
    <div v-if="!isGameOver" class="current-player">
      <span class="label">当前玩家：</span>
      <span class="player" :class="currentPlayer">
        {{ currentPlayer === 'black' ? '黑棋' : '白棋' }}
      </span>
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

    <div class="move-count">
      已走步数：{{ moveCount }}
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

.move-count {
  font-size: 16px;
  opacity: 0.9;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>