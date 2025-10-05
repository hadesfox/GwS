// src/types/game.ts

export type Player = "black" | "white" | null;
export type GameMode = "basic" | "professional";
export type ProfessionalPhase =
  | "normal"
  | "three-swap"
  | "five-offer"
  | "five-choose";

export interface Position {
  row: number;
  col: number;
}

// **新增：技能类型**
export type SkillType =
  | "fly-sand" // 飞沙走石
  | "still-water" // 静如止水
  | "mighty-power" // 力拔山兮
  | "comeback" // 东山再起
  | "capture" // 擒擒又拿拿
  | "diversion" // 调呈离山
  | "cleaner" // 保洁上门
  | "honesty" // 拾金不昧
  | "water-drop" // 水滴石穿
  | "reverse" // 两级反转
  | "see-you"; // see you again

// **新增：技能定义**
export interface Skill {
  id: SkillType;
  name: string;
  description: string;
  manaCost: number;
  icon: string;
}

// **新增：玩家法力值状态**
export interface ManaState {
  current: number; // 当前法力值
  max: number; // 最大法力值
  moveCounter: number; // 移动计数器（每2步获得1法力）
}

export interface GameState {
  board: Player[][];
  currentPlayer: "black" | "white";
  winner: Player;
  isGameOver: boolean;
  moveHistory: Position[];
  mode: GameMode;
  professionalPhase?: ProfessionalPhase;
  fiveOffers?: Position[];
  forbiddenMoves?: Position[];
  blackMana?: ManaState; // **新增：黑方法力值**
  whiteMana?: ManaState; // **新增：白方法力值**
}

export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;
export const MAX_MANA = 30; // **新增：最大法力值**
export const MOVES_PER_MANA = 2; // **新增：每2步获得1法力**

// **新增：技能列表**
export const SKILLS: Skill[] = [
  {
    id: "fly-sand",
    name: "飞沙走石",
    description: "技能描述待定",
    manaCost: 3,
    icon: "🌪️",
  },
  {
    id: "still-water",
    name: "静如止水",
    description: "技能描述待定",
    manaCost: 2,
    icon: "💧",
  },
  {
    id: "mighty-power",
    name: "力拔山兮",
    description: "技能描述待定",
    manaCost: 5,
    icon: "💪",
  },
  {
    id: "comeback",
    name: "东山再起",
    description: "技能描述待定",
    manaCost: 4,
    icon: "🔄",
  },
  {
    id: "capture",
    name: "擒擒又拿拿",
    description: "技能描述待定",
    manaCost: 3,
    icon: "✊",
  },
  {
    id: "diversion",
    name: "调呈离山",
    description: "技能描述待定",
    manaCost: 4,
    icon: "🎯",
  },
  {
    id: "cleaner",
    name: "保洁上门",
    description: "技能描述待定",
    manaCost: 5,
    icon: "🧹",
  },
  {
    id: "honesty",
    name: "拾金不昧",
    description: "技能描述待定",
    manaCost: 2,
    icon: "💰",
  },
  {
    id: "water-drop",
    name: "水滴石穿",
    description: "技能描述待定",
    manaCost: 6,
    icon: "💦",
  },
  {
    id: "reverse",
    name: "两级反转",
    description: "技能描述待定",
    manaCost: 8,
    icon: "🔃",
  },
  {
    id: "see-you",
    name: "see you again",
    description: "技能描述待定",
    manaCost: 10,
    icon: "👋",
  },
];
