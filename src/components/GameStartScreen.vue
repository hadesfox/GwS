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
@import '../styles/components/game-start-screen.css';
</style>