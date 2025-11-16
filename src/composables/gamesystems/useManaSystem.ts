import { ref, computed } from 'vue';
import type { Player } from '../../types/game';
import { MAX_MANA } from '../../types/game';

export type ManaGrowthMode = 'default' | 'alternate';

export type ManaState = {
  current: number;
  max: number;
  moveCounter: number;
};

export function useManaSystem() {
  const blackMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0
  });

  const whiteMana = ref<ManaState>({
    current: 0,
    max: MAX_MANA,
    moveCounter: 0
  });

  const manaGrowthMode = ref<ManaGrowthMode>('default');

  // 根据总步数更新法力值
  const updateManaByTotalMoves = (totalMoves: number) => {
    if (manaGrowthMode.value === 'default') {
      // 默认模式：每两步各加1点
      if (totalMoves % 2 === 0) {
        const currentMana = totalMoves % 4 === 0 ? blackMana : whiteMana;
        if (currentMana.value.current < currentMana.value.max) {
          currentMana.value.current++;
        }
      }
    } else {
      // 新模式：(步数-1)/2，余数为1则黑方+1，余数为0则白方+1
      if (totalMoves > 0) {
        const divided = (totalMoves - 1) / 2;
        const remainder = (totalMoves - 1) % 2;

        if (remainder === 1) {
          // 黑方获得法力
          if (blackMana.value.current < blackMana.value.max) {
            blackMana.value.current++;
          }
        } else if (remainder === 0) {
          // 白方获得法力
          if (whiteMana.value.current < whiteMana.value.max) {
            whiteMana.value.current++;
          }
        }
      }
    }
  };

  // 切换法力值增长模式
  const toggleManaGrowthMode = () => {
    manaGrowthMode.value = manaGrowthMode.value === 'default' ? 'alternate' : 'default';
  };

  // 作弊函数：增加法力值
  const addManaCheat = () => {
    blackMana.value.current = Math.min(blackMana.value.current + 2, blackMana.value.max);
    whiteMana.value.current = Math.min(whiteMana.value.current + 2, whiteMana.value.max);
  };

  // 重置法力值
  const resetMana = () => {
    if (manaGrowthMode.value === 'alternate') {
      // 快速模式：黑方开局1点法力
      blackMana.value = {
        current: 1,
        max: MAX_MANA,
        moveCounter: 0
      };
      whiteMana.value = {
        current: 0,
        max: MAX_MANA,
        moveCounter: 0
      };
    } else {
      // 标准模式：双方都是0
      blackMana.value = {
        current: 0,
        max: MAX_MANA,
        moveCounter: 0
      };
      whiteMana.value = {
        current: 0,
        max: MAX_MANA,
        moveCounter: 0
      };
    }
  };

  // 获取特定玩家的法力值
  const getPlayerMana = (player: Player) => {
    return player === 'black' ? blackMana.value : whiteMana.value;
  };

  // 消耗特定玩家的法力值
  const consumeMana = (player: Player, amount: number): boolean => {
    const mana = player === 'black' ? blackMana.value : whiteMana.value;
    if (mana.current >= amount) {
      mana.current -= amount;
      return true;
    }
    return false;
  };

  return {
    blackMana,
    whiteMana,
    manaGrowthMode,
    toggleManaGrowthMode,
    updateManaByTotalMoves,
    addManaCheat,
    resetMana,
    getPlayerMana,
    consumeMana
  };
}