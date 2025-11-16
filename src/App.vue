<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameInfo from './components/GameInfo.vue';
import GameControl from './components/GameControl.vue';
import ProfessionalPanel from './components/ProfessionalPanel.vue';
import GameStartScreen from './components/GameStartScreen.vue';
import SkillPanel from './components/SkillPanel.vue';
import Toast from './components/Toast.vue';
import ManaModeToggle from './components/ManaModeToggle.vue';
import LockOverlay from './components/LockOverlay.vue';
import ProgressOverlay from './components/ProgressOverlay.vue';
import { useGobang } from './composables/useGobang';
import { useUIInteraction } from './composables/useUIInteraction';
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
  isExtraTurn,      // 添加遗漏的变量
  potentialWinner,  // 添加遗漏的变量
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
// titleClickCount 和 showCheatButton 已从 useUIInteraction 获取

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

// 使用UI交互组合式函数
const {
  titleClickCount,
  showCheatButton,
  getDecisionHintText,
  getLoadingText,
  canCounter,
  handleSkillUse,
  handleExecuteSkill,
  handleTitleClick,
  handleCheat,
  handleCounterSkill,
  handleManaModeToggle
} = useUIInteraction(
  professionalPhase,
  hasSwapped,
  useSkill,
  executeSkillEffect,
  addManaCheat,
  counterWindowOpen,
  counterWindowPlayer,
  blackMana,
  whiteMana,
  canChangeManaMode,
  toggleManaGrowthMode,
  restart,
  showDecisionHint,
  closeCounterWindow
);

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
      
      <!-- 提示信息组件 -->
      <Toast v-if="skipNextTurn" type="skip-turn" :message="`${skipNextTurn === 'black' ? '黑方' : '白方'}下一回合将被跳过（静如止水效果）`" />
      <Toast v-if="diversionTurnsLeft > 0" type="diversion" :message="`${currentPlayer === 'black' ? '白方' : '黑方'}将暂停 ${diversionTurnsLeft} 回合（调呈离山效果）`" />
      <Toast v-if="flySandBanned.black > 0" type="ban-black" :message="`黑方禁止使用飞沙走石，剩余 ${flySandBanned.black} 回合`" />
      <Toast v-if="flySandBanned.white > 0" type="ban-white" :message="`白方禁止使用飞沙走石，剩余 ${flySandBanned.white} 回合`" />
      <Toast v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'black'" type="honesty-black" :message="`黑方可以使用'拾金不昧'捡回被移除的${lastRemovedPiece.color === 'black' ? '黑' : '白'}棋`" />
      <Toast v-if="lastRemovedPiece && lastRemovedPiece.removedBy !== 'white'" type="honesty-white" :message="`白方可以使用'拾金不昧'捡回被移除的${lastRemovedPiece.color === 'black' ? '黑' : '白'}棋`" />

      <div v-if="showDecisionHint" class="top-hint">
        {{ getDecisionHintText }}
      </div>

      <!-- 法力值增长模式切换按钮 - 左下角 -->
      <ManaModeToggle 
        :mana-growth-mode="manaGrowthMode" 
        :disabled="!canChangeManaMode"
        @toggle="handleManaModeToggle"
      />


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
              <!-- 锁定覆盖层组件 -->
              <LockOverlay 
                :show="reverseEffect.casterLocked && reverseEffect.casterPlayer === 'black'" 
                :player="'black'"
                message="棋盘锁定中..."
              />

              <!-- 进度条覆盖层组件 -->
              <ProgressOverlay 
                :show="reverseEffect.showProgressBar && reverseEffect.targetPlayer === 'black'"
                :current="reverseEffect.progress"
                :total="100"
                :player="'black'"
                :message="getLoadingText"
              />
              
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
              <!-- 锁定覆盖层组件 -->
              <LockOverlay 
                :show="reverseEffect.casterLocked && reverseEffect.casterPlayer === 'white'" 
                :player="'white'"
                message="棋盘锁定中..."
              />

              <!-- 进度条覆盖层组件 -->
              <ProgressOverlay 
                :show="reverseEffect.showProgressBar && reverseEffect.targetPlayer === 'white'"
                :current="reverseEffect.progress"
                :total="100"
                :player="'white'"
                :message="getLoadingText"
              />
              
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
@import './styles/components/app.css';
</style>
