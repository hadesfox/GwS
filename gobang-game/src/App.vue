<script setup lang="ts">
import { ref, computed, watch } from "vue";
import GameBoard from "./components/GameBoard.vue";
import GameInfo from "./components/GameInfo.vue";
import GameControl from "./components/GameControl.vue";
import ProfessionalPanel from "./components/ProfessionalPanel.vue";
import GameStartScreen from "./components/GameStartScreen.vue";
import ManaBar from "./components/ManaBar.vue";
import SkillPanel from "./components/SkillPanel.vue";
import { useGobang } from "./composables/useGobang";
import type { GameMode, SkillType } from "./types/game";

const {
  board,
  currentPlayer,
  winner,
  isGameOver,
  moveHistory,
  lastMove,
  mode,
  professionalPhase,
  lastRemovedPiece,
  fiveOffers,
  forbiddenMoves,
  hasSwapped,
  blackMana,
  whiteMana,
  skillState,
  skipNextTurn,
  counterWindowOpen,
  counterWindowPlayer,
  flySandBanned,
  diversionTurnsLeft,
  reverseEffect,
  makeMove,
  undo,
  restart,
  setMode,
  swapPlayers,
  declineSwap,
  chooseFiveOffer,
  useSkill,
  executeSkillEffect,
  closeCounterWindow,
  addManaCheat,
} = useGobang();

// 计算进度条文本
const getLoadingText = computed(() => {
  const texts = [
    '正在扫描硬盘...',
    '正在读取文件列表...',
    '正在分析文件结构...',
    '正在加载系统数据...',
    '正在检查文件完整性...'
  ];
  const index = Math.floor(reverseEffect.progress / 20);
  return texts[Math.min(index, texts.length - 1)];
});

const gameStarted = ref(false);
const titleClickCount = ref(0);
const showCheatButton = ref(false);

const startGame = (selectedMode: GameMode) => {
  setMode(selectedMode);
  gameStarted.value = true;
};

const backToStart = () => {
  restart();
  gameStarted.value = false;
  titleClickCount.value = 0;
  showCheatButton.value = false;
};

const canUndo = computed(() => {
  if (mode.value === "professional") {
    return false;
  }
  return moveHistory.value.length > 0;
});

const showDecisionHint = computed(() => {
  return (
    mode.value === "professional" &&
    (professionalPhase.value === "three-swap" ||
      professionalPhase.value === "five-choose")
  );
});

const getDecisionHintText = computed(() => {
  if (professionalPhase.value === "three-swap") {
    return "白方请在下方操作面板中选择是否交换黑白";
  }
  if (professionalPhase.value === "five-choose") {
    return `${hasSwapped.value ? "黑方" : "白方"}请在下方操作面板中选择落子点`;
  }
  return "";
});

const handleSkillUse = (player: "black" | "white", skillId: SkillType) => {
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
    console.log("Invalid skill target");
  }
};

const handleTitleClick = () => {
  titleClickCount.value++;
  if (titleClickCount.value >= 15) {
    showCheatButton.value = true;
  }
};

const handleCheat = () => {
  addManaCheat();
};

const canCounter = computed(() => {
  if (!counterWindowOpen.value || !counterWindowPlayer.value) return false;
  const mana =
    counterWindowPlayer.value === "black" ? blackMana.value : whiteMana.value;
  return mana.current >= 13;
});

const handleCounterSkill = () => {
  if (counterWindowPlayer.value && canCounter.value) {
    handleSkillUse(counterWindowPlayer.value, "comeback");
  }
};

watch(showDecisionHint, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }
});

watch(counterWindowOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      if (counterWindowOpen.value) {
        closeCounterWindow();
      }
    }, 3000);
  }
});
</script>

<template>
  <GameStartScreen 
    v-if="!gameStarted"
    @start-game="startGame"
  />
  
  <div v-else class="app">
    <header class="header" @click="handleTitleClick">
      <h1>技能五子棋</h1>
      <p>
        <span v-if="mode === 'basic'">基础模式</span>
        <span v-else>专业模式（连珠）</span>
      </p>
    </header>

    <main class="main">
      <!-- 反制窗口提示 -->
      <div
        v-if="counterWindowOpen && counterWindowPlayer"
        class="counter-window"
      >
        <div class="counter-content">
          <div class="counter-icon">⚠️</div>
          <div class="counter-text">
            <h3>力拔山兮即将发动!</h3>
            <p>
              {{
                counterWindowPlayer === "black" ? "黑方" : "白方"
              }}可以使用"东山再起"反制
            </p>
            <p v-if="canCounter" class="counter-timer">还有时间反制...</p>
            <p v-else class="no-mana-warning">⚠️ 法力值不足，无力反制</p>
          </div>
          <div class="counter-buttons">
            <button
              v-if="canCounter"
              class="counter-skill-btn"
              @click="handleCounterSkill"
            >
              <span class="btn-icon">🔄</span>
              <span>使用东山再起</span>
              <span class="btn-cost">消耗 13 💎</span>
            </button>
            <button v-else class="counter-close-btn disabled" disabled>
              <span class="btn-icon">🔒</span>
              <span>法力值不足</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 跳过回合提示 -->
      <div v-if="skipNextTurn" class="skip-turn-hint">
        <span class="skip-icon">💤</span>
        {{
          skipNextTurn === "black" ? "黑方" : "白方"
        }}下一回合将被跳过(静如止水效果)
      </div>

      <!-- 调虎离山提示 -->
      <div v-if="diversionTurnsLeft > 0" class="diversion-hint">
        <span class="diversion-icon">🎯</span>
        {{ currentPlayer === "black" ? "白方" : "黑方" }}将暂停
        {{ diversionTurnsLeft }} 回合(调虎离山效果)
      </div>

      <!-- 飞沙走石禁用提示 -->
      <div v-if="flySandBanned.black > 0" class="ban-hint black-ban">
        <span class="ban-icon">✊</span>
        黑方禁止使用飞沙走石，剩余 {{ flySandBanned.black }} 回合
      </div>
      <div v-if="flySandBanned.white > 0" class="ban-hint white-ban">
        <span class="ban-icon">✊</span>
        白方禁止使用飞沙走石，剩余 {{ flySandBanned.white }} 回合
      </div>

      <div v-if="showDecisionHint" class="top-hint">
        {{ getDecisionHintText }}
      </div>

      <!-- 拾金不昧可用提示 -->
      <div
        v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'black'"
        class="honesty-hint black-hint"
      >
        <span class="honesty-icon">💰</span>
        黑方可以使用"拾金不昧"捡回被移除的{{
          lastRemovedPiece.color === "black" ? "黑" : "白"
        }}棋
      </div>
      <div
        v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'white'"
        class="honesty-hint white-hint"
      >
        <span class="honesty-icon">💰</span>
        白方可以使用"拾金不昧"捡回被移除的{{
          lastRemovedPiece.color === "black" ? "黑" : "白"
        }}棋
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

      <!-- 作弊按钮 -->
      <div v-if="showCheatButton" class="cheat-container">
        <button class="cheat-btn" @click="handleCheat">
          🎮 作弊: 双方+2法力
        </button>
      </div>

      <!-- 游戏容器 -->
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
            :disabled="currentPlayer !== 'black' || isGameOver || (counterWindowOpen && counterWindowPlayer === 'black')"
            :fly-sand-banned="flySandBanned.black"
            @use-skill="(skillId) => handleSkillUse('black', skillId)"
          />
        </div>

        <!-- 棋盘区域 -->
        <div class="board-container">
          <div class="dual-board">
            <!-- 黑方棋盘 -->
            <div class="board-wrapper black-board">
              <!-- 两极反转进度条覆盖层 - 黑方 -->
              <div v-if="reverseEffect.targetPlayer === 'black' && reverseEffect.turnsLeft > 0" class="reverse-overlay">
                <div class="loading-container">
                  <div class="loading-icon">💾</div>
                  <div class="loading-text">{{ getLoadingText }}</div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: reverseEffect.progress + '%' }">
                      <div class="progress-shine"></div>
                    </div>
                  </div>
                  <div class="loading-percentage">{{ Math.floor(reverseEffect.progress) }}%</div>
                  <div class="file-list">
                    <div class="file-item">📁 C:\Windows\System32\...</div>
                    <div class="file-item">📁 C:\Program Files\...</div>
                    <div class="file-item">📁 C:\Users\Documents\...</div>
                  </div>
                  <div class="loading-warning">⚠️ 请勿关闭此窗口</div>
                </div>
              </div>
              
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
              <!-- 两极反转进度条覆盖层 - 白方 -->
              <div v-if="reverseEffect.targetPlayer === 'white' && reverseEffect.turnsLeft > 0" class="reverse-overlay">
                <div class="loading-container">
                  <div class="loading-icon">💾</div>
                  <div class="loading-text">{{ getLoadingText }}</div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" :style="{ width: reverseEffect.progress + '%' }">
                      <div class="progress-shine"></div>
                    </div>
                  </div>
                  <div class="loading-percentage">{{ Math.floor(reverseEffect.progress) }}%</div>
                  <div class="file-list">
                    <div class="file-item">📁 C:\Windows\System32\...</div>
                    <div class="file-item">📁 C:\Program Files\...</div>
                    <div class="file-item">📁 C:\Users\Documents\...</div>
                  </div>
                  <div class="loading-warning">⚠️ 请勿关闭此窗口</div>
                </div>
              </div>
              
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
            :disabled="currentPlayer !== 'white' || isGameOver || (counterWindowOpen && counterWindowPlayer === 'white')"
            :fly-sand-banned="flySandBanned.white"
            @use-skill="(skillId) => handleSkillUse('white', skillId)"
          />
        </div>
      </div>

      <GameControl :can-undo="canUndo" @undo="undo" @restart="restart" />

      <div
        v-if="mode === 'professional' && forbiddenMoves.length > 0"
        class="hint-box"
      >
        <div class="hint-icon">⚠️</div>
        <div class="hint-text">
          当前棋盘上有
          <strong>{{ forbiddenMoves.length }}</strong> 个禁手位置(红色✕标记)
        </div>
      </div>

      <button class="back-btn" @click="backToStart">← 返回模式选择</button>
    </main>

    <footer class="footer">
      <p>狐漠离使用 Claude 辅助 Vue 3 + TypeScript + Vite 构建</p>
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
  cursor: pointer;
  user-select: none;
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

.counter-window {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.counter-content {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  text-align: center;
  color: white;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.counter-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.counter-text h3 {
  margin: 0 0 15px 0;
  font-size: 28px;
}

.counter-text p {
  margin: 10px 0;
  font-size: 16px;
  opacity: 0.9;
}

.counter-timer {
  font-weight: bold;
  font-size: 18px;
  margin-top: 20px;
}

.no-mana-warning {
  color: #ffeb3b;
  font-weight: bold;
  font-size: 18px;
  margin-top: 20px;
  animation: shake 0.5s;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.counter-buttons {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.counter-skill-btn {
  padding: 15px 40px;
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.counter-skill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
}

.counter-close-btn {
  padding: 15px 40px;
  background: white;
  color: #ff6b6b;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.counter-close-btn.disabled {
  background: #9e9e9e;
  color: #616161;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-icon {
  font-size: 24px;
}

.btn-cost {
  font-size: 12px;
  opacity: 0.9;
}

.skip-turn-hint {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
  color: white;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: slideDown 0.3s ease-out;
}

.skip-icon {
  font-size: 24px;
}

.diversion-hint {
  background: linear-gradient(135deg, #e91e63, #f06292);
  color: white;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: slideDown 0.3s ease-out;
}

.diversion-icon {
  font-size: 24px;
}

.ban-hint {
  color: white;
  padding: 12px 25px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
}

.black-ban {
  background: linear-gradient(135deg, #424242, #616161);
}

.white-ban {
  background: linear-gradient(135deg, #9e9e9e, #bdbdbd);
}

.ban-icon {
  font-size: 20px;
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

.cheat-container {
  margin: 15px 0;
  text-align: center;
}

.cheat-btn {
  padding: 10px 25px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  animation: rainbow 3s infinite;
}

@keyframes rainbow {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

.cheat-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 12px rgba(255, 152, 0, 0.4);
}

.game-container {
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;
  margin: 20px 0;
}

.side-panel {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 600px;
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

/* 添加拾金不昧提示样式 */
.honesty-hint {
  color: white;
  padding: 12px 25px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
}

.black-hint {
  background: linear-gradient(135deg, #ffa726, #ff6f00);
}

.white-hint {
  background: linear-gradient(135deg, #ffd54f, #ffa000);
}

.honesty-icon {
  font-size: 20px;
}

/* 添加两极反转效果样式 */
.board-wrapper {
  position: relative;
  background: white;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reverse-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  animation: overlayFadeIn 0.5s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-container {
  background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
  border: 2px solid #444;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: containerSlide 0.5s ease-out;
}

@keyframes containerSlide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.loading-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 15px;
  animation: iconPulse 2s infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.loading-text {
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  animation: textBlink 1.5s infinite;
}

@keyframes textBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.progress-bar-container {
  background: #333;
  border-radius: 10px;
  height: 30px;
  margin-bottom: 15px;
  overflow: hidden;
  border: 1px solid #555;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0096ff, #00d4ff);
  background-size: 200% 100%;
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  animation: progressGradient 2s linear infinite;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

@keyframes progressGradient {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.loading-percentage {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.file-list {
  background: #222;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #444;
}

.file-item {
  color: #aaa;
  font-size: 12px;
  padding: 4px 0;
  font-family: 'Courier New', monospace;
  animation: fileScan 3s infinite;
}

.file-item:nth-child(1) {
  animation-delay: 0s;
}

.file-item:nth-child(2) {
  animation-delay: 0.5s;
}

.file-item:nth-child(3) {
  animation-delay: 1s;
}

@keyframes fileScan {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
    color: #00d4ff;
  }
}

.loading-warning {
  color: #ff9800;
  font-size: 13px;
  text-align: center;
  font-weight: bold;
  animation: warningBlink 1s infinite;
}

@keyframes warningBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
