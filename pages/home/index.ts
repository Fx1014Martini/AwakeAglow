/**
 * 首页（对齐原型 templates.js renderHome + app.js 交互）。
 * - mode-switch 在 home-intro 内，切换主题与推荐内容
 * - search：真 input，220ms 防抖非空则跳菜单（app.js global-keyword）
 * - 场景 chip：点击设选中 + runRecommendation（app.js scene-chip）
 * - 推荐这杯 -> runRecommendation(scene) -> 居中 overlay 展示结果
 * - 换一杯 -> runRecommendation('换一杯')
 * - 更多推荐 -> switchTab 菜单
 * 数据访问只走 services/ 层单例 service，页面不直接 wx.request。
 */
import { service } from '../../services/index'
import { store } from '../../stores/index'
import { applyPageTheme } from '../../lib/theme'
import { imageErrorPatch } from '../../lib/image'
import { guardCocktailEntry } from '../../lib/age-gate'

type HomeMode = 'coffee' | 'cocktail'

interface HomeConfig {
  eyebrow: string
  title: string
  lead: string
  placeholder: string
  recommendSub: string
  secondTitle: string
}

const PAGE_CONFIG: Record<HomeMode, HomeConfig> = {
  coffee: {
    eyebrow: 'GOOD MORNING · CLEAR MIND',
    title: '早安，今天想喝点什么？',
    lead: '根据时间、心情与场景，为你推荐最合适的一杯',
    placeholder: '搜索咖啡名称 / 风味 / 场景',
    recommendSub: '今日清醒选择',
    secondTitle: '清爽备选',
  },
  cocktail: {
    eyebrow: 'GOOD NIGHT · SOFT GLOW',
    title: '今晚，想来点什么？',
    lead: '根据时间、心情与场景，为你推荐最合适的一杯',
    placeholder: '搜索酒名 / 风味 / 场景',
    recommendSub: '今夜微醺选择',
    secondTitle: '轻松备选',
  },
}

interface HomeData {
  mode: HomeMode
  keyword: string
  eyebrow: string
  title: string
  lead: string
  searchPlaceholder: string
  scenes: string[]
  activeScene: string
  recommendSub: string
  secondTitle: string
  featured: any
  second: any
  recommendPanelVisible: boolean
  recommend: any
  toastShow: boolean
  toastText: string
  loading: boolean
}

interface HomeCustom {
  unsubscribe: (() => void) | null
  searchTimer: ReturnType<typeof setTimeout> | null
  recommending: boolean
  drinks: any[]
  shownDrinkIds: string[]
  scenes: { coffee: string[]; cocktail: string[] }
  loadBootstrap(): void
  syncFromStore(): void
  pickFeatured(): any
  pickSecond(): any
  withFavorite(drink: any, favorites: string[]): any
  onSwitchMode(e: WechatMiniprogram.CustomEvent): void
  onSearchInput(e: WechatMiniprogram.Input): void
  onSearchConfirm(e: WechatMiniprogram.Input): void
  goMenu(keyword: string): void
  onSceneChip(e: WechatMiniprogram.TouchEvent): void
  onRecommendThis(): void
  onRecommendAgain(): void
  runRecommendation(scene: string): Promise<void>
  onCloseRecommend(): void
  onOpenRecommendDetail(): void
  onToggleFavorite(e: WechatMiniprogram.CustomEvent): Promise<void>
  onOpenDetail(e: WechatMiniprogram.CustomEvent): void
  onMoreRecommend(): void
  showToast(text: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<HomeData, HomeCustom>({
  data: {
    mode: 'coffee',
    keyword: '',
    eyebrow: PAGE_CONFIG.coffee.eyebrow,
    title: PAGE_CONFIG.coffee.title,
    lead: PAGE_CONFIG.coffee.lead,
    searchPlaceholder: PAGE_CONFIG.coffee.placeholder,
    scenes: [],
    activeScene: '',
    recommendSub: PAGE_CONFIG.coffee.recommendSub,
    secondTitle: PAGE_CONFIG.coffee.secondTitle,
    featured: { tags: [], favorite: false, recommendationScore: 0 },
    second: null,
    recommendPanelVisible: false,
    recommend: { drink: { tags: [] }, reasons: [] },
    toastShow: false,
    toastText: '',
    loading: true,
  },

  unsubscribe: null,
  searchTimer: null,
  recommending: false,
  drinks: [],
  shownDrinkIds: [],
  scenes: { coffee: [], cocktail: [] } as { coffee: string[]; cocktail: string[] },

  onLoad() {
    this.unsubscribe = store.subscribe(() => this.syncFromStore())
    this.syncFromStore()
    this.loadBootstrap()
  },

  onShow() {
    if (store.get().mode === 'cocktail' && store.needsAgeGate()) {
      // 延迟到启动流程完成后再跳门禁，避免 appLaunch 期间 navigateTo 干扰页面栈
      setTimeout(() => guardCocktailEntry('/pages/home/index'), 0)
      return
    }
    applyPageTheme(this)
    const tabbar = (this as any).getTabBar?.()
    if (tabbar) tabbar.setData({ selected: 0 })
    // 消费发现页写入的待触发场景：设 activeScene + 调推荐
    const pendingScene = store.consumePendingScene()
    if (pendingScene) {
      this.setData({ activeScene: pendingScene })
      this.runRecommendation(pendingScene)
    }
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  // ---------- store 同步 ----------

  syncFromStore() {
    const s = store.get()
    const mode: HomeMode = s.mode === 'cocktail' ? 'cocktail' : 'coffee'
    const cfg = PAGE_CONFIG[mode]
    const modeScenes = (this.scenes && this.scenes[mode]) || []
    const patch: Partial<HomeData> = {
      mode,
      keyword: s.keyword,
      eyebrow: cfg.eyebrow,
      title: cfg.title,
      lead: cfg.lead,
      searchPlaceholder: cfg.placeholder,
      scenes: modeScenes,
      recommendSub: cfg.recommendSub,
      secondTitle: cfg.secondTitle,
    }
    if (mode !== this.data.mode || !this.data.featured?.nameZh) {
      patch.featured = this.pickFeatured()
      patch.second = this.pickSecond()
      if (patch.featured) (patch.featured as any).badge = `☆ 今日优选 · ${(patch.featured as any).recommendationScore || 0}%`
      patch.activeScene = ''
      patch.recommendPanelVisible = false
      if (mode !== this.data.mode) this.shownDrinkIds = []
    } else {
      patch.featured = this.withFavorite(this.data.featured, s.favorites)
      patch.second = this.data.second ? this.withFavorite(this.data.second, s.favorites) : null
    }
    this.setData(patch)
  },

  pickFeatured() {
    const mode = store.get().mode
    const list = (this.drinks || []).filter((d) => (d.category === 'COCKTAIL' ? 'cocktail' : 'coffee') === mode)
    // 当前模式无数据返回 null（WXML 走空态），不回退上一模式数据避免跨模式串显
    return list[0] ? this.withFavorite(list[0], store.get().favorites) : null
  },

  pickSecond() {
    const mode = store.get().mode
    const list = (this.drinks || []).filter((d) => (d.category === 'COCKTAIL' ? 'cocktail' : 'coffee') === mode)
    const found = list[1] || null
    return found ? this.withFavorite(found, store.get().favorites) : null
  },

  withFavorite(drink: any, favorites: string[]) {
    if (!drink) return drink
    return { ...drink, favorite: (favorites || []).includes(drink.id) }
  },

  // ---------- 数据 ----------

  loadBootstrap() {
    this.setData({ loading: true })
    service
      .getBootstrap()
      .then((res: any) => {
        this.drinks = Array.isArray(res.featured) ? res.featured : []
        this.setData({ loading: false })
        this.syncFromStore()
        return service.getScenes()
      })
      .then((scenes: any) => {
        this.scenes = scenes || { coffee: [], cocktail: [] }
        this.syncFromStore()
      })
      .catch(() => {
        this.drinks = []
        this.scenes = { coffee: [], cocktail: [] }
        this.setData({ loading: false })
        this.syncFromStore()
      })
  },

  // ---------- 双模式切换 ----------

  onSwitchMode(e: WechatMiniprogram.CustomEvent) {
    const mode = (e.detail as { mode?: string })?.mode as string
    if (mode !== 'coffee' && mode !== 'cocktail') return
    if (store.get().mode === mode) return
    if (mode === 'cocktail' && guardCocktailEntry()) return
    store.switchMode(mode as HomeMode)
  },

  // ---------- 搜索（对齐原型 global-keyword：220ms 防抖非空跳菜单） ----------

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value || ''
    this.setData({ keyword })
    if (this.searchTimer) clearTimeout(this.searchTimer)
    const kw = keyword.trim()
    if (kw) {
      this.searchTimer = setTimeout(() => {
        store.setKeyword(kw)
        this.goMenu(kw)
      }, 220)
    } else {
      // 清空输入时同步清关键词，避免残留旧关键词继续过滤菜单
      store.setKeyword('')
    }
  },

  onSearchConfirm(e: WechatMiniprogram.Input) {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    const kw = (e.detail.value || '').trim()
    if (kw) {
      store.setKeyword(kw)
      this.goMenu(kw)
    }
  },

  goMenu(keyword: string) {
    store.setKeyword(keyword)
    wx.switchTab({ url: '/pages/menu/index' })
  },

  // ---------- 场景 chip（对齐原型 scene-chip：设选中 + 推荐） ----------

  onSceneChip(e: WechatMiniprogram.TouchEvent) {
    const scene = (e.currentTarget?.dataset as { scene?: string })?.scene as string
    if (!scene) return
    this.setData({ activeScene: scene })
    this.runRecommendation(scene)
  },

  // ---------- 推荐 ----------

  onRecommendThis() {
    const scenes = (this.scenes && this.scenes[this.data.mode]) || []
    this.runRecommendation(scenes[0] || '')
  },

  onRecommendAgain() {
    this.runRecommendation('换一杯')
  },

  async runRecommendation(scene: string) {
    if (this.recommending) return
    this.recommending = true
    try {
      const s = store.get()
      const prefs = s.mode === 'coffee' ? s.profile?.coffeePreferences : s.profile?.cocktailPreferences
      const excludedDrinkIds = this.shownDrinkIds.length ? [...this.shownDrinkIds] : undefined
      const result = await service.recommend({ mode: s.mode, scene, preferences: prefs, excludedDrinkIds })
      if (!result || !result.drink) {
        this.showToast('暂无匹配推荐，试试其他场景')
        return
      }
      this.shownDrinkIds = this.shownDrinkIds.includes(result.drink.id)
        ? this.shownDrinkIds
        : [...this.shownDrinkIds, result.drink.id]
      this.setData({
        recommendPanelVisible: true,
        recommend: {
          drink: this.withFavorite(result.drink, store.get().favorites),
          reasons: Array.isArray(result.reasons) ? result.reasons : [],
        },
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
    const drink = this.data.recommend?.drink
    if (!drink) return
    this.setData({ recommendPanelVisible: false })
    wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(drink.id)}` })
  },

  // ---------- 收藏 ----------

  async onToggleFavorite(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (!id) return
    const result = await store.toggleFavoriteLocal(id)
    if (result.ok) {
      this.showToast(result.favorite ? '已收藏' : '已取消收藏')
    } else {
      this.showToast('收藏失败，请稍后重试')
    }
  },

  // ---------- 跳转 ----------

  onMoreRecommend() {
    wx.switchTab({ url: '/pages/menu/index' })
  },

  onOpenDetail(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (!id) return
    wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  // ---------- Toast ----------

  showToast(text: string) {
    this.setData({ toastText: text, toastShow: true })
  },

  onToastHide() {
    this.setData({ toastShow: false })
  },

  onImgError(e: WechatMiniprogram.CustomEvent) {
    const patch = imageErrorPatch(e)
    if (patch) this.setData(patch)
  },
})
