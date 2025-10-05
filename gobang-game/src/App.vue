<script setup lang="ts">
import { computed } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import ModeSelector from './components/ModeSelector.vue';
import ProfessionalPanel from './components/ProfessionalPanel.vue';
import { useGobang } from './composables/useGobang';

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
  chooseFiveOffer,
  swapAfterFive
} = useGobang();

const canUndo = computed(() => {
  // 专业模式在特殊阶段不允许悔棋
  if (mode.value === 'professional' && professionalPhase.value !== 'normal') {
    return false;
  }
  return moveHistory.value.length > 0;
});

const canChangeMode = computed(() => {
  // 游戏未开始时才能切换模式
  return moveHistory.value.length === 0;
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎮 五子棋游戏</h1>
      <p>五子连珠，先手为胜</p>
    </header>

    <main class="main">
      <!-- 模式选择 -->
      <ModeSelector
        :current-mode="mode"
        :disabled="!canChangeMode"
        @change-mode="setMode"
      />

      <!-- 游戏信息 -->
      <GameInfo
        :current-player="currentPlayer"
        :winner="winner"
        :is-game-over="isGameOver"
        :move-count="moveHistory.length"
        :mode="mode"
        :professional-phase="professionalPhase"
      />

      <!-- 专业模式操作面板 -->
      <ProfessionalPanel
        v-if="mode === 'professional'"
        :phase="professionalPhase"
        :move-count="moveHistory.length"
        :five-offers="fiveOffers"
        @swap-players="swapPlayers"
        @decline-swap="declineSwap"
        @choose-five-offer="chooseFiveOffer"
        @swap-after-five="swapAfterFive"
      />

      <!-- 棋盘 -->
      <GameBoard
        :board="board"
        :is-game-over="isGameOver"
        :last-move="lastMove"
        :forbidden-moves="forbiddenMoves"
        :five-offers="fiveOffers"
        @make-move="makeMove"
      />

      <!-- 控制按钮 -->
      <GameControl
        :can-undo="canUndo"
        @undo="undo"
        @restart="restart"
      />

      <!-- 提示信息 -->
      <div v-if="mode === 'professional' && forbiddenMoves.length > 0" class="hint-box">
        <div class="hint-icon">⚠️</div>
        <div class="hint-text">
          当前棋盘上有 <strong>{{ forbiddenMoves.length }}</strong> 个禁手位置（红色✕标记）
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>使用 Vue 3 + TypeScript + Vite 构建</p>
      <p class="footer-note">
        <span v-if="mode === 'basic'">基础模式 - 标准五子棋规则</span>
        <span v-else>专业模式 - 采用国际连珠（Renju）规则</span>
      </p>
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
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.footer p {
  margin: 5px 0;
}

.footer-note {
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 28px;
  }
  
  .header p {
    font-size: 14px;
  }

  .hint-box {
    flex-direction: column;
    text-align: center;
  }
}
</style>