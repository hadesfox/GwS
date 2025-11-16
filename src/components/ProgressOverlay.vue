<script setup lang="ts">
interface Props {
  show: boolean;
  current: number;
  total: number;
  player?: 'black' | 'white';
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  player: undefined,
  message: '准备下一手...'
});
</script>

<template>
  <div v-if="show" class="progress-overlay">
    <div class="progress-content">
      <div class="progress-message">{{ message }}</div>
      <div v-if="player" :class="['progress-player', player]">
        {{ player === 'black' ? '黑棋' : '白棋' }}
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar"
          :style="{ width: `${(current / total) * 100}%` }"
        ></div>
      </div>
      <div class="progress-text">{{ current }}/{{ total }}</div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/components/progress-overlay.css';
</style>