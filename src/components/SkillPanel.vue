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
@import '../styles/components/skill-panel.css';
</style>