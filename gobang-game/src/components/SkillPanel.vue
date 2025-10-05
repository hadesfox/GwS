<script setup lang="ts">
import { SKILLS } from '../types/game';
import type { SkillType, ManaState } from '../types/game';

interface Props {
  mana: ManaState;
  playerSide: 'black' | 'white';
  disabled?: boolean;
}

interface Emits {
  (e: 'useSkill', skillId: SkillType): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<Emits>();

const canUseSkill = (manaCost: number) => {
  return !props.disabled && props.mana.current >= manaCost;
};

const handleSkillClick = (skillId: SkillType, manaCost: number) => {
  if (canUseSkill(manaCost)) {
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
    <div class="skill-grid">
      <button
        v-for="skill in SKILLS"
        :key="skill.id"
        class="skill-btn"
        :class="{ 
          'skill-available': canUseSkill(skill.manaCost),
          'skill-locked': !canUseSkill(skill.manaCost)
        }"
        :disabled="!canUseSkill(skill.manaCost)"
        @click="handleSkillClick(skill.id, skill.manaCost)"
        :title="skill.description"
      >
        <div class="skill-icon-large">{{ skill.icon }}</div>
        <div class="skill-name">{{ skill.name }}</div>
        <div class="skill-cost">
          <span class="cost-icon">💎</span>
          <span>{{ skill.manaCost }}</span>
        </div>
        <div v-if="!canUseSkill(skill.manaCost)" class="skill-overlay">
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
  margin: 10px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.skill-btn {
  position: relative;
  background: linear-gradient(135deg, #3a3a4e, #2a2a3e);
  border: 2px solid #444;
  border-radius: 10px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.skill-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.skill-available {
  border-color: #00d4ff;
  background: linear-gradient(135deg, #1e4d6e, #2a3a5e);
}

.skill-available:hover {
  border-color: #00f4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
}

.skill-locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon-large {
  font-size: 32px;
  margin-bottom: 4px;
}

.skill-name {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  min-height: 28px;
  display: flex;
  align-items: center;
}

.skill-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #00d4ff;
  font-weight: bold;
  font-size: 13px;
  margin-top: 4px;
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

@media (max-width: 768px) {
  .skill-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .skill-name {
    font-size: 10px;
  }
  
  .skill-icon-large {
    font-size: 24px;
  }
}
</style>