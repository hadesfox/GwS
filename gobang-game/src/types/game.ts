// src/types/game.ts

export type Player = 'black' | 'white' | null;
export type GameMode = 'basic' | 'professional';
export type ProfessionalPhase = 
  | 'normal'
  | 'three-swap'
  | 'five-offer'
  | 'five-choose';

export interface Position {
  row: number;
  col: number;
}

// 技能类型
export type SkillType = 
  | 'fly-sand'      // 飞沙走石
  | 'still-water'   // 静如止水
  | 'mighty-power'  // 力拔山兮
  | 'comeback'      // 东山再起
  | 'capture'       // 擒擒又拿拿
  | 'diversion'     // 调呈离山
  | 'cleaner'       // 保洁上门
  | 'honesty'       // 拾金不昧
  | 'water-drop'    // 水滴石穿
  | 'reverse'       // 两级反转
  | 'see-you'       // see you again

// 技能定义
export interface Skill {
  id: SkillType;
  name: string;
  description: string;
  manaCost: number;
  icon: string;
}

// 玩家法力值状态
export interface ManaState {
  current: number;
  max: number;
  moveCounter: number;
}

// 技能选择状态
export interface SkillState {
   isSelecting: boolean;
  skillType: SkillType | null;
  player: 'black' | 'white' | null;
  canCounter?: boolean;  // 新增：是否可以反制
  counterTarget?: 'black' | 'white';  // 新增：反制的目标玩家
}

export interface GameState {
  board: Player[][];
  currentPlayer: 'black' | 'white';
  winner: Player;
  isGameOver: boolean;
  moveHistory: Position[];
  mode: GameMode;
  professionalPhase?: ProfessionalPhase;
  fiveOffers?: Position[];
  forbiddenMoves?: Position[];
  blackMana?: ManaState;
  whiteMana?: ManaState;
  skillState?: SkillState;
}

export const BOARD_SIZE = 15;
export const WIN_COUNT = 5;
export const MAX_MANA = 30;
export const MOVES_PER_MANA = 2;

// 棋型定义
export interface Pattern {
  count: number;
  openEnds: number;
  type: 'live' | 'dead' | 'half';
}

// 技能列表
export const SKILLS: Skill[] = [
  {
    id: 'fly-sand',
    name: '飞沙走石',
    description: '移除棋盘上的任意一个棋子',
    manaCost: 2,
    icon: '🌪️'
  },
  {
    id: 'still-water',
    name: '静如止水',
    description: '让对方暂停一回合，自己多走一步',
    manaCost: 5,
    icon: '💧'
  },
  {
    id: 'mighty-power',
    name: '力拔山兮',
    description: '清空所有棋子，并获得胜利',
    manaCost: 15,
    icon: '💪'
  },
  {
    id: 'comeback',
    name: '东山再起',
    description: '反制力拔山兮，让对局继续进行，棋子随机摆放',
    manaCost: 13,
    icon: '🔄'
  },
  {
    id: 'capture',
    name: '擒擒又拿拿',
    description: '让对方在两回合内禁止使用飞沙走石',
    manaCost: 3,
    icon: '✊'
  },
  {
    id: 'diversion',
    name: '调呈离山',
    description: '让对方暂停三回合',
    manaCost: 10,
    icon: '🎯'
  },
  {
    id: 'cleaner',
    name: '保洁上门',
    description: '选择相邻的三行棋子清空',
    manaCost: 7,
    icon: '🧹'
  },
  {
    id: 'honesty',
    name: '拾金不昧',
    description: '对方使用飞沙走石时可用，将消失的棋子捡回来',
    manaCost: 4,
    icon: '💰'
  },
  {
    id: 'water-drop',
    name: '水滴石穿',
    description: '清空对方最后下的一步棋（静如止水生效时可用）',
    manaCost: 7,
    icon: '💦'
  },
  {
    id: 'reverse',
    name: '两极反转',
    description: '在对方画面显示假的文件读取进度条，持续两回合',
    manaCost: 15,
    icon: '🔃'
  },
  {
    id: 'see-you',
    name: 'see you again',
    description: '直接获得胜利',
    manaCost: 30,
    icon: '👋'
  },
  {
    id: 'earth-rotate',
    name: '地球自转母亲公转',
    description: '技能描述待定',
    manaCost: 20,
    icon: '🌍'
  },
  {
    id: 'cold-king',
    name: '冷酸灵智取王世昌',
    description: '技能描述待定',
    manaCost: 25,
    icon: '❄️'
  }
];