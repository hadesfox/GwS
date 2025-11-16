<script setup lang="ts">
import { computed } from 'vue';
import type { ManaState } from '../types/game';

interface Props {
  mana: ManaState;
  playerSide: 'black' | 'white';
  totalMoves?: number;  // 新增：接收总步数
}

const props = withDefaults(defineProps<Props>(), {
  totalMoves: 0
});

// 计算距离下次获得法力的步数
const stepsToNextMana = computed(() => {
  const remainder = props.totalMoves % 4;
  
  if (props.playerSide === 'black') {
    // 黑方在余数为3时获得法力
    if (remainder === 0) return 3;
    if (remainder === 1) return 2;
    if (remainder === 2) return 1;
    return 0; // remainder === 3，刚获得法力
  } else {
    // 白方在余数为0时获得法力
    if (remainder === 1) return 3;
    if (remainder === 2) return 2;
    if (remainder === 3) return 1;
    return 0; // remainder === 0，刚获得法力
  }
});
</script>

<template>
  <div class="mana-bar" :class="`mana-bar-${playerSide}`">
    <div class="mana-header">
      <span class="mana-label">法力值</span>
      <span class="mana-count">{{ mana.current }} / {{ mana.max }}</span>
    </div>
    <div class="mana-slots">
      <div
        v-for="i in mana.max"
        :key="i"
        class="mana-slot"
        :class="{ 'filled': i <= mana.current }"
      >
        <div class="mana-glow"></div>
      </div>
    </div>
    <div class="mana-progress-text">
      <span v-if="stepsToNextMana > 0">
        再走 {{ stepsToNextMana }} 步获得法力
      </span>
      <span v-else-if="mana.current < mana.max">
        已获得法力！
      </span>
    </div>
  </div>
</template>

<!-- style 部分保持不变 -->

<style scoped>
@import '../styles/components/mana-bar.css';
</style>
