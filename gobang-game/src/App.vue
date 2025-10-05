<script setup lang="ts">
import { computed } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import { useGobang } from './composables/useGobang';

const {
  board,
  currentPlayer,
  winner,
  isGameOver,
  moveHistory,
  makeMove,
  undo,
  restart
} = useGobang();

const canUndo = computed(() => moveHistory.value.length > 0);
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎮 五子棋游戏</h1>
      <p>五子连珠，先手为胜</p>
    </header>

    <main class="main">
      <GameInfo
        :current-player="currentPlayer"
        :winner="winner"
        :is-game-over="isGameOver"
        :move-count="moveHistory.length"
      />

      <GameBoard
        :board="board"
        @make-move="makeMove"
      />

      <GameControl
        :can-undo="canUndo"
        @undo="undo"
        @restart="restart"
      />
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
}

.footer {
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}
</style>