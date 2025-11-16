<script setup lang="ts">
import type { ProfessionalPhase, Position } from '../types/game';

interface Props {
  phase: ProfessionalPhase;
  moveCount: number;
  fiveOffers?: Position[];
  hasSwapped?: boolean; // 新增
}

interface Emits {
  (e: 'swapPlayers'): void;
  (e: 'declineSwap'): void;
  (e: 'chooseFiveOffer', index: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// **新增：根据交换状态显示提示文本**
const getFiveOfferText = () => {
  return props.hasSwapped 
    ? '白方需要在棋盘上点击提供两个第5手的候选位置'
    : '黑方需要在棋盘上点击提供两个第5手的候选位置';
};

const getFiveChooseText = () => {
  return props.hasSwapped
    ? '黑方需要从白方提供的两个选点中选择一个作为第5手（白子）'
    : '白方需要从黑方提供的两个选点中选择一个作为第5手（黑子）';
};
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
        {{ getFiveOfferText() }}
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

    <!-- 五手两打 - 选择阶段 -->
    <div v-if="phase === 'five-choose'" class="phase-panel five-choose compact">
      <div class="compact-content">
        <div class="compact-title">
          <span class="phase-icon">🎯</span>
          <span>五手两打 - {{ hasSwapped ? '黑方' : '白方' }}选择落子点</span>
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
@import '../styles/components/professional-panel.css';
</style>