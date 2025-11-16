import { computed, ref, watch } from 'vue';
import type { SkillType } from '../types/game';

/**
 * 处理UI交互逻辑的组合式函数
 * @param professionalPhase 专业模式阶段
 * @param hasSwapped 是否交换了黑白
 * @param useSkill 使用技能的函数
 * @param executeSkillEffect 执行技能效果的函数
 * @param addManaCheat 添加法力值作弊的函数
 * @param counterWindowOpen 反击窗口是否打开
 * @param counterWindowPlayer 反击窗口的玩家
 * @param blackMana 黑方法力值
 * @param whiteMana 白方法力值
 * @param canChangeManaMode 是否可以改变法力值模式
 * @param toggleManaGrowthMode 切换法力值增长模式的函数
 * @param restart 重新开始游戏的函数
 * @param showDecisionHint 是否显示决策提示
 * @param closeCounterWindow 关闭反击窗口的函数
 */
export function useUIInteraction(
  professionalPhase: any,
  hasSwapped: any,
  useSkill: (player: "black" | "white", skillId: SkillType) => boolean,
  executeSkillEffect: (row: number, col: number) => boolean,
  addManaCheat: () => void,
  counterWindowOpen: any,
  counterWindowPlayer: any,
  blackMana: any,
  whiteMana: any,
  canChangeManaMode: any,
  toggleManaGrowthMode: () => void,
  restart: () => void,
  showDecisionHint: any,
  closeCounterWindow: () => void
) {
  // 标题点击计数（隐藏功能）
  const titleClickCount = ref(0);
  const showCheatButton = ref(false);

  // 计算属性：获取决策提示文本
  const getDecisionHintText = computed(() => {
    if (professionalPhase.value === "three-swap") {
      return "白方请在下方操作面板中选择是否交换黑白";
    }
    if (professionalPhase.value === "five-choose") {
      return `${hasSwapped.value ? "黑方" : "白方"}请在下方操作面板中选择落子点`;
    }
    return "";
  });

  // 计算属性：获取加载提示文本
  const getLoadingText = computed(() => {
    return '正在扫描硬盘...';
  });

  // 计算属性：是否可以使用反击技能
  const canCounter = computed(() => {
    if (!counterWindowOpen.value || !counterWindowPlayer.value) return false;
    const mana = counterWindowPlayer.value === "black" ? blackMana.value : whiteMana.value;
    return mana.current >= 13;
  });

  // 处理技能使用
  const handleSkillUse = (player: "black" | "white", skillId: SkillType) => {
    const success = useSkill(player, skillId);
    if (success) {
      console.log(`${player} activated skill: ${skillId}`);
    } else {
      console.log(`${player} failed to use skill: ${skillId}`);
    }
  };

  // 处理执行技能效果
  const handleExecuteSkill = (row: number, col: number) => {
    const success = executeSkillEffect(row, col);
    if (!success) {
      console.log("Invalid skill target");
    }
  };

  // 处理标题点击（隐藏功能）
  const handleTitleClick = () => {
    titleClickCount.value++;
    if (titleClickCount.value >= 15) {
      showCheatButton.value = true;
    }
  };

  // 处理作弊功能
  const handleCheat = () => {
    addManaCheat();
  };

  // 处理反击技能
  const handleCounterSkill = () => {
    if (counterWindowPlayer.value && canCounter.value) {
      handleSkillUse(counterWindowPlayer.value, "comeback");
    }
  };

  // 处理法力值模式切换
  const handleManaModeToggle = () => {
    if (canChangeManaMode.value) {
      toggleManaGrowthMode();
      // 切换模式后重新开始游戏，应用新的法力值设置
      restart();
    }
  };

  // 监听决策提示显示，滚动到顶部
  watch(showDecisionHint, (newValue) => {
    if (newValue) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  });

  // 监听反击窗口打开，3秒后自动关闭
  watch(counterWindowOpen, (isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        if (counterWindowOpen.value) {
          closeCounterWindow();
        }
      }, 3000);
    }
  });

  return {
    titleClickCount,
    showCheatButton,
    getDecisionHintText,
    getLoadingText,
    canCounter,
    handleSkillUse,
    handleExecuteSkill,
    handleTitleClick,
    handleCheat,
    handleCounterSkill,
    handleManaModeToggle
  };
}