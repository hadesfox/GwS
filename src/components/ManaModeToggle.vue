<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  manaGrowthMode: 'default' | 'alternate';
  disabled: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['toggle']);

const handleToggle = () => {
  if (!props.disabled) {
    emit('toggle');
  }
};

const getModeText = computed(() => {
  return props.manaGrowthMode === 'default' ? '标准(4步)' : '快速(2步)';
});

const getIcon = computed(() => {
  return props.manaGrowthMode === 'default' ? '🔄' : '⚡';
});
</script>

<template>
  <button 
    class="mana-mode-toggle" 
    :class="{ 'disabled': disabled }"
    :disabled="disabled"
    @click="handleToggle"
    :title="disabled ? '已有玩家落子，无法切换' : '点击切换法力值增长模式'"
  >
    <div class="toggle-icon">{{ getIcon }}</div>
    <div class="toggle-text">
      <div class="toggle-title">法力模式</div>
      <div class="toggle-mode">{{ getModeText }}</div>
    </div>
    <div v-if="disabled" class="toggle-lock">🔒</div>
  </button>
</template>

<style scoped>
@import '../styles/components/mana-mode-toggle.css';
</style>