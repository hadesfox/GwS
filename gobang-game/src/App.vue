<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import ProfessionalPanel from './components/ProfessionalPanel.vue';
import GameStartScreen from './components/GameStartScreen.vue';
import ManaBar from './components/ManaBar.vue';
import SkillPanel from './components/SkillPanel.vue';
import { useGobang } from './composables/useGobang';
import type { GameMode, SkillType } from './types/game';

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
  hasSwapped,
  blackMana,
  whiteMana,
  skillState,
  makeMove,
  undo,
  restart,
  setMode,
  swapPlayers,
  declineSwap,
  chooseFiveOffer,
  useSkill,
  executeSkillEffect
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
  if (mode.value === 'professional') {
    return false;
  }
  return moveHistory.value.length > 0;
});

const showDecisionHint = computed(() => {
  return mode.value === 'professional' && 
         (professionalPhase.value === 'three-swap' || professionalPhase.value === 'five-choose');
});

const getDecisionHintText = computed(() => {
  if (professionalPhase.value === 'three-swap') {
    return '白方请在下方操作面板中选择是否交换黑白';
  }
  if (professionalPhase.value === 'five-choose') {
    return `${hasSwapped.value ? '黑方' : '白方'}请在下方操作面板中选择落子点`;
  }
  return '';
});

const handleSkillUse = (player: 'black' | 'white', skillId: SkillType) => {
  const success = useSkill(player, skillId);
  if (success) {
    console.log(`${player} activated skill: ${skillId}`);
  } else {
    console.log(`${player} failed to use skill: ${skillId}`);
  }
};

const handleExecuteSkill = (row: number, col: number) => {
  const success = executeSkillEffect(row, col);
  if (!success) {
    console.log('Invalid skill target');
  }
};

// 当进入决策阶段时，滚动到页面顶部
watch(showDecisionHint, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
});
</script>

<template>
  <GameStartScreen 
    v-if="!gameStarted"
    @start-game="startGame"
  />
  
  <div v-else class="app">
    <header class="header">
      <h1>五子棋游戏</h1>
      <p>
        <span v-if="mode === 'basic'">基础模式</span>
        <span v-else>专业模式（连珠）</span>
      </p>
    </header>

    <main class="main">
      <div v-if="showDecisionHint" class="top-hint">
        {{ getDecisionHintText }}
      </div>

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
        :has-swapped="hasSwapped"
        @swap-players="swapPlayers"
        @decline-swap="declineSwap"
        @choose-five-offer="chooseFiveOffer"
      />

      <!-- 新布局：技能面板在两侧 -->
      <div class="game-container">
        <!-- 黑方技能区域 -->
        <div class="side-panel left-panel">
          <div class="player-label black-label">
            <span class="player-icon">⚫</span>
            <span>黑方</span>
          </div>
          <ManaBar 
            :mana="blackMana" 
            player-side="black"
            :total-moves="moveHistory.length"
          />
          <SkillPanel 
            :mana="blackMana" 
            player-side="black"
            :disabled="currentPlayer !== 'black' || isGameOver"
            @use-skill="(skillId) => handleSkillUse('black', skillId)"
          />
        </div>

        <!-- 棋盘区域 -->
        <div class="board-container">
          <div class="dual-board">
            <!-- 黑方棋盘 -->
            <div class="board-wrapper black-board">
              <GameBoard
                :board="board"
                :is-game-over="isGameOver"
                :last-move="lastMove"
                :forbidden-moves="forbiddenMoves"
                :five-offers="fiveOffers"
                :current-player="currentPlayer"
                :player-side="'black'"
                :professional-phase="professionalPhase"
                :move-count="moveHistory.length"
                :has-swapped="hasSwapped"
                :mode="mode"
                :skill-state="skillState"
                @make-move="makeMove"
                @execute-skill="handleExecuteSkill"
              />
            </div>

            <!-- 白方棋盘 -->
            <div class="board-wrapper white-board">
              <GameBoard
                :board="board"
                :is-game-over="isGameOver"
                :last-move="lastMove"
                :forbidden-moves="forbiddenMoves"
                :five-offers="fiveOffers"
                :current-player="currentPlayer"
                :player-side="'white'"
                :professional-phase="professionalPhase"
                :move-count="moveHistory.length"
                :has-swapped="hasSwapped"
                :mode="mode"
                :skill-state="skillState"
                @make-move="makeMove"
                @execute-skill="handleExecuteSkill"
              />
            </div>
          </div>
        </div>

        <!-- 白方技能区域 -->
        <div class="side-panel right-panel">
          <div class="player-label white-label">
            <span class="player-icon">⚪</span>
            <span>白方</span>
          </div>
          <ManaBar 
            :mana="whiteMana" 
            player-side="white"
            :total-moves="moveHistory.length"
          />
          <SkillPanel 
            :mana="whiteMana" 
            player-side="white"
            :disabled="currentPlayer !== 'white' || isGameOver"
            @use-skill="(skillId) => handleSkillUse('white', skillId)"
          />
        </div>
      </div>

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
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.top-hint {
  background: linear-gradient(135deg, #2196f3, #21cbf3);
  color: white;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  margin-bottom: 20px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.game-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
  margin: 20px 0;
}

.side-panel {
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.left-panel {
  align-items: flex-end;
}

.right-panel {
  align-items: flex-start;
}

.player-label {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.black-label {
  background: linear-gradient(135deg, #333, #555);
  color: white;
}

.white-label {
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  color: #333;
}

.player-icon {
  font-size: 28px;
}

.board-container {
  flex: 1;
  display: flex;
  justify-content: center;
}

.dual-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.board-wrapper {
  background: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.black-board {
  border: 3px solid #333;
}

.white-board {
  border: 3px solid #e0e0e0;
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

@media (max-width: 1400px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }
  
  .side-panel {
    width: 100%;
    max-width: 600px;
  }
  
  .left-panel,
  .right-panel {
    align-items: center;
  }
  
  .dual-board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 28px;
  }
  
  .dual-board {
    gap: 15px;
  }
}
</style>