<script setup lang="ts">
import type { GameMode } from '../types/game';

interface Props {
  currentMode: GameMode;
  disabled?: boolean;
}

interface Emits {
  (e: 'changeMode', mode: GameMode): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <div class="mode-selector">
    <h3>游戏模式</h3>
    <div class="mode-buttons">
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'basic' }"
        :disabled="disabled"
        @click="emit('changeMode', 'basic')"
      >
        <div class="mode-icon">🎯</div>
        <div class="mode-name">基础模式</div>
        <div class="mode-desc">标准五子棋规则</div>
      </button>
      
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'professional' }"
        :disabled="disabled"
        @click="emit('changeMode', 'professional')"
      >
        <div class="mode-icon">🏆</div>
        <div class="mode-name">专业模式</div>
        <div class="mode-desc">连珠规则（禁手）</div>
      </button>
    </div>
    
    <div v-if="currentMode === 'professional'" class="professional-info">
      <div class="info-title">📖 专业模式规则说明</div>
      <ul class="rule-list">
        <li><strong>三手交换：</strong>第3手后白方可选择交换黑白</li>
        <li><strong>五手两打：</strong>第5手黑方提供2个选点，白方选择</li>
        <li><strong>禁手规则：</strong>黑方禁止三三、四四、长连</li>
        <li class="forbidden-examples">
          <span class="forbidden-type">三三禁手</span>：同时形成2个活三
        </li>
        <li class="forbidden-examples">
          <span class="forbidden-type">四四禁手</span>：同时形成2个冲四/活四
        </li>
        <li class="forbidden-examples">
          <span class="forbidden-type">长连禁手</span>：形成6连及以上
        </li>
      </ul>
      <div class="forbidden-note">
        ⚠️ 禁手位置会在棋盘上用红色 ✕ 标记
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-selector {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 15px 0;
  color: #333;
  text-align: center;
  font-size: 20px;
}

.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.mode-btn {
  padding: 20px 15px;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.mode-btn:hover:not(:disabled) {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
}

.mode-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15, #764ba215);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.mode-desc {
  font-size: 12px;
  color: #666;
}

.professional-info {
  background: linear-gradient(135deg, #fff5e6, #ffe6f0);
  border-radius: 10px;
  padding: 15px;
  border: 2px solid #ffd700;
}

.info-title {
  font-weight: bold;
  color: #d84315;
  margin-bottom: 10px;
  font-size: 14px;
}

.rule-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #333;
  line-height: 1.8;
}

.rule-list li {
  margin-bottom: 5px;
}

.rule-list strong {
  color: #667eea;
}

.forbidden-examples {
  margin-left: 20px;
  font-size: 12px;
}

.forbidden-type {
  color: #d32f2f;
  font-weight: bold;
}

.forbidden-note {
  margin-top: 10px;
  padding: 8px;
  background: rgba(211, 47, 47, 0.1);
  border-radius: 5px;
  font-size: 12px;
  color: #d32f2f;
  font-weight: bold;
  text-align: center;
}

@media (max-width: 768px) {
  .mode-buttons {
    grid-template-columns: 1fr;
  }
}
</style>