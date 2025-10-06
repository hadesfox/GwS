<script setup lang="ts">
import { SKILLS } from '../types/game';
import type { SkillType, ManaState } from '../types/game';

interface Props {
  mana: ManaState;
  playerSide: 'black' | 'white';
  disabled?: boolean;
  flySandBanned?: number;
}

interface Emits {
  (e: 'useSkill', skillId: SkillType): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  flySandBanned: 0
});

const emit = defineEmits<Emits>();

const canUseSkill = (skillId: SkillType, manaCost: number) => {
  if (props.disabled) return false;
  if (props.mana.current < manaCost) return false;
  
  if (skillId === 'fly-sand' && props.flySandBanned > 0) {
    return false;
  }
  
  return true;
};

const handleSkillClick = (skillId: SkillType, manaCost: number) => {
  if (canUseSkill(skillId, manaCost)) {
    emit('useSkill', skillId);
  }
};

const getSkillStatus = (skillId: SkillType) => {
  if (skillId === 'fly-sand' && props.flySandBanned > 0) {
    return `被禁用 (剩余${props.flySandBanned}回合)`;
  }
  return '';
};
</script>

<template>
  <div class="skill-panel" :class="`skill-panel-${playerSide}`">
    <div class="skill-header">
      <span class="skill-icon">⚡</span>
      <span class="skill-title">技能</span>
    </div>
    <div class="skill-list">
      <button
        v-for="skill in SKILLS"
        :key="skill.id"
        class="skill-btn"
        :class="{ 
          'skill-available': canUseSkill(skill.id, skill.manaCost),
          'skill-locked': !canUseSkill(skill.id, skill.manaCost),
          'skill-banned': skill.id === 'fly-sand' && flySandBanned > 0
        }"
        :disabled="!canUseSkill(skill.id, skill.manaCost)"
        @click="handleSkillClick(skill.id, skill.manaCost)"
        :title="skill.description"
      >
        <div class="skill-icon-large">{{ skill.icon }}</div>
        <div class="skill-info">
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-cost">
            <span class="cost-icon">💎</span>
            <span>{{ skill.manaCost }}</span>
          </div>
        </div>
        <div v-if="!canUseSkill(skill.id, skill.manaCost)" class="skill-overlay">
          <span v-if="skill.id === 'fly-sand' && flySandBanned > 0" class="ban-icon">✊</span>
          <span v-else class="lock-icon">🔒</span>
          <div v-if="skill.id === 'fly-sand' && flySandBanned > 0" class="ban-text">
            剩余{{ flySandBanned }}回合
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.skill-panel {
  background: linear-gradient(135deg, #2a2a3e, #1e1e2e);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-height: 600px;
  overflow-y: auto;
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
  gap: 6px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.skill-header .skill-icon {
  font-size: 16px;
}

.skill-title {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-btn {
  position: relative;
  background: linear-gradient(135deg, #3a3a4e, #2a2a3e);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  min-height: 50px;
}

.skill-btn:hover:not(:disabled) {
  transform: translateX(3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

.skill-available {
  border-color: #00d4ff;
  background: linear-gradient(135deg, #1e4d6e, #2a3a5e);
}

.skill-available:hover {
  border-color: #00f4ff;
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
}

.skill-locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-banned {
  border-color: #d32f2f;
  background: linear-gradient(135deg, #5a1a1a, #3a1a2a);
  opacity: 0.6;
}

.skill-icon-large {
  font-size: 28px;
  text-align: center;
  flex-shrink: 0;
  width: 35px;
}

.skill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-name {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-align: left;
}

.skill-cost {
  display: flex;
  align-items: center;
  gap: 3px;
  color: #00d4ff;
  font-weight: bold;
  font-size: 11px;
}

.cost-icon {
  font-size: 12px;
}

.skill-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  gap: 4px;
}

.lock-icon {
  font-size: 20px;
}

.ban-icon {
  font-size: 26px;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.ban-text {
  color: #ff5252;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
}

/* 滚动条样式 */
.skill-panel::-webkit-scrollbar {
  width: 6px;
}

.skill-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.skill-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.skill-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>