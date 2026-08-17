/**
 * 全局状态层（store）。
 *
 * 参考：
 * - 原型 store：xingxun-responsive-prototype/js/core/store.js（Store extends EventTarget + 持久化字段排除运行时字段）
 * - 交互文档：xingxun-responsive-prototype/docs/INTERACTIONS.md（切换模式保留该模式筛选 / 收藏乐观更新失败回滚）
 * - V1 store：miniprogram/stores/index.js（领域切换、筛选状态）
 * - 数据层：services/index.ts（AppService：页面只依赖统一 Service 接口，不直接 wx.request）
 *
 * 设计要点：
 * - Store 类 + 模块级单例 `store`（页面用单例，测试可注入 serviceOverride）。
 * - 三态筛选（NONE→WANT→EXCLUDE）复用 lib/core.ts 的 triState 纯函数。
 * - 持久化只写 mode/filters/keyword/favorites/profile/compareIds，route/detailTab 属运行时字段不落盘。
 * - 收藏切换：先调 service.toggleFavorite → 成功以服务端 favorites 为准更新；失败不改状态（对齐 COMPONENT-SPEC「失败不做乐观状态残留」）。
 * - 订阅：subscribe(listener) 返回退订函数；set/update 后广播最新 state。
 */

import { triState, type TriState } from '../lib/core'
import type { Profile } from '../lib/contracts'
import { service as globalService } from '../services/index'
import type { AppService } from '../services/index'

export type StoreMode = 'coffee' | 'cocktail'
export type DetailTab = 'overview' | 'recipe' | 'radar' | 'similar'
export type ComparePair = [string, string]
export type CompareIds = Record<StoreMode, ComparePair>
/** 单个筛选分类：{ 选项 -> 三态 }，如 { '燕麦奶': 'WANT', '奶油': 'EXCLUDE' } */
export type FilterCategory = Record<string, TriState>
/** 当前模式全部筛选：{ 分类 key -> FilterCategory } */
export type FilterState = Record<string, FilterCategory>
/** 双模式筛选：{ coffee: {...}, cocktail: {...} } */
export type FiltersState = Record<StoreMode, FilterState>

export type ProfileState = Profile

export interface AppState {
  /** 当前领域模式 */
  mode: StoreMode
  /** 当前页面（运行时字段，不持久化） */
  route: string
  /** 双模式各自的三态筛选 */
  filters: FiltersState
  /** 搜索关键词 */
  keyword: string
  /** 详情页签（对齐原型：持久化字段） */
  detailTab: DetailTab
  /** 收藏 id 列表（与 profile.favorites 保持同步） */
  favorites: string[]
  /** 个人档案（未加载为 null） */
  profile: ProfileState | null
  /** 双模式对比组 */
  compareIds: CompareIds
  /** 鸡尾酒成年门禁确认态（持久化；咖啡模式不受影响） */
  ageConfirmed: boolean
  /** 待触发的首页推荐场景（运行时字段，不持久化）：发现页场景卡片点击后写入，首页 onShow 消费后清空 */
  pendingScene: string
}

/** 收藏切换结果：页面据此决定是否 Toast */
export type FavoriteResult =
  | { ok: true; favorite: boolean; favorites: string[] }
  | { ok: false; error: unknown }

const STORAGE_KEY = 'awakeaglow:v6:miniprogram:store:v1'

const DEFAULT_COMPARE_IDS: CompareIds = {
  coffee: ['coffee-oat-latte', 'coffee-cold-brew'],
  // cosmopolitan 不在 V6 数据库中，改用存在的经典组合（negroni vs mojito）
  cocktail: ['cocktail-negroni', 'cocktail-mojito'],
}

const initialState: AppState = {
  mode: 'coffee',
  route: 'home',
  filters: { coffee: {}, cocktail: {} },
  keyword: '',
  detailTab: 'overview',
  favorites: [],
  profile: null,
  compareIds: DEFAULT_COMPARE_IDS,
  ageConfirmed: false,
  pendingScene: '',
}

// ---------- 持久化 ----------

function canPersist(): boolean {
  return typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function'
}

function loadPersisted(): Partial<AppState> {
  if (!canPersist()) return {}
  try {
    const raw = wx.getStorageSync(STORAGE_KEY)
    if (!raw) return {}
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return parsed && typeof parsed === 'object' ? (parsed as Partial<AppState>) : {}
  } catch {
    return {}
  }
}

function validPair(pair: unknown): pair is ComparePair {
  return Array.isArray(pair) && pair.length === 2 && pair.every((v) => typeof v === 'string')
}

/** 只持久化业务字段（对齐原型 persist 排除清单；route 由小程序页面栈管理不落盘） */
function persistState(state: AppState): void {
  if (!canPersist()) return
  try {
    wx.setStorageSync(STORAGE_KEY, {
      mode: state.mode,
      filters: state.filters,
      keyword: state.keyword,
      detailTab: state.detailTab,
      favorites: state.favorites,
      profile: state.profile,
      compareIds: state.compareIds,
      ageConfirmed: state.ageConfirmed,
    })
  } catch {
    // 存储失败不阻塞运行（如隐私模式/容量不足）
  }
}

function validDetailTab(value: unknown): DetailTab | undefined {
  return value === 'overview' || value === 'recipe' || value === 'radar' || value === 'similar' ? value : undefined
}

function hydrate(): AppState {
  const saved = loadPersisted()
  return {
    mode: saved.mode === 'cocktail' ? 'cocktail' : 'coffee',
    route: initialState.route,
    filters: {
      coffee: { ...(saved.filters?.coffee || {}) },
      cocktail: { ...(saved.filters?.cocktail || {}) },
    },
    keyword: typeof saved.keyword === 'string' ? saved.keyword : '',
    detailTab: validDetailTab(saved.detailTab) || initialState.detailTab,
    favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
    profile: saved.profile && typeof saved.profile === 'object' ? (saved.profile as ProfileState) : null,
    compareIds: {
      coffee: validPair(saved.compareIds?.coffee) ? saved.compareIds.coffee : initialState.compareIds.coffee,
      cocktail: validPair(saved.compareIds?.cocktail) ? saved.compareIds.cocktail : initialState.compareIds.cocktail,
    },
    ageConfirmed: saved.ageConfirmed === true,
    pendingScene: '',
  }
}

type StoreListener = (state: AppState) => void

interface SetOptions {
  persist?: boolean
}

// ---------- Store ----------

export class Store {
  private _state: AppState
  private listeners = new Set<StoreListener>()
  private service: AppService

  constructor(serviceOverride?: AppService) {
    this._state = hydrate()
    this.service = serviceOverride || globalService
  }

  get state(): AppState {
    return this._state
  }

  get(): AppState {
    return this._state
  }

  /** 打补丁更新状态；默认持久化，persist:false 跳过落盘（运行时字段用） */
  set(patch: Partial<AppState>, options: SetOptions = {}): void {
    const persist = options.persist !== false
    this._state = { ...this._state, ...patch }
    if (persist) this.persist()
    this.notify()
  }

  /** 以当前 state 派生新补丁 */
  update(updater: (state: AppState) => Partial<AppState>, options: SetOptions = {}): void {
    this.set(updater(this._state), options)
  }

  /** 订阅状态变更，返回退订函数 */
  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this._state)
      } catch {
        // 单个监听异常不影响其它订阅者
      }
    })
  }

  private persist(): void {
    persistState(this._state)
  }

  // ---------- 操作 ----------

  /**
   * 切换领域模式：保留该模式的 filters，但清空跨模式无关的搜索关键词与详情页签
   * （对齐原型 app.js:161 switchMode）。keyword 属全局字段，detailTab 运行时字段一并复位。
   */
  switchMode(mode: StoreMode): void {
    this.update(() => ({ mode, keyword: '', detailTab: 'overview' }))
  }

  /** 三态循环筛选：NONE -> WANT -> EXCLUDE -> NONE（作用于当前模式） */
  cycleFilter(key: string, option: string): void {
    const mode = this._state.mode
    const category = this._state.filters[mode]
    const current: TriState = category[key]?.[option] || 'NONE'
    const next = triState(current)
    this.update((s) => ({
      filters: {
        ...s.filters,
        [mode]: {
          ...s.filters[mode],
          [key]: { ...(s.filters[mode][key] || {}), [option]: next },
        },
      },
    }))
  }

  /** 清空当前模式的筛选 */
  resetFilters(): void {
    const mode = this._state.mode
    this.update((s) => ({
      filters: { ...s.filters, [mode]: {} },
    }))
  }

  setKeyword(keyword: string): void {
    this.set({ keyword })
  }

  /** 详情页签（对齐原型：detailTab 属持久化字段） */
  setDetailTab(tab: DetailTab): void {
    this.set({ detailTab: tab })
  }

  setProfile(profile: ProfileState | null): void {
    this.set({ profile })
  }

  setCompareIds(ids: CompareIds): void {
    this.set({ compareIds: ids })
  }

  /** 成年门禁确认（单向：只可置 true，不提供清除入口，避免误绕过） */
  confirmAge(): void {
    if (!this._state.ageConfirmed) this.set({ ageConfirmed: true })
  }

  /**
   * 当前是否需要成年门禁：目标模式为鸡尾酒且尚未确认。
   * @param mode 目标领域（缺省取当前 state.mode）。注意：从 coffee 切往 cocktail 时
   *   必须显式传 'cocktail'（此时 store.mode 仍是 coffee），guardCocktailEntry 的
   *   调用方均已自行判 mode，此参数用于显式表达意图。
   */
  needsAgeGate(mode: StoreMode = this._state.mode): boolean {
    return mode === 'cocktail' && !this._state.ageConfirmed
  }

  /** 写入待触发的首页推荐场景（运行时字段，不持久化） */
  setPendingScene(scene: string): void {
    this.set({ pendingScene: scene }, { persist: false })
  }

  /** 消费并清空待触发的首页推荐场景；返回场景名或空串 */
  consumePendingScene(): string {
    const scene = this._state.pendingScene
    if (scene) this.set({ pendingScene: '' }, { persist: false })
    return scene
  }

  /**
   * 收藏切换（顺序更新）：先调 service.toggleFavorite，成功后才更新本地 favorites/profile.favorites；
   * 失败不改状态，仅返回 {ok:false,error} 由页面 Toast（对齐 COMPONENT-SPEC「失败不做乐观状态残留」）。
   * 返回形状保持 {ok,favorite?,favorites?}，favorites/detail/profile 页调用无需改动。
   */
  async toggleFavoriteLocal(id: string): Promise<FavoriteResult> {
    try {
      const result = await this.service.toggleFavorite(id)
      this.applyFavorites(result.favorites)
      return { ok: true, favorite: result.favorite, favorites: result.favorites }
    } catch (error) {
      return { ok: false, error }
    }
  }

  private applyFavorites(favorites: string[]): void {
    const profile = this._state.profile
    this.set({
      favorites,
      profile: profile ? { ...profile, favorites } : profile,
    })
  }
}

/** 模块级单例：页面统一从这里取状态 */
export const store: Store = new Store()

export { STORAGE_KEY }
export default store
