<script setup lang="ts">
interface Emits {
  (e: 'undo'): void;
  (e: 'restart'): void;
}

interface Props {
  canUndo: boolean;
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
  </div>
</template>

<style scoped>
.game-control {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px;
}

.btn {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-undo {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-restart {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}
</style>