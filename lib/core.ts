/**
 * 核心纯函数库：契约类型、枚举中文、三态、通用工具。
 *
 * 参考契约：
 * - 枚举中文结构：server/app/data/enums.json（{ category: { code: 中文 } }）
 * - 类型与 DTO：server/app/schemas/contracts.py、xingxun-responsive-prototype/js/api/contracts.js
 *
 * 本模块不依赖 wx / getApp，保持纯函数，便于单测与快照。
 */

// ---------- 契约类型（对应 server/app/schemas/contracts.py） ----------

export type Domain = 'COFFEE' | 'COCKTAIL'
export type Unit = 'ML' | 'G' | 'PIECE' | 'LEAF' | 'DASH'
export type RadarOp = 'GTE' | 'LTE' | 'BETWEEN'

/** 三态筛选：未选 / 想要 / 排除 */
export type TriState = 'NONE' | 'WANT' | 'EXCLUDE'

/** enums.json 结构：{ category: { code: 中文 } } */
export type EnumsDict = Record<string, Record<string, string>>

/**
 * 内置枚举中文字典（与 server/app/data/enums.json 同构）。
 * 核心展示类目：domain/temperature/alcohol_state/caffeine_state/glassware/method/
 * unit/recipe_type/release_status/product_status/review_status/coffee_category/cocktail_category。
 * 页面展示枚举一律查中文，不硬编码 code。
 */
export const ENUMS_DICT: EnumsDict = {
  domain: { COFFEE: '咖啡', COCKTAIL: '鸡尾酒' },
  temperature: { HOT: '热饮', COLD: '冷饮', VARIABLE: '可变温度' },
  alcohol_state: {
    NONE: '无酒精',
    CONTAINS: '含酒精',
    VARIABLE: '酒精度可变',
    UNKNOWN: '酒精度未知',
  },
  caffeine_state: {
    NONE: '不含咖啡因',
    CONTAINS: '含咖啡因',
    VARIABLE: '咖啡因含量可变',
    UNKNOWN: '咖啡因含量未知',
  },
  unit: { ML: '毫升', G: '克', PIECE: '个/片', LEAF: '叶', DASH: '滴（微量）' },
  recipe_type: { CANONICAL: '默认配方', VARIANT: '变体配方' },
  glassware: {
    COCKTAIL: '鸡尾酒杯',
    MARTINI: '马天尼杯',
    COUPE: '碟形杯',
    OLD_FASHIONED: '古典杯',
    ROCKS: '岩石杯',
    HIGHBALL: '高球杯',
    COLLINS: '科林斯杯',
    PINT: '品脱杯',
    FLUTE: '笛形杯',
    COPPER_MUG: '铜马克杯',
    HURRICANE: '飓风杯',
    IRISH_COFFEE: '爱尔兰咖啡杯',
    JULEP_CUP: '朱利普杯',
  },
  method: {
    SHAKE: '摇和',
    STIR: '搅拌',
    BUILD: '直调',
    MUDDLE: '捣压',
    BLEND: '搅打',
  },
  release_status: {
    DRAFT: '草稿',
    VALIDATED: '已校验',
    ACTIVE: '已激活',
    RETIRED: '已下架',
    ROLLED_BACK: '已回滚',
  },
  product_status: { ACTIVE: '在售', RETIRED: '已下架' },
  review_status: {
    DRAFT: '草稿',
    IN_REVIEW: '审核中',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    ARCHIVED: '已归档',
  },
  coffee_category: {
    ESPRESSO_BASED: '浓缩基底',
    MILK_COFFEE: '奶咖',
    BLACK_COFFEE: '黑咖啡',
    COLD_COFFEE: '冷咖啡',
    POUR_OVER: '手冲',
    IMMERSION_BREW: '浸泡式',
    FLAVORED_COFFEE: '风味咖啡',
    REGIONAL_COFFEE: '地域特色咖啡',
    TEA_BASED_COFFEE: '茶咖',
  },
  cocktail_category: {
    SPIRIT_FORWARD: '烈酒主导',
    SOUR: '酸型鸡尾酒',
    COFFEE_COCKTAIL: '咖啡鸡尾酒',
    HIGHBALL: '高球',
    COLLINS: '科林斯',
    MARTINI: '马天尼',
    MANHATTAN: '曼哈顿',
    TIKI: '提基',
    FROZEN: '冰沙',
    CREAM: '奶油',
    FLIP: '翻转',
    BUCK: '雄鹿',
    SMASH: '碎冰',
    OLD_FASHIONED_FAMILY: '古典家族',
    BLOODY: '血腥玛丽类',
    COBBLER: '碎石',
    DAISY: '黛西',
    FIZZ: '菲兹',
    PUNCH: '潘趣',
    SWIZZLE: '旋转',
    SOUR_BASED: '酸基',
  },
  tag_category: {
    DOMAIN_CLASS: '领域分类',
    BASE: '基底',
    TEMPERATURE: '温度',
    TASTE: '味觉',
    FLAVOR: '风味',
    TEXTURE: '质地',
    METHOD: '技法',
    SCENE: '场景',
    DIETARY: '饮食',
    PRESENTATION: '呈现',
    STRENGTH: '强度',
  },
  ingredient_category: {
    COFFEE_BEAN: '咖啡豆',
    GARNISH: '装饰',
    WATER: '水',
    PREPARED_COFFEE: '成品咖啡',
    DAIRY: '乳制品',
    ICE: '冰',
    SPIRIT: '烈酒',
    LIQUEUR: '利口酒',
    FORTIFIED_WINE: '加烈葡萄酒',
    JUICE: '果汁',
    SEASONING: '调味',
    SWEETENER: '甜味剂',
    TEA_POWDER: '茶粉',
    PLANT_MILK: '植物奶',
    BITTERS: '苦精',
    FRUIT: '水果',
    VEGETABLE: '蔬菜',
    HERB: '香草',
    SPICE: '香料',
    WINE: '葡萄酒',
  },
}

export interface TagFilter {
  any?: string[]
  all?: string[]
  exclude?: string[]
}

export interface IngredientFilter {
  any?: string[]
  all?: string[]
  exclude?: string[]
}

export interface RadarCondition {
  dimension: string
  op: RadarOp
  value?: number | null
  min?: number | null
  max?: number | null
}

export interface SearchRequest {
  query?: string
  categories?: string[]
  ingredients?: IngredientFilter
  tags?: TagFilter
  radar?: RadarCondition[]
  ranges?: Record<string, unknown>
  /** 快速菜单筛选（5 分类 × ≤8 选项，{分类code: [选项label]}） */
  menu?: Record<string, string[]>
  /** 用户过敏原排除，如 MILK/TREE_NUTS */
  allergens_exclude?: string[]
  /** 用户明确排除的产品 code */
  exclude_codes?: string[]
  /** 未成年人模式：不推荐酒精 */
  underage?: boolean
  page?: number
  page_size?: number
}

/** 通用响应包装（xingxun-responsive-prototype/js/api/contracts.js ApiEnvelope） */
export interface ApiEnvelope<T> {
  code: string
  message: string
  data: T
  requestId: string
  serverTime: number
}

// ---------- 三态循环（templates.js：想要 → 排除 → 未选） ----------

const TRI_CYCLE: readonly TriState[] = ['NONE', 'WANT', 'EXCLUDE']

/**
 * 三态循环：NONE -> WANT -> EXCLUDE -> NONE。
 * @param current 当前状态（缺省视为 NONE）
 * @returns 下一个状态
 */
export function triState(current: TriState | null | undefined = 'NONE'): TriState {
  const idx = TRI_CYCLE.indexOf(current ?? 'NONE')
  return TRI_CYCLE[(idx + 1) % TRI_CYCLE.length]
}

// ---------- 枚举中文（enums.json 结构） ----------

/** 运行时枚举字典注册表；纯函数模式也可通过第三个参数显式传入 */
let enumsDict: EnumsDict = {}

export function setEnumsDict(dict: EnumsDict): void {
  enumsDict = dict || {}
}

/**
 * 查询枚举中文名。未命中回退原值（仅开发期可见）。
 * @param category enums.json 顶层分类，如 'domain' / 'temperature'
 * @param code     枚举 code，如 'COFFEE'
 * @param dict     可选显式字典（优先于注册表，便于纯函数测试）
 */
export function enumCn(
  category: string,
  code: string | null | undefined,
  dict?: EnumsDict,
): string {
  if (code === null || code === undefined || code === '') return ''
  const cat = (dict || enumsDict)[category]
  return (cat && cat[code]) || code
}

// ---------- 通用工具 ----------

export interface SafeArea {
  top: number
  right: number
  bottom: number
  left: number
}

/** 安全区兜底：无 safeArea 时返回全 0（调用方需处理自身边界） */
export function safeArea(
  systemInfo?: { safeArea?: SafeArea } | null,
): SafeArea {
  if (!systemInfo || !systemInfo.safeArea) {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }
  return { ...systemInfo.safeArea }
}

/**
 * px -> rpx 换算。小程序以 750rpx 为设计基准。
 * @param px              逻辑像素（基于 390px 设计宽，AGENT-HANDOFF 1 CSS px ≈ 1.923rpx）
 * @param screenWidthPx   设计宽度（默认 390，即原型黄金设计宽）
 */
export function px2rpx(px: number, screenWidthPx = 390): number {
  if (screenWidthPx <= 0) return px
  return (px / screenWidthPx) * 750
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
