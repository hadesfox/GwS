// src/types/game.ts
// 📌 这个文件主要定义了整个五子棋游戏的“数据结构”和“技能配置”
// 它不处理逻辑，只负责把所有类型和静态数值统一定义好
// 这样其他逻辑文件（例如 useGobang.ts）就可以引用这些定义，保持代码干净和一致性

// 定义棋盘上的玩家类型
// black：黑方   white：白方   null：空格
export type Player = 'black' | 'white' | null;

// 游戏模式类型：
// basic => 普通五子棋
// professional => 连珠专业模式（带禁手、三手交换等）
export type GameMode = 'basic' | 'professional';

// 连珠规则下的阶段（专业模式才会用到）
export type ProfessionalPhase = 
  | 'normal'         // 正常对弈阶段
  | 'three-swap'     // 三手交换阶段（白方决定是否换边）
  | 'five-offer'     // 五手两打：黑方提供5个落点
  | 'five-choose';   // 白方选择其中1个作为落子点

// 棋盘上的位置坐标类型
export interface Position {
  row: number;   // 行
  col: number;   // 列
}

// 技能 ID 的枚举类型，方便逻辑判断（例如在代码里判断 skill.id === 'fly-sand'）
export type SkillType = 
  | 'fly-sand'        // 飞沙走石
  | 'still-water'     // 静如止水
  | 'mighty-power'    // 力拔山兮
  | 'comeback'        // 东山再起
  | 'capture'         // 擒擒又拿拿
  | 'diversion'       // 调呈离山
  | 'cleaner'         // 保洁上门
  | 'honesty'         // 拾金不昧
  | 'water-drop'      // 水滴石穿
  | 'reverse'         // 两极反转
  | 'see-you'         // see you again
  | 'earth-rotate'    // 地球自转母亲公转
  | 'cold-king';      // 冷酸灵智取王世昌

// 技能对象的结构定义
export interface Skill {
  id: SkillType;        // 技能唯一标识
  name: string;         // 技能名称（用于UI）
  description: string;  // 技能描述
  manaCost: number;     // 法力值消耗（💎）
  icon: string;         // UI上显示的图标
}

// 法力值状态结构
export interface ManaState {
  current: number;   // 当前法力值
  max: number;       // 最大法力值（默认30）
  moveCounter: number; // 用于记录走了多少步（决定什么时候回法力）
}

// 技能状态（玩家点击技能后的状态）
export interface SkillState {
  isSelecting: boolean;           // 是否正在选择技能目标
  skillType: SkillType | null;    // 当前选择的技能类型
  player: 'black' | 'white' | null; // 哪个玩家在用技能
  canCounter?: boolean;           // 是否能被反制（比如“力拔山兮”）
  counterTarget?: 'black' | 'white'; // 反制的目标
}

// 游戏整体状态结构
export interface GameState {
  board: Player[][];            // 棋盘（二维数组）
  currentPlayer: 'black' | 'white'; // 当前回合玩家
  winner: Player;               // 胜利者（null表示未分胜负）
  isGameOver: boolean;          // 游戏是否结束
  moveHistory: Position[];      // 历史落子记录
  mode: GameMode;               // 游戏模式
  professionalPhase?: ProfessionalPhase; // 专业模式下的阶段
  fiveOffers?: Position[];      // 五手两打阶段的5个备选点
  forbiddenMoves?: Position[];  // 专业模式禁手位置
  blackMana?: ManaState;        // 黑方法力状态
  whiteMana?: ManaState;        // 白方法力状态
}

// 棋盘大小：15 x 15
export const BOARD_SIZE = 15;

// 连珠规则胜利条件：5连
export const WIN_COUNT = 5;

// 最大法力值（两方共享上限）
export const MAX_MANA = 30;

// 每获得1点法力需要的走子步数（默认2）
export const MOVES_PER_MANA = 2;

// 棋型结构（连珠判断时用）
export interface Pattern {
  count: number;                // 连成几子
  openEnds: number;             // 活口数
  type: 'live' | 'dead' | 'half'; // 棋型类型（活、死、半活）
}

// 🎯 技能配置列表（这是最重要的一段！！！）
// 所有技能的法力值消耗、名称、效果描述都在这里定义
// 改 manaCost 就能同步影响 UI、技能释放与扣法力
export const SKILLS: Skill[] = [
  {
    id: 'fly-sand',
    name: '飞沙走石',
    description: '移除棋盘上的任意一个棋子',
    manaCost: 3,
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
    manaCost: 2,
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
    manaCost: 2,
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
    description: '扫描对方硬盘读取黑历史',
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