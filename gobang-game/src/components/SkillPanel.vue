<script setup lang="ts">
import { SKILLS } from '../types/game';
import type { SkillType, ManaState, SkillState } from '../types/game';

interface Props {
  mana: ManaState;
  playerSide: 'black' | 'white';
  disabled?: boolean;
  skillState?: SkillState;  // 新增
}

interface Emits {
  (e: 'useSkill', skillId: SkillType): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  skillState: () => ({ 
    isSelecting: false, 
    skillType: null, 
    player: null,
    skipNextTurn: false,
    canUseComeback: false
  })
});

const emit = defineEmits<Emits>();

const canUseSkill = (skillId: SkillType, manaCost: number) => {
  if (props.disabled) return false;
  if (props.mana.current < manaCost) return false;
  
  // 东山再起只能在对方使用力拔山兮后使用
  if (skillId === 'comeback') {
    return props.skillState?.canUseComeback || false;
  }
  
  return true;
};

const handleSkillClick = (skillId: SkillType, manaCost: number) => {
  if (canUseSkill(skillId, manaCost)) {
    emit('useSkill', skillId);
  }
};
</script>

<template>
  <div class="skill-panel" :class="`skill-panel-${playerSide}`">
    <div class="skill-header">
      <span class="skill-icon">⚡</span>
      <span class="skill-title">技能</span>
    </div>
    
    <!-- 东山再起紧急提示 -->
    <div v-if="skillState?.canUseComeback" class="comeback-alert">
      <div class="alert-icon">⚠️</div>
      <div class="alert-text">对方使用了力拔山兮！</div>
      <div class="alert-hint">快速使用东山再起反击！</div>
    </div>
    
    <div class="skill-grid">
      <button
        v-for="skill in SKILLS"
        :key="skill.id"
        class="skill-btn"
        :class="{ 
          'skill-available': canUseSkill(skill.id, skill.manaCost),
          'skill-locked': !canUseSkill(skill.id, skill.manaCost),
          'skill-urgent': skill.id === 'comeback' && skillState?.canUseComeback
        }"
        :disabled="!canUseSkill(skill.id, skill.manaCost)"
        @click="handleSkillClick(skill.id, skill.manaCost)"
        :title="skill.description"
      >
        <div class="skill-icon-large">{{ skill.icon }}</div>
        <div class="skill-name">{{ skill.name }}</div>
        <div class="skill-cost">
          <span class="cost-icon">💎</span>
          <span>{{ skill.manaCost }}</span>
        </div>
        <div v-if="!canUseSkill(skill.id, skill.manaCost)" class="skill-overlay">
          <span class="lock-icon">🔒</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.skill-panel {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
}

.skill-panel-black {
  border: 2px solid #444;
}

.skill-panel-white {
  border: 2px solid #ccc;
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.skill-header .skill-icon {
  font-size: 20px;
}

.skill-title {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.skill-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-btn {
  position: relative;
  background: linear-gradient(135deg, #3a3a4e, #2a2a3e);
  border: 2px solid #444;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
  display: grid;
  grid-template-columns: 40px 1fr 50px;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.skill-btn:hover:not(:disabled) {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.skill-available {
  border-color: #00d4ff;
  background: linear-gradient(135deg, #1e4d6e, #2a3a5e);
}

.skill-available:hover {
  border-color: #00f4ff;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.skill-locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon-large {
  font-size: 32px;
  text-align: center;
}

.skill-name {
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  text-align: left;
}

.skill-cost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #00d4ff;
  font-weight: bold;
  font-size: 13px;
}

.cost-icon {
  font-size: 14px;
}

.skill-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.lock-icon {
  font-size: 24px;
}

.comeback-alert {
  background: linear-gradient(135deg, #ff5252, #ff1744);
  color: white;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  text-align: center;
  animation: pulse 1s infinite;
  box-shadow: 0 4px 12px rgba(255, 23, 68, 0.5);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(255, 23, 68, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(255, 23, 68, 0.8);
  }
}

.alert-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.alert-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.alert-hint {
  font-size: 12px;
  opacity: 0.9;
}

.skill-urgent {
  border-color: #ff1744 !important;
  background: linear-gradient(135deg, #ff5252, #ff1744) !important;
  animation: urgentGlow 1s infinite;
}

@keyframes urgentGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 23, 68, 0.6);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 23, 68, 1);
  }
}
</style>
