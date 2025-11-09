<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import ProfessionalPanel from './components/ProfessionalPanel.vue';
import GameStartScreen from './components/GameStartScreen.vue';
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
  mode,  // 确保这个被解构了
  professionalPhase,
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
  lastRemovedPiece,
  manaGrowthMode,  // 确保这个被解构了
  isExtraTurnEnabled,
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
  toggleManaGrowthMode  // 确保这个被解构了
} = useGobang();

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



// 计算是否可以切换法力值模式
const canChangeManaMode = computed(() => {
  console.log('canChangeManaMode check:', {
    mode: mode.value,
    moveHistoryLength: moveHistory.value.length,
    result: mode.value === 'professional' ? moveHistory.value.length <= 1 : moveHistory.value.length === 0
  });
  
  if (mode.value === 'professional') {
    return moveHistory.value.length <= 1;
  } else {
    return moveHistory.value.length === 0;
  }
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

const handleManaModeToggle = () => {
  if (canChangeManaMode.value) {
    toggleManaGrowthMode();
    // 切换模式后重新开始游戏，应用新的法力值设置
    restart();
  }
};

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
      <div v-if="counterWindowOpen && counterWindowPlayer" class="counter-window">
        <div class="counter-content">
          <div class="counter-icon">⚠️</div>
          <div class="counter-text">
            <h3>力拔山兮即将发动!</h3>
            <p>{{ counterWindowPlayer === 'black' ? '黑方' : '白方' }}可以使用"东山再起"反制</p>
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
            <button 
              v-else
              class="counter-close-btn disabled" 
              disabled
            >
              <span class="btn-icon">🔒</span>
              <span>法力值不足</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 跳过回合提示 -->
      <div v-if="skipNextTurn" class="skip-turn-hint">
        <span class="skip-icon">💤</span>
        {{ skipNextTurn === 'black' ? '黑方' : '白方' }}下一回合将被跳过（静如止水效果）
      </div>

      <!-- 调呈离山提示 -->
      <div v-if="diversionTurnsLeft > 0" class="diversion-hint">
        <span class="diversion-icon">🎯</span>
        {{ currentPlayer === 'black' ? '白方' : '黑方' }}将暂停 {{ diversionTurnsLeft }} 回合（调呈离山效果）
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

      <!-- 拾金不昧可用提示 -->
      <div v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'black'" class="honesty-hint black-hint">
        <span class="honesty-icon">💰</span>
        黑方可以使用"拾金不昧"捡回被移除的{{ lastRemovedPiece.color === 'black' ? '黑' : '白' }}棋
      </div>
      <div v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'white'" class="honesty-hint white-hint">
        <span class="honesty-icon">💰</span>
        白方可以使用"拾金不昧"捡回被移除的{{ lastRemovedPiece.color === 'black' ? '黑' : '白' }}棋
      </div>

      <div v-if="showDecisionHint" class="top-hint">
        {{ getDecisionHintText }}
      </div>

      <!-- 法力值增长模式切换按钮 - 左下角 -->
      <button 
        class="mana-mode-toggle" 
        :class="{ 'disabled': !canChangeManaMode }"
        :disabled="!canChangeManaMode"
        @click="handleManaModeToggle"
        :title="canChangeManaMode ? '点击切换法力值增长模式' : '已有玩家落子，无法切换'"
      >
        <div class="toggle-icon">{{ manaGrowthMode === 'default' ? '🔄' : '⚡' }}</div>
        <div class="toggle-text">
          <div class="toggle-title">法力模式</div>
          <div class="toggle-mode">{{ manaGrowthMode === 'default' ? '标准(4步)' : '快速(2步)' }}</div>
        </div>
        <div v-if="!canChangeManaMode" class="toggle-lock">🔒</div>
      </button>


      <GameInfo
        :current-player="currentPlayer"
        :winner="winner"
        :is-game-over="isGameOver"
        :move-count="moveHistory.length"
        :mode="mode"
        :professional-phase="professionalPhase"
        :is-extra-turn="isExtraTurn"
        :potential-winner="potentialWinner"
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
        <!-- 黑方技能区域 - 移除ManaBar -->
        <div class="player-section">
          <SkillPanel 
            :mana="blackMana" 
            player-side="black"
            :disabled="currentPlayer !== 'black' || isGameOver || (counterWindowOpen && counterWindowPlayer === 'black') || (reverseEffect.casterLocked && reverseEffect.casterPlayer === 'black')"
            :fly-sand-banned="flySandBanned.black"
            @use-skill="(skillId) => handleSkillUse('black', skillId)"
          />
        </div>

        <!-- 棋盘区域 - 传递法力值 -->
        <div class="board-container">
          <div class="dual-board">
            <!-- 黑方棋盘 -->
            <div class="board-wrapper black-board">
              <!-- 覆盖层... -->
              <div v-if="reverseEffect.casterLocked && reverseEffect.casterPlayer === 'black'" class="locked-overlay">
                <div class="locked-container">
                  <div class="locked-icon">🔒</div>
                  <div class="locked-text">棋盘锁定中...</div>
                  <div class="locked-hint">3秒后解锁并可连下2步</div>
                </div>
              </div>

              <div v-if="reverseEffect.showProgressBar && reverseEffect.targetPlayer === 'black'" class="reverse-overlay">
                <div class="loading-container">
                  <div class="loading-icon">💾</div>
                  <div class="loading-text">正在扫描硬盘...</div>
                  <div class="progress-bar-container">
                    <div class="progress-bar">
                      <div class="progress-shine"></div>
                    </div>
                  </div>
                  <div class="loading-percentage">加载中...</div>
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
    :mana="blackMana"
    :total-moves="moveHistory.length"
    :mana-growth-mode="manaGrowthMode"
    @make-move="makeMove"
    @execute-skill="handleExecuteSkill"
  />
            </div>

            <!-- 白方棋盘 -->
            <div class="board-wrapper white-board">
              <!-- 覆盖层... -->
              <div v-if="reverseEffect.casterLocked && reverseEffect.casterPlayer === 'white'" class="locked-overlay">
                <div class="locked-container">
                  <div class="locked-icon">🔒</div>
                  <div class="locked-text">棋盘锁定中...</div>
                  <div class="locked-hint">3秒后解锁并可连下2步</div>
                </div>
              </div>

              <div v-if="reverseEffect.showProgressBar && reverseEffect.targetPlayer === 'white'" class="reverse-overlay">
                <div class="loading-container">
                  <div class="loading-icon">💾</div>
                  <div class="loading-text">正在扫描硬盘...</div>
                  <div class="progress-bar-container">
                    <div class="progress-bar">
                      <div class="progress-shine"></div>
                    </div>
                  </div>
                  <div class="loading-percentage">加载中...</div>
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
    :mana="whiteMana"
    :total-moves="moveHistory.length"
    :mana-growth-mode="manaGrowthMode"
    @make-move="makeMove"
    @execute-skill="handleExecuteSkill"
  />
            </div>
          </div>
        </div>

        <!-- 白方技能区域 - 移除ManaBar -->
        <div class="player-section">
          <SkillPanel 
            :mana="whiteMana" 
            player-side="white"
            :disabled="currentPlayer !== 'white' || isGameOver || (counterWindowOpen && counterWindowPlayer === 'white') || (reverseEffect.casterLocked && reverseEffect.casterPlayer === 'white')"
            :fly-sand-banned="flySandBanned.white"
            @use-skill="(skillId) => handleSkillUse('white', skillId)"
          />
        </div>
      </div>

      <GameControl
        :can-undo="canUndo"
        :is-extra-turn-enabled="isExtraTurnEnabled"
        @undo="undo"
        @restart="restart"
        @toggle-extra-turn="isExtraTurnEnabled = !isExtraTurnEnabled"
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
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  user-select: none;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
}

.header p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  max-width: 1800px;
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
  from { opacity: 0; }
  to { opacity: 1; }
}

.counter-content {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  max-width: 450px;
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
  font-size: 48px;
  margin-bottom: 15px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.counter-text h3 {
  margin: 0 0 10px 0;
  font-size: 22px;
}

.counter-text p {
  margin: 8px 0;
  font-size: 14px;
  opacity: 0.9;
}

.counter-timer {
  font-weight: bold;
  font-size: 16px;
  margin-top: 15px;
}

.no-mana-warning {
  color: #ffeb3b;
  font-weight: bold;
  font-size: 16px;
  margin-top: 15px;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.counter-buttons {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.counter-skill-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.counter-skill-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
}

.counter-close-btn {
  padding: 12px 30px;
  background: white;
  color: #ff6b6b;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.counter-close-btn.disabled {
  background: #9e9e9e;
  color: #616161;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-icon {
  font-size: 20px;
}

.btn-cost {
  font-size: 11px;
  opacity: 0.9;
}

.skip-turn-hint, .diversion-hint, .ban-hint, .honesty-hint {
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
}

.skip-turn-hint {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
}

.diversion-hint {
  background: linear-gradient(135deg, #e91e63, #f06292);
}

.black-ban {
  background: linear-gradient(135deg, #424242, #616161);
}

.white-ban {
  background: linear-gradient(135deg, #9e9e9e, #bdbdbd);
}

.black-hint {
  background: linear-gradient(135deg, #ffa726, #ff6f00);
}

.white-hint {
  background: linear-gradient(135deg, #ffd54f, #ffa000);
}

.skip-icon, .diversion-icon, .ban-icon, .honesty-icon {
  font-size: 18px;
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

.top-hint {
  background: linear-gradient(135deg, #2196f3, #21cbf3);
  color: white;
  padding: 12px 25px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
  margin-bottom: 15px;
  animation: slideDown 0.3s ease-out;
}

.cheat-container {
  margin: 10px 0;
  text-align: center;
}

.cheat-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  animation: rainbow 3s infinite;
}

@keyframes rainbow {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

.cheat-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 12px rgba(255, 152, 0, 0.4);
}

/* 优化后的游戏容器布局 */
.game-container {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  width: 100%;
  max-width: 1600px;
  margin: 15px 0;
  justify-content: center;
}

.player-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 220px;
  flex-shrink: 0;
}

.board-container {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
}

.dual-board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.board-wrapper {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.black-board {
  border: 3px solid #333;
}

.white-board {
  border: 3px solid #e0e0e0;
}

/* 锁定覆盖层样式 */
.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.locked-container {
  background: linear-gradient(135deg, #424242, #616161);
  border: 2px solid #888;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  animation: containerPulse 1.5s ease-in-out infinite;
}

@keyframes containerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.locked-icon {
  font-size: 48px;
  margin-bottom: 10px;
  animation: iconShake 0.5s infinite;
}

@keyframes iconShake {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

.locked-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.locked-hint {
  color: #ffd700;
  font-size: 14px;
  animation: textBlink 1s infinite;
}

@keyframes textBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 进度条覆盖层样式 */
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
  border-radius: 12px;
  animation: overlayFadeIn 0.5s ease-out;
}

.loading-container {
  background: linear-gradient(135deg, #1e1e1e, #2d2d2d);
  border: 2px solid #444;
  border-radius: 12px;
  padding: 25px;
  max-width: 350px;
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
  font-size: 42px;
  text-align: center;
  margin-bottom: 12px;
  animation: iconPulse 2s infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.loading-text {
  color: #00d4ff;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  animation: textBlink 1.5s infinite;
}

.progress-bar-container {
  background: #333;
  border-radius: 8px;
  height: 25px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid #555;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-bar {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #00d4ff, #0096ff, #00d4ff);
  background-size: 200% 100%;
  border-radius: 8px;
  position: relative;
  animation: progressGradient 2s linear infinite;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

@keyframes progressGradient {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
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
  0% { left: -100%; }
  100% { left: 100%; }
}

.loading-percentage {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
}

.file-list {
  background: #222;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid #444;
}

.file-item {
  color: #aaa;
  font-size: 11px;
  padding: 3px 0;
  font-family: 'Courier New', monospace;
  animation: fileScan 3s infinite;
}

.file-item:nth-child(1) { animation-delay: 0s; }
.file-item:nth-child(2) { animation-delay: 0.5s; }
.file-item:nth-child(3) { animation-delay: 1s; }

@keyframes fileScan {
  0%, 100% { opacity: 0.5; }
  50% {
    opacity: 1;
    color: #00d4ff;
  }
}

.loading-warning {
  color: #ff9800;
  font-size: 12px;
  text-align: center;
  font-weight: bold;
  animation: warningBlink 1s infinite;
}

@keyframes warningBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hint-box {
  background: linear-gradient(135deg, #fff3e0, #ffebee);
  border: 2px solid #ff9800;
  border-radius: 10px;
  padding: 12px 18px;
  margin: 12px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.hint-icon {
  font-size: 20px;
}

.hint-text {
  color: #d84315;
  font-size: 13px;
  line-height: 1.5;
}

.hint-text strong {
  color: #c62828;
  font-size: 14px;
}

.back-btn {
  margin-top: 15px;
  padding: 10px 25px;
  background: linear-gradient(135deg, #757575, #616161);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 8px rgba(0, 0, 0, 0.15);
}

.footer {
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* 原来是 1500px，这里改为 1100px 或 1024px 更合适 */
@media (max-width: 1100px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .player-section {
    width: 100%;
    max-width: 600px;
    flex-direction: row;
    justify-content: space-between;
  }

  .dual-board {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 22px;
  }
  
  .dual-board {
    gap: 10px;
  }
  
  .player-section {
    flex-direction: column;
  }
}

/* 添加法力值模式切换按钮样式 */
.mana-mode-toggle {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  position: relative;
}

.mana-mode-toggle:not(.disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  border-color: rgba(255, 255, 255, 0.5);
}

.mana-mode-toggle:not(.disabled):active {
  transform: translateY(-1px);
}

.mana-mode-toggle.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #999, #666);
}

.toggle-icon {
  font-size: 28px;
}

.mana-mode-toggle:not(.disabled) .toggle-icon {
  animation: rotateIcon 2s ease-in-out infinite;
}

@keyframes rotateIcon {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: white;
}

.toggle-title {
  font-size: 11px;
  font-weight: bold;
  opacity: 0.9;
  letter-spacing: 0.5px;
}

.toggle-mode {
  font-size: 13px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  text-align: center;
}

.toggle-lock {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 20px;
  background: #ff6b6b;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .mana-mode-toggle {
    bottom: 15px;
    left: 15px;
    padding: 10px 12px;
  }
  
  .toggle-icon {
    font-size: 24px;
  }
  
  .toggle-title {
    font-size: 10px;
  }
  
  .toggle-mode {
    font-size: 11px;
  }
  
  .toggle-lock {
    width: 24px;
    height: 24px;
    font-size: 16px;
  }
}
</style>
