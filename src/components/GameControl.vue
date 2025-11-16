<script setup lang="ts">
interface Emits {
  (e: 'undo'): void;
  (e: 'restart'): void;
  (e: 'toggle-extra-turn'): void;
}

interface Props {
  canUndo: boolean;
  isExtraTurnEnabled: boolean;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="game-control">
    <button 
      class="btn btn-undo"
      :disabled="!canUndo"
      @click="emit('undo')"
    >
      ↩️ 悔棋
    </button>
    
    <button 
      class="btn btn-restart"
      @click="emit('restart')"
    >
      🔄 重新开始
    </button>
    
    <button 
      class="btn btn-extra-turn" 
      :class="{ 'enabled': isExtraTurnEnabled }"
      @click="emit('toggle-extra-turn')"
    >
      🛡️ 反制回合
      <span class="switch-status">{{ isExtraTurnEnabled ? '开启' : '关闭' }}</span>
    </button>
  </div>
</template>

<style scoped>
@import '../styles/components/game-control.css';
</style>