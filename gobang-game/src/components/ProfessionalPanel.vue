<script setup lang="ts">
import type { ProfessionalPhase, Position } from '../types/game';

interface Props {
  phase: ProfessionalPhase;
  moveCount: number;
  fiveOffers?: Position[];
}

interface Emits {
  (e: 'swapPlayers'): void;
  (e: 'declineSwap'): void;
  (e: 'chooseFiveOffer', index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div v-if="phase !== 'normal'" class="professional-panel">
    <!-- 三手交换阶段 -->
    <div v-if="phase === 'three-swap'" class="phase-panel three-swap">
      <div class="phase-title">
        <span class="phase-icon">🔄</span>
        三手交换阶段
      </div>
      <div class="phase-desc">
        前3手已落子完毕，白方可以选择是否交换黑白双方
      </div>
      <div class="phase-info">
        <strong>当前局势：</strong>已下 {{ moveCount }} 手
      </div>
      <div class="action-buttons">
        <button class="action-btn swap-btn" @click="emit('swapPlayers')">
          <span class="btn-icon">🔀</span>
          <span>交换黑白</span>
          <span class="btn-hint">我方执黑</span>
        </button>
        <button class="action-btn decline-btn" @click="emit('declineSwap')">
          <span class="btn-icon">✓</span>
          <span>不交换</span>
          <span class="btn-hint">维持现状</span>
        </button>
      </div>
    </div>

    <!-- 五手两打 - 提供阶段 -->
    <div v-if="phase === 'five-offer'" class="phase-panel five-offer">
      <div class="phase-title">
        <span class="phase-icon">✌️</span>
        五手两打 - 提供选点
      </div>
      <div class="phase-desc">
        黑方需要在棋盘上点击提供两个第5手的候选位置
      </div>
      <div class="phase-info">
        <strong>已提供：</strong>{{ fiveOffers?.length || 0 }} / 2 个选点
      </div>
      <div v-if="fiveOffers && fiveOffers.length > 0" class="offers-preview">
        <div v-for="(offer, index) in fiveOffers" :key="index" class="offer-item">
          选点{{ index + 1 }}: ({{ offer.row + 1 }}, {{ offer.col + 1 }})
        </div>
      </div>
    </div>

    <!-- 五手两打 - 选择阶段（精简版，不遮挡棋盘） -->
    <div v-if="phase === 'five-choose'" class="phase-panel five-choose compact">
      <div class="compact-content">
        <div class="compact-title">
          <span class="phase-icon">🎯</span>
          <span>五手两打 - 白方选择落子点</span>
        </div>
        <div class="compact-actions">
          <button 
            v-for="(offer, index) in fiveOffers" 
            :key="index"
            class="compact-btn"
            @click="emit('chooseFiveOffer', index)"
          >
            <span class="btn-label">选点 {{ index + 1 }}</span>
            <span class="btn-position">({{ offer.row + 1 }}, {{ offer.col + 1 }})</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.professional-panel {
  margin: 20px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.phase-panel {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.three-swap {
  border: 3px solid #ff9800;
  background: linear-gradient(135deg, #fff3e0, #ffffff);
}

.five-offer {
  border: 3px solid #4caf50;
  background: linear-gradient(135deg, #e8f5e9, #ffffff);
}

.five-choose {
  border: 3px solid #2196f3;
  background: linear-gradient(135deg, #e3f2fd, #ffffff);
}

/* 精简版样式 - 不遮挡棋盘 */
.five-choose.compact {
  padding: 15px 20px;
}

.compact-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.compact-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.compact-actions {
  display: flex;
  gap: 15px;
}

.compact-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}

.compact-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-label {
  font-size: 16px;
  font-weight: bold;
}

.btn-position {
  font-size: 13px;
  opacity: 0.9;
}

.phase-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.phase-icon {
  font-size: 24px;
}

.phase-desc {
  color: #666;
  margin-bottom: 15px;
  line-height: 1.6;
  font-size: 14px;
}

.phase-info {
  background: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.action-btn {
  padding: 15px;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: bold;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.swap-btn {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
}

.decline-btn {
  background: linear-gradient(135deg, #9e9e9e, #757575);
  color: white;
}

.btn-icon {
  font-size: 24px;
}

.btn-hint {
  font-size: 11px;
  opacity: 0.9;
  font-weight: normal;
}

.offers-preview {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.offer-item {
  background: #4caf50;
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .action-buttons {
    grid-template-columns: 1fr;
  }
  
  .compact-content {
    flex-direction: column;
  }
  
  .compact-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .compact-btn {
    width: 100%;
  }
}
</style>