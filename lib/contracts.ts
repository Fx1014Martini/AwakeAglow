/**
 * 冻结契约 TypeScript 类型（唯一事实来源：openapi/openapi.yaml，决策附录 openapi/DECISIONS.md）。
 *
 * 纪律（DECISIONS §7 归一化纪律）：
 * - 雷达分数对外一律 0-10；标签对外一律中文 label；前端不做二次换算/二次本地化。
 * - 契约形状即视图模型：RealService 薄映射不做字段翻译，MockService 与页面直接消费本文件类型。
 * - drinkId 直接复用产品 code（coffee-* / cocktail-*），全域唯一（DECISIONS §1）。
 */

// ---------- 基础枚举 ----------

/** 领域模式（契约 DrinkMode） */
export type DrinkMode = 'coffee' | 'cocktail'

/** 领域分类（契约 DrinkSummary.category） */
export type DrinkCategory = 'COFFEE' | 'COCKTAIL'

/** 原料单位（契约 Ingredient.unit） */
export type IngredientUnit = 'ml' | 'g' | 'piece' | 'dash'

/** 数据来源等级（契约 DrinkDetail.sourceInfo.sourceLevel） */
export type SourceLevel = 'A' | 'B' | 'C'

// ---------- 信封 ----------

/** 成功信封：{code,message,data,requestId,serverTime}，code==='0' 表示成功 */
export interface Envelope<T = unknown> {
  code: string
  message: string
  data: T
  requestId: string
  serverTime: number
}

/** 失败信封：code 取值 DRINK_NOT_FOUND / COMPARE_REQUIRES_TWO / REQUEST_TIMEOUT 等（DECISIONS §6） */
export interface ErrorEnvelope {
  code: string
  message: string
  details?: Record<string, unknown>
  requestId: string
  serverTime: number
}

// ---------- 筛选字典 ----------

/** 单个筛选选项（契约 FilterOption） */
export interface FilterOption {
  value: string
  label: string
  /** 缺省视为可用 */
  enabled?: boolean
}

/** 筛选分组（契约 FilterGroup） */
export interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
}

/** 咖啡与鸡尾酒筛选字典（契约 Taxonomies） */
export interface Taxonomies {
  coffee: FilterGroup[]
  cocktail: FilterGroup[]
}

// ---------- 饮品 ----------

/** 雷达指标（契约 RadarMetric，score 0-10） */
export interface RadarMetric {
  key: string
  label: string
  score: number
}

/** 配方原料（契约 Ingredient） */
export interface Ingredient {
  nameZh: string
  nameEn: string
  amount: number
  unit: IngredientUnit
  role?: string
}

/**
 * 推导属性（契约 attributes：oneOf [string, string[]]，全中文 label）。
 * 咖啡键：coffeeType/milk/sweetBitter/temperature/caffeine/scene；
 * 鸡尾酒键：baseSpirit/cocktailType/flavor/abv/extra/scene（DECISIONS §2）。
 * 注意 extra 同键两型（字符串兜底 / 数组取值，DECISIONS 附录 A-3），前端需双型兼容。
 */
export type DrinkAttributes = Record<string, string | string[]>

/** 列表卡片（契约 DrinkSummary） */
export interface DrinkSummary {
  id: string
  mode: DrinkMode
  category: DrinkCategory
  nameZh: string
  nameEn: string
  intro: string
  imageUrl: string
  /** 首页/详情 Hero 使用的本地或服务端海报，列表仍使用 imageUrl。 */
  posterUrl?: string
  /** 中文标签（归一化纪律：枚举 code 不暴露给页面） */
  tags: string[]
  /** 适合场景（中文 label 数组，复制到卡片顶层，DECISIONS §4） */
  scene?: string[]
  /** 推荐指数 0-100（启发式指数，非评分，DECISIONS §3） */
  recommendationScore: number
  attributes: DrinkAttributes
}

/** 来源信息（契约 sourceInfo） */
export interface SourceInfo {
  sourceLevel: SourceLevel
  /** YYYY-MM-DD */
  updatedAt: string
  reviewed: boolean
}

/** 详情（契约 DrinkDetail = DrinkSummary + 详情扩展） */
export interface DrinkDetail extends DrinkSummary {
  description: string
  posterUrl: string
  ingredients: Ingredient[]
  steps: string[]
  radar: RadarMetric[]
  similarIds: string[]
  /** 相似候选摘要（可选内联） */
  similar?: DrinkSummary[]
  sourceInfo: SourceInfo
}

/** 搜索分页（契约 DrinkPage） */
export interface DrinkPage {
  items: DrinkSummary[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

// ---------- 搜索 ----------

/**
 * 三态筛选条件：Record<filterKey, {want, exclude}>。
 * 传输层序列化为 JSON 字符串放入 GET /drinks 的 filters query 参数（契约口径）。
 */
export type DrinkFilters = Record<string, { want?: string[]; exclude?: string[] }>

/** GET /drinks 查询参数（契约 listDrinks） */
export interface ListDrinksQuery {
  mode: DrinkMode
  keyword?: string
  filters?: DrinkFilters
  sort?: 'recommendation' | 'name'
  page?: number
  pageSize?: number
}

// ---------- 推荐 / 对比 ----------

/** POST /recommendations 请求体（契约 RecommendationRequest） */
export interface RecommendationRequest {
  mode: DrinkMode
  scene?: string
  preferences?: string[]
  /** 「换一杯」：排除已展示过的 drinkId */
  excludedDrinkIds?: string[]
}

/** 推荐结果（契约 RecommendationResult） */
export interface RecommendationResult {
  drink: DrinkDetail
  /** 至少 1 条推荐理由 */
  reasons: string[]
}

/** POST /comparisons 请求体（drinkIds 恰好 2 个） */
export interface CompareRequest {
  drinkIds: string[]
}

/** 对比结果（契约 comparisons.data） */
export interface CompareResult {
  items: DrinkDetail[]
  conclusion: string[]
}

// ---------- 用户 ----------

/** 个人档案（契约 Profile） */
export interface Profile {
  id: string
  displayName: string
  avatarUrl?: string
  /** 头像占位字符（≤2） */
  avatarText?: string
  favorites: string[]
  history: string[]
  coffeePreferences: string[]
  cocktailPreferences: string[]
}

/** PUT /profile/preferences 请求体 */
export interface UpdatePreferencesRequest {
  mode: DrinkMode
  values: string[]
}

/** POST /favorites/{drinkId}/toggle 结果 */
export interface FavoriteToggleResult {
  favorite: boolean
  favorites: string[]
}

// ---------- Bootstrap ----------

/** GET /bootstrap data：首屏初始化（taxonomies + profile + featured） */
export interface BootstrapData {
  taxonomies: Taxonomies
  profile: Profile
  featured: DrinkSummary[]
}
