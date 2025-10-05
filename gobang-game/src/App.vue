<script setup lang="ts">
import { ref, computed } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import ProfessionalPanel from './components/ProfessionalPanel.vue';
import GameStartScreen from './components/GameStartScreen.vue';
import { useGobang } from './composables/useGobang';
import type { GameMode } from './types/game';

const {
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
  makeMove,
  undo,
  restart,
  setMode,
  swapPlayers,
  declineSwap,
  chooseFiveOffer
} = useGobang();

const gameStarted = ref(false);

const startGame = (selectedMode: GameMode) => {
  setMode(selectedMode);
  gameStarted.value = true;
};

const backToStart = () => {
  restart();
  gameStarted.value = false;
};

const canUndo = computed(() => {
  if (mode.value === 'professional' && professionalPhase.value !== 'normal') {
    return false;
  }
  return moveHistory.value.length > 0;
});
</script>

<template>
  <!-- 游戏开始界面 -->
  <GameStartScreen 
    v-if="!gameStarted"
    @start-game="startGame"
  />
  
  <!-- 游戏主界面 -->
  <div v-else class="app">
    <header class="header">
      <h1>🎮 五子棋游戏</h1>
      <p>
        <span v-if="mode === 'basic'">基础模式</span>
        <span v-else>专业模式（连珠）</span>
      </p>
    </header>

    <main class="main">
      <GameInfo
        :current-player="currentPlayer"
        :winner="winner"
        :is-game-over="isGameOver"
        :move-count="moveHistory.length"
        :mode="mode"
        :professional-phase="professionalPhase"
      />

      <ProfessionalPanel
        v-if="mode === 'professional'"
        :phase="professionalPhase"
        :move-count="moveHistory.length"
        :five-offers="fiveOffers"
        @swap-players="swapPlayers"
        @decline-swap="declineSwap"
        @choose-five-offer="chooseFiveOffer"
      />

      <GameBoard
        :board="board"
        :is-game-over="isGameOver"
        :last-move="lastMove"
        :forbidden-moves="forbiddenMoves"
        :five-offers="fiveOffers"
        @make-move="makeMove"
      />

      <GameControl
        :can-undo="canUndo"
        @undo="undo"
        @restart="restart"
      />

      <div v-if="mode === 'professional' && forbiddenMoves.length > 0" class="hint-box">
        <div class="hint-icon">⚠️</div>
        <div class="hint-text">
          当前棋盘上有 <strong>{{ forbiddenMoves.length }}</strong> 个禁手位置（红色✕标记）
        </div>
      </div>

      <button class="back-btn" @click="backToStart">
        ← 返回模式选择
      </button>
    </main>

    <footer class="footer">
      <p>使用 Vue 3 + TypeScript + Vite 构建</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(to bottom, #e0eafc, #cfdef3);
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 36px;
  font-weight: bold;
}

.header p {
  margin: 10px 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.hint-box {
  background: linear-gradient(135deg, #fff3e0, #ffebee);
  border: 2px solid #ff9800;
  border-radius: 12px;
  padding: 15px 20px;
  margin: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.hint-icon {
  font-size: 24px;
}

.hint-text {
  color: #d84315;
  font-size: 14px;
  line-height: 1.5;
}

.hint-text strong {
  color: #c62828;
  font-size: 16px;
}

.back-btn {
  margin-top: 20px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #757575, #616161);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 28px;
  }
}
</style>