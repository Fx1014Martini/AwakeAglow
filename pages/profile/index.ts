/**
 * 我的页（PAGE-SPEC §6，对齐原型 renderProfile）。
 * - 身份卡：store.profile（displayName/avatarText/preferences）或 service.getProfile 兜底；统计行并入身份卡
 * - 收藏预览：当前模式收藏前 3 个（读 store.favorites + service.listDrinks）
 * - 最近浏览：profile.history 映射当前模式饮品（前 3 个）
 * - 偏好筛选：咖啡/鸡尾酒偏好 chips（底部抽屉编辑并持久化）
 * - 推荐给我的 ✦：内联 mini-recommend 卡（当前模式列表首款，对齐原型 modeDrinks[0]）；
 *   「换一批 ↻」触发推荐弹层（对齐原型 runRecommendation('个性偏好') overlay），弹层内可「换一杯」
 * - 主题：根节点 data-mode 切换双主题（app.wxss view[data-mode]）+ 导航栏变色（lib/theme）
 */
import { store } from '../../stores/index'
import { service } from '../../services/index'
import { applyPageTheme } from '../../lib/theme'
import { imageErrorPatch } from '../../lib/image'
import { guardCocktailEntry } from '../../lib/age-gate'
import type { AppService } from '../../services/index'
import type {
  AppState,
  StoreMode,
} from '../../stores/index'
import type {
  DrinkSummary,
  FilterGroup,
  Profile,
  RecommendationResult,
} from '../../lib/contracts'

type PreferenceGroupView = Omit<FilterGroup, 'options'> & {
  options: Array<FilterGroup['options'][number] & { selected: boolean }>
}

interface ProfileStats {
  favorites: number
  history: number
  preferenceTags: number
}

interface ProfileData {
  mode: StoreMode
  profile: Partial<Profile>
  avatarText: string
  preferenceText: string
  stats: ProfileStats
  favoritePreview: DrinkSummary[]
  history: DrinkSummary[]
  preferenceTags: string[]
  /** 内联推荐卡（当前模式列表首款，对齐原型 modeDrinks[0]） */
  recommendCard: DrinkSummary | null
  /** 推荐弹层内容（换一批触发） */
  recommendation: RecommendationResult | null
  recommendPanelVisible: boolean
  preferencesPanelVisible: boolean
  preferenceGroups: PreferenceGroupView[]
  draftPreferences: string[]
  savingPreferences: boolean
  toastVisible: boolean
  toastContent: string
}

interface ProfileCustom {
  service: AppService
  /** 当前模式饮品列表缓存（收藏/历史/内联推荐数据源） */
  allDrinks?: DrinkSummary[]
  unsubscribe?: () => void
  /** 弹层内已展示过的推荐 id（换一杯排除用） */
  shownRecommendIds: string[]
  recommending: boolean
  loadAll(): void
  loadDrinks(mode: StoreMode): void
  applyState(state: AppState, profile: Profile | null): void
  refresh(): void
  runRecommendation(scene: string): Promise<void>
  onSwitchMode(e: WechatMiniprogram.CustomEvent): void
  onOpenDetail(e: WechatMiniprogram.TouchEvent): void
  onDrinkOpen(e: WechatMiniprogram.CustomEvent): void
  onDrinkFavorite(e: WechatMiniprogram.CustomEvent): Promise<void>
  onOpenFavorites(): void
  onEditPreferences(): void
  onClosePreferences(): void
  onTogglePreference(e: WechatMiniprogram.TouchEvent): void
  decoratePreferenceGroups(groups: FilterGroup[], selected: string[]): PreferenceGroupView[]
  onSavePreferences(): Promise<void>
  onRefreshRecommendation(): void
  onRecommendAgain(): void
  onCloseRecommend(): void
  onOpenRecommendDetail(): void
  showToast(content: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<ProfileData, ProfileCustom>({
  data: {
    mode: 'coffee',
    profile: {},
    avatarText: 'A',
    preferenceText: '',
    stats: { favorites: 0, history: 0, preferenceTags: 0 },
    favoritePreview: [],
    history: [],
    preferenceTags: [],
    recommendCard: null,
    recommendation: null,
    recommendPanelVisible: false,
    preferencesPanelVisible: false,
    preferenceGroups: [],
    draftPreferences: [],
    savingPreferences: false,
    toastVisible: false,
    toastContent: '',
  },

  service,

  allDrinks: [],
  shownRecommendIds: [],
  recommending: false,

  onLoad() {},

  onShow() {
    applyPageTheme(this)
    const tabbar = (this as any).getTabBar?.()
    if (tabbar) tabbar.setData({ selected: 3 })
    this.unsubscribe = store.subscribe(() => this.refresh())
    this.loadAll()
  },

  onHide() {
    this.unsubscribe?.()
  },

  onUnload() {
    this.unsubscribe?.()
  },

  loadAll() {
    const state = store.get()
    const mode = state.mode
    this.setData({ mode })
    // 身份卡：优先 store.profile；缺省时从服务端拉取并回填
    const profilePromise = state.profile
      ? Promise.resolve(state.profile)
      : this.service
          .getProfile()
          .then((profile) => {
            store.setProfile(profile)
            return profile
          })
          .catch(() => ({ id: 'v6-user', displayName: 'Awakener', avatarText: 'A', favorites: [], history: [], coffeePreferences: [], cocktailPreferences: [] } as Profile))

    profilePromise.then((profile) => {
      this.loadDrinks(mode)
      this.applyState(state, profile)
    })
  },

  /** 按 id 拉取当前模式收藏/历史详情（避免全量分页拉取 300 条） */
  async loadDrinks(_mode: StoreMode) {
    try {
      const state = store.get()
      const profile = state.profile
      const ids = [...new Set([...state.favorites, ...(profile?.history || [])])]
      const results = await Promise.all(ids.map(id => this.service.getDrinkDetail(id).catch(() => null)))
      this.allDrinks = results.filter(Boolean) as DrinkSummary[]
      const s = store.get()
      this.applyState(s, s.profile)
    } catch {
      this.allDrinks = []
    }
  },

  /** store 订阅触发：模式变化时重载，否则仅用缓存重新派生 */
  refresh() {
    const state = store.get()
    if (state.mode !== this.data.mode) {
      this.setData({ mode: state.mode, recommendPanelVisible: false, recommendation: null })
      this.shownRecommendIds = []
      this.loadAll()
      return
    }
    this.applyState(state, state.profile)
  },

  /** 统一渲染入口：由 store state + profile 派生页面数据 */
  applyState(state: AppState, profile: Profile | null) {
    const mode = state.mode
    const safe = profile || { id: 'v6-user', displayName: 'Awakener', avatarText: 'A', favorites: [], history: [], coffeePreferences: [], cocktailPreferences: [] }
    const preferenceTags = (mode === 'coffee' ? safe.coffeePreferences : safe.cocktailPreferences) || []
    const favIds = new Set(state.favorites)
    const historyIds = safe.history || []
    const list = this.allDrinks || []
    const avatarText = safe.avatarText || (safe.displayName ? safe.displayName.slice(0, 1) : 'A')
    const preferenceText = preferenceTags.join(' · ')

    const favoritePreview = list.filter((d) => favIds.has(d.id)).slice(0, 3)
    const history = list.filter((d) => historyIds.includes(d.id)).slice(0, 3)

    this.setData({
      profile: safe,
      avatarText,
      preferenceText,
      stats: {
        favorites: state.favorites.length,
        history: historyIds.length,
        preferenceTags: preferenceTags.length,
      },
      favoritePreview,
      history,
      preferenceTags,
      // 内联推荐卡：当前模式列表首款（对齐原型 modeDrinks[0]）
      recommendCard: list[0] || null,
    })
  },

  // ---------- 推荐弹层（对齐原型 runRecommendation + renderRecommendationOverlay） ----------

  /** 「换一批 ↻」：触发推荐弹层（scene=个性偏好） */
  onRefreshRecommendation() {
    this.shownRecommendIds = []
    this.runRecommendation('个性偏好')
  },

  /** 弹层内「换一杯」：排除已展示推荐再请求 */
  onRecommendAgain() {
    this.runRecommendation('换一杯')
  },

  async runRecommendation(scene: string) {
    if (this.recommending) return
    this.recommending = true
    try {
      const s = store.get()
      const prefs = s.mode === 'coffee' ? s.profile?.coffeePreferences : s.profile?.cocktailPreferences
      const excludedDrinkIds = this.shownRecommendIds.length ? [...this.shownRecommendIds] : undefined
      const result = await this.service.recommend({ mode: s.mode, scene, preferences: prefs, excludedDrinkIds })
      if (!result || !result.drink) {
        this.showToast('暂无匹配推荐，试试其他场景')
        return
      }
      if (!this.shownRecommendIds.includes(result.drink.id)) {
        this.shownRecommendIds = [...this.shownRecommendIds, result.drink.id]
      }
      this.setData({
        recommendation: result,
        recommendPanelVisible: true,
      })
    } catch (error) {
      this.showToast((error as Error)?.message || '推荐失败，请稍后重试')
    } finally {
      this.recommending = false
    }
  },

  onCloseRecommend() {
    this.setData({ recommendPanelVisible: false })
  },

  onOpenRecommendDetail() {
    const drink = this.data.recommendation?.drink
    if (!drink) return
    this.setData({ recommendPanelVisible: false })
    wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(drink.id)}` })
  },

  // ---------- 其它交互 ----------

  /** mode-switch 组件回调：切模式走 store，订阅刷新（refresh）会自动重载 */
  onSwitchMode(e: WechatMiniprogram.CustomEvent) {
    const mode = (e.detail as { mode?: string })?.mode as StoreMode | undefined
    if (!mode) return
    if (store.get().mode === mode) return
    if (mode === 'cocktail' && guardCocktailEntry()) return
    store.switchMode(mode)
  },

  onOpenDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  onDrinkOpen(e: WechatMiniprogram.CustomEvent) {
    const id = e.currentTarget?.dataset?.id as string
    if (id) wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  async onDrinkFavorite(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (!id) return
    const result = await store.toggleFavoriteLocal(id)
    this.showToast(result.ok ? (result.favorite ? '已收藏' : '已取消收藏') : '收藏操作失败')
  },

  onOpenFavorites() {
    // 收藏为 tabBar 页，须用 switchTab
    wx.switchTab({ url: '/pages/favorites/index' })
  },

  async onEditPreferences() {
    const mode = this.data.mode
    try {
      const taxonomies = await this.service.getTaxonomies()
      const groups = mode === 'coffee' ? taxonomies.coffee : taxonomies.cocktail
      const current = mode === 'coffee'
        ? this.data.profile.coffeePreferences || []
        : this.data.profile.cocktailPreferences || []
      this.setData({
        preferenceGroups: this.decoratePreferenceGroups(groups, current),
        draftPreferences: [...current],
        preferencesPanelVisible: true,
      })
    } catch {
      this.showToast('偏好选项加载失败，请稍后重试')
    }
  },

  onClosePreferences() {
    if (this.data.savingPreferences) return
    this.setData({ preferencesPanelVisible: false })
  },

  onTogglePreference(e: WechatMiniprogram.TouchEvent) {
    if (this.data.savingPreferences) return
    const value = String(e.currentTarget.dataset.value || '')
    if (!value) return
    const selected = new Set(this.data.draftPreferences)
    if (selected.has(value)) selected.delete(value)
    else selected.add(value)
    const draftPreferences = Array.from(selected)
    this.setData({
      draftPreferences,
      preferenceGroups: this.decoratePreferenceGroups(this.data.preferenceGroups, draftPreferences),
    })
  },

  decoratePreferenceGroups(groups: FilterGroup[], selected: string[]): PreferenceGroupView[] {
    const selectedSet = new Set(selected)
    return groups.map((group) => ({
      ...group,
      options: group.options.map((option) => ({ ...option, selected: selectedSet.has(option.value) })),
    }))
  },

  async onSavePreferences() {
    if (this.data.savingPreferences) return
    this.setData({ savingPreferences: true })
    try {
      const profile = await this.service.updatePreferences({ mode: this.data.mode, values: this.data.draftPreferences })
      store.setProfile(profile)
      this.setData({ preferencesPanelVisible: false, savingPreferences: false })
      this.showToast('偏好已保存')
    } catch (error) {
      this.setData({ savingPreferences: false })
      this.showToast((error as Error)?.message || '偏好保存失败，请稍后重试')
    }
  },

  showToast(content: string) {
    this.setData({ toastContent: content, toastVisible: true })
  },

  onToastHide() {
    this.setData({ toastVisible: false })
  },

  /** 产品图加载失败：换占位图（只 setData data-path 对应字段） */
  onImgError(e: WechatMiniprogram.CustomEvent) {
    const patch = imageErrorPatch(e)
    if (patch) this.setData(patch)
  },
})
