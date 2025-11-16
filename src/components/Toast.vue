<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'skip-turn' | 'diversion' | 'ban-black' | 'ban-white' | 'honesty-black' | 'honesty-white';
  message: string;
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000
});

const getIcon = computed(() => {
  switch (props.type) {
    case 'skip-turn': return '💤';
    case 'diversion': return '🎯';
    case 'ban-black':
    case 'ban-white': return '✊';
    case 'honesty-black':
    case 'honesty-white': return '💰';
    default: return 'ℹ️';
  }
});

const getClass = computed(() => {
  return `toast ${props.type}`;
});
</script>

<template>
  <div :class="getClass">
    <span class="toast-icon">{{ getIcon }}</span>
    <span class="toast-text">{{ message }}</span>
  </div>
</template>

<style scoped>
@import '../styles/components/toast.css';
</style>