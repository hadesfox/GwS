<script setup lang="ts">
interface Props {
  show: boolean;
  player?: 'black' | 'white';
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  player: undefined,
  message: '回合锁定'
});
</script>

<template>
  <div v-if="show" class="lock-overlay">
    <div class="lock-content">
      <div class="lock-icon">🔒</div>
      <div class="lock-message">{{ message }}</div>
      <div v-if="player" :class="['lock-player', player]">
        {{ player === 'black' ? '黑棋' : '白棋' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/components/lock-overlay.css';
</style>