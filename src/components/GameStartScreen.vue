<script setup lang="ts">
import type { GameMode } from '../types/game';

interface Emits {
  (e: 'startGame', mode: GameMode): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <div class="start-screen">
    <div class="start-container">
      <h1 class="title">🎮 技能五子棋</h1>
      <p class="subtitle">选择游戏模式开始</p>
      
      <div class="mode-selection">
        <button 
          class="mode-card basic-mode"
          @click="emit('startGame', 'basic')"
        >
          <div class="mode-icon">🎯</div>
          <div class="mode-title">基础模式</div>
          <div class="mode-description">
            标准五子棋规则<br/>
            简单快速对弈
          </div>
          <div class="start-btn">开始游戏</div>
        </button>
        
        <button 
          class="mode-card professional-mode"
          @click="emit('startGame', 'professional')"
        >
          <div class="mode-icon">🏆</div>
          <div class="mode-title">专业模式</div>
          <div class="mode-description">
            连珠（Renju）规则<br/>
            三手交换 · 五手两打 · 禁手
          </div>
          <div class="start-btn">开始游戏</div>
        </button>
      </div>
      
      <div class="rules-info">
        <h3>📖 规则说明</h3>
        <div class="rules-grid">
          <div class="rule-item">
            <strong>基础模式：</strong>标准五子棋，五子连珠即可获胜
          </div>
          <div class="rule-item">
            <strong>专业模式：</strong>
            <ul>
              <li>第一手必须放在棋盘正中心</li>
              <li>三手交换：第3手后白方可选择交换黑白</li>
              <li>五手两打：第5手提供2个选点，另一方选择其一</li>
              <li>禁手规则：黑方禁止三三、四四、长连</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.start-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.start-container {
  max-width: 900px;
  width: 100%;
}

.title {
  font-size: 48px;
  color: white;
  text-align: center;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin: 0 0 50px 0;
}

.mode-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.mode-card {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  cursor: pointer;
  border: 4px solid transparent;
  transition: all 0.3s;
  text-align: center;
}

.mode-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.basic-mode:hover {
  border-color: #4facfe;
}

.professional-mode:hover {
  border-color: #ffd700;
}

.mode-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.mode-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.mode-description {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 25px;
  min-height: 60px;
}

.start-btn {
  display: inline-block;
  padding: 12px 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 25px;
  font-weight: bold;
  font-size: 16px;
}

.basic-mode:hover .start-btn {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.professional-mode:hover .start-btn {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.rules-info {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.rules-info h3 {
  color: #333;
  margin: 0 0 20px 0;
  font-size: 22px;
  text-align: center;
}

.rules-grid {
  display: grid;
  gap: 20px;
}

.rule-item {
  background: #f8f9fa;
  padding: 15px 20px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.rule-item strong {
  color: #667eea;
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.rule-item ul {
  margin: 8px 0 0 20px;
  padding: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .mode-selection {
    grid-template-columns: 1fr;
  }
  
  .title {
    font-size: 36px;
  }
  
  .mode-icon {
    font-size: 48px;
  }
}
</style>