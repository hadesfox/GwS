<script setup lang="ts">
import type { ManaState } from "../types/game";

interface Props {
  mana: ManaState;
  playerSide: "black" | "white";
}

const props = defineProps<Props>();
</script>

<template>
  <div class="mana-bar" :class="`mana-bar-${playerSide}`">
    <div class="mana-header">
      <span class="mana-label">法力值</span>
      <span class="mana-count">{{ mana.current }} / {{ mana.max }}</span>
    </div>
    <div class="mana-slots">
      <div
        v-for="i in mana.max"
        :key="i"
        class="mana-slot"
        :class="{ filled: i <= mana.current }"
      >
        <div class="mana-glow"></div>
      </div>
    </div>
    <div class="mana-progress-text">
      <span v-if="mana.moveCounter > 0">
        再走 {{ 2 - mana.moveCounter }} 步获得法力
      </span>
    </div>
  </div>
</template>

<style scoped>
.mana-bar {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 12px;
  padding: 15px;
  margin: 10px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.mana-bar-black {
  border: 2px solid #333;
}

.mana-bar-white {
  border: 2px solid #e0e0e0;
}

.mana-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mana-label {
  color: #00d4ff;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mana-count {
  color: #fff;
  font-weight: bold;
  font-size: 16px;
}

.mana-slots {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.mana-slot {
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mana-slot.filled {
  background: linear-gradient(135deg, #00d4ff, #0096ff);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  animation: fillGlow 0.5s ease-out;
}

.mana-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  transition: left 0.5s;
}

.mana-slot.filled .mana-glow {
  left: 100%;
}

.mana-progress-text {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  min-height: 16px;
}

@keyframes fillGlow {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
