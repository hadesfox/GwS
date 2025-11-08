<script setup lang="ts">
import type { GameMode } from '../types/game';
import { useUpdateAnnouncements } from '../composables/useUpdateAnnouncements';

interface Emits {
  (e: 'startGame', mode: GameMode): void;
}

const emit = defineEmits<Emits>();

// 使用更新公告功能
const {
  announcements,
  showNewAnnouncement,
  showAnnouncementsList,
  latestAnnouncement,
  markAsRead,
  openAnnouncementsList,
  closeAnnouncementsList
} = useUpdateAnnouncements();
</script>

<template>
  <div class="start-screen">
    <!-- 更新公告按钮 -->
    <button class="announcement-btn" @click="openAnnouncementsList">
      📢 更新公告
    </button>
    
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
  
  <!-- 最新公告弹窗 -->
  <div v-if="showNewAnnouncement && latestAnnouncement" class="announcement-modal">
    <div class="announcement-content">
      <div class="announcement-header">
        <h3>{{ latestAnnouncement.title }}</h3>
        <span class="announcement-date">{{ latestAnnouncement.date }}</span>
      </div>
      <div class="announcement-body">
        <pre>{{ latestAnnouncement.content }}</pre>
      </div>
      <div class="announcement-footer">
        <button @click="markAsRead" class="announcement-close-btn">
          我知道了
        </button>
      </div>
    </div>
  </div>
  
  <!-- 公告列表弹窗 -->
  <div v-if="showAnnouncementsList" class="announcements-list-modal">
    <div class="announcements-list-content">
      <div class="announcements-list-header">
        <h3>📢 更新公告历史</h3>
        <button @click="closeAnnouncementsList" class="close-btn">×</button>
      </div>
      <div class="announcements-list-body">
        <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item">
          <div class="announcement-item-header">
            <h4>{{ announcement.title }}</h4>
            <span class="announcement-item-date">{{ announcement.date }}</span>
          </div>
          <div class="announcement-item-body">
            <pre>{{ announcement.content }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 更新公告按钮样式 */
.announcement-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.announcement-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

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

/* 公告弹窗样式 */
.announcement-modal,
.announcements-list-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.announcement-content,
.announcements-list-content {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.announcement-header,
.announcements-list-header {
  border-bottom: 2px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.announcement-header h3,
.announcements-list-header h3 {
  margin: 0;
  color: #333;
  font-size: 22px;
}

.announcement-date {
  color: #666;
  font-size: 14px;
  margin-left: 10px;
}

.announcement-body pre,
.announcement-item-body pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: #555;
  line-height: 1.8;
  margin: 0;
  font-family: inherit;
}

.announcement-footer {
  margin-top: 25px;
  text-align: center;
}

.announcement-close-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
}

.announcement-close-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

/* 公告列表样式 */
.announcements-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 30px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.announcement-item {
  border-bottom: 1px solid #eee;
  padding: 20px 0;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.announcement-item-header h4 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.announcement-item-date {
  color: #999;
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .announcement-btn {
    position: relative;
    top: auto;
    right: auto;
    margin-bottom: 20px;
    display: block;
    margin-left: auto;
  }
  
  .announcement-content,
  .announcements-list-content {
    padding: 20px;
    margin: 20px;
    max-height: 90vh;
  }
}
</style>