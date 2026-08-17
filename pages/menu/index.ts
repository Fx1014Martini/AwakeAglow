/**
 * 菜单页（PAGE-SPEC §2）。
 * - 搜索栏：220ms 防抖输入
 * - 筛选面板：三态 chip（NONE→WANT→EXCLUDE，复用 lib/core.ts triState 与 store.cycleFilter）
 * - 双模式筛选字典（coffee 5 组 / cocktail 5 组，来自 bootstrap taxonomies，契约 FilterGroup/FilterOption）
 * - 三态筛选经契约 filters（Record<key,{want,exclude}>）透传服务端；EXCLUDE 另在客户端按
 *   attributes 本地过滤做幂等防御
 * - 结果列表：resultCard（图/名/标签/推荐指数），加载骨架、空态
 * - 排序：综合推荐 / 名称（契约 sort 透传）
 * 数据访问只走 services/ 层单例 service，页面不直接 wx.request。
 */
import { service } from '../../services/index'
import { store } from '../../stores/index'
import { applyPageTheme } from '../../lib/theme'
import { imageErrorPatch } from '../../lib/image'
import { guardCocktailEntry } from '../../lib/age-gate'
import type { TriState } from '../../lib/core'
import type { DrinkFilters, DrinkSummary, ListDrinksQuery } from '../../lib/contracts'

type MenuMode = 'coffee' | 'cocktail'

interface MenuGroup {
  key: string
  label: string
  options: string[]
}

/** 渲染态三态 chip：{ key: { option: TriState } } */
/** 渲染态结果项 */
interface RenderDrink {
  id: string
  nameZh: string
  nameEn: string
  intro: string
  imageUrl: string
  tags: string[]
  recommendationScore: number
  favorite: boolean
  /** 是否已加入对比选择（对比模式下结果卡高亮） */
  inCompare: boolean
  /** 服务端 cards 携带的可判定维度值（EXCLUDE 本地过滤用） */
  attributes?: Record<string, string | string[]>
}

const PLACEHOLDERS: Record<MenuMode, string> = {
  coffee: '搜索咖啡名称 / 风味 / 场景',
  cocktail: '搜索酒名 / 风味 / 场景 / 主要成分',
}

interface MenuData {
  mode: MenuMode
  keyword: string
  searchPlaceholder: string
  filterPanelVisible: boolean
  /** 当前模式筛选字典（WXML 渲染用，含每选项三态） */
  filterGroups: Array<{
    key: string
    label: string
    options: Array<{ name: string; state: TriState }>
  }>
  /** 已选条件摘要（WXML 直接展示） */
  appliedSummary: string
  drinks: RenderDrink[]
  total: number
  loading: boolean
  sort: 'recommendation' | 'name'
  /** 对比模式：true 时结果卡显示选择态，收集两款后进对比页 */
  compareMode: boolean
  /** 已选入对比的 id（最多 2 款） */
  compareSelection: string[]
  toastShow: boolean
  toastText: string
}

interface MenuCustom {
  unsubscribe: (() => void) | null
  searchTimer: ReturnType<typeof setTimeout> | null
  requestSeq: number
  /** 按模式缓存的字典：{ mode: groups } */
  groupsByMode: Partial<Record<MenuMode, MenuGroup[]>>
  syncFromStore(): void
  loadTaxonomies(): void
  buildFilterGroups(): void
  refreshFilterData(): void
  search(): Promise<void>
  buildFilters(): DrinkFilters
  excludeAttributeValue(drink: DrinkSummary, key: string, option: string): boolean
  applyExcludeLocal(items: DrinkSummary[], filters: DrinkFilters): DrinkSummary[]
  applyNameSort(): void
  onSwitchMode(e: WechatMiniprogram.CustomEvent): void
  onSearchInput(e: WechatMiniprogram.Input): void
  onSearchConfirm(): void
  onClearKeyword(): void
  onToggleFilter(): void
  onTriFilter(e: WechatMiniprogram.TouchEvent): void
  onResetFilters(): void
  onToggleSort(): void
  onToggleFavorite(e: WechatMiniprogram.TouchEvent): Promise<void>
  onDrinkOpen(e: WechatMiniprogram.CustomEvent): void
  onDrinkFavorite(e: WechatMiniprogram.CustomEvent): Promise<void>
  onDrinkCompare(e: WechatMiniprogram.CustomEvent): void
  onToggleCompareMode(): void
  onPickCompare(e: WechatMiniprogram.TouchEvent): void
  goCompare(ids: string[], mode: 'coffee' | 'cocktail'): void
  onGoCompare(): void
  showToast(text: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<MenuData, MenuCustom>({
  data: {
    mode: 'coffee',
    keyword: '',
    searchPlaceholder: PLACEHOLDERS.coffee,
    filterPanelVisible: true,
    filterGroups: [],
    appliedSummary: '',
    drinks: [],
    total: 0,
    loading: false,
    sort: 'recommendation',
    compareMode: false,
    compareSelection: [],
    toastShow: false,
    toastText: '',
  },

  unsubscribe: null,
  searchTimer: null,
  requestSeq: 0,
  groupsByMode: {},

  onLoad(query: Record<string, string | undefined>) {
    this.unsubscribe = store.subscribe(() => this.syncFromStore())
    this.syncFromStore()
    let kw = ''
    try {
      kw = query?.keyword ? decodeURIComponent(query.keyword) : ''
    } catch {
      kw = query?.keyword || ''
    }
    if (kw) {
      store.setKeyword(kw)
      this.setData({ keyword: kw })
    }
    this.loadTaxonomies()
    this.search()
  },

  onShow() {
    // 主题接线：导航栏/状态栏随当前模式变色（WXSS 变量经根 view data-mode 已生效）
    applyPageTheme(this)
    // 自定义 tabBar 选中项同步（框架实例）
    const tabbar = (this as any).getTabBar?.()
    if (tabbar) tabbar.setData({ selected: 1 })
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },

  // ---------- store 同步 ----------

  syncFromStore() {
    const s = store.get()
    const mode: MenuMode = s.mode === 'cocktail' ? 'cocktail' : 'coffee'
    const patch: Record<string, unknown> = {
      mode,
      keyword: s.keyword,
      searchPlaceholder: PLACEHOLDERS[mode],
    }
    if (mode !== this.data.mode) {
      // 模式切换：清空列表，重建字典并重查；对比选择跨模式无效，一并清空
      patch.drinks = []
      patch.total = 0
      patch.loading = false
      patch.compareMode = false
      patch.compareSelection = []
      this.setData(patch)
      this.buildFilterGroups()
      this.search()
      return
    }
    // 收藏状态同步（不触发整表重查）
    const favSet = new Set(s.favorites || [])
    const staleFav = this.data.drinks.some((d) => Boolean(d.favorite) !== favSet.has(d.id))
    this.setData({
      ...patch,
      ...(staleFav ? { drinks: this.data.drinks.map((d) => ({ ...d, favorite: favSet.has(d.id) })) } : {}),
    })
    this.refreshFilterData()
  },

  // ---------- 字典 ----------

  loadTaxonomies() {
    service
      .getBootstrap()
      .then((res) => {
        const taxonomies = res.taxonomies
        // 契约 FilterGroup.options 为 FilterOption[]：渲染取中文 label（归一化纪律）
        const toGroups = (groups: typeof taxonomies.coffee) =>
          groups
            .filter((g) => g && g.key && Array.isArray(g.options))
            .map((g) => ({ key: g.key, label: g.label, options: g.options.map((o) => o.label) }))
        this.groupsByMode = { coffee: toGroups(taxonomies.coffee || []), cocktail: toGroups(taxonomies.cocktail || []) }
        this.buildFilterGroups()
      })
      .catch(() => {
        this.buildFilterGroups()
      })
  },

  /** 以当前模式字典 + store 筛选态，重建渲染用的 filterGroups 与摘要 */
  buildFilterGroups() {
    const mode = this.data.mode
    const groups = this.groupsByMode[mode] || []
    if (!groups.length) {
      this.setData({ filterGroups: [], appliedSummary: '' })
      return
    }
    const state = (store.get().filters[mode] || {}) as Record<string, Record<string, TriState>>
    const withState = groups.map((g) => ({
      key: g.key,
      label: g.label,
      options: g.options.map((name) => ({ name, state: (state[g.key]?.[name] as TriState) || 'NONE' as TriState })),
    }))
    const summaryParts: string[] = []
    groups.forEach((g) => {
      const cat = state[g.key] || {}
      Object.entries(cat).forEach(([opt, tri]) => {
        if (tri === 'WANT') summaryParts.push(opt)
        if (tri === 'EXCLUDE') summaryParts.push(`排除 ${opt}`)
      })
    })
    this.setData({ filterGroups: withState, appliedSummary: summaryParts.join(' · ') })
  },

  /** 仅筛选/关键词变化时刷新三态渲染（由 store 订阅触发） */
  refreshFilterData() {
    this.buildFilterGroups()
  },

  // ---------- 搜索（220ms 防抖） ----------

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value || ''
    store.setKeyword(keyword)
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => this.search(), 220)
  },

  onSearchConfirm() {
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.search()
  },

  onClearKeyword() {
    store.setKeyword('')
    if (this.searchTimer) clearTimeout(this.searchTimer)
    this.search()
  },

  // ---------- 筛选 ----------

  onToggleFilter() {
    this.setData({ filterPanelVisible: !this.data.filterPanelVisible })
  },

  /** 三态循环：store.cycleFilter（NONE→WANT→EXCLUDE），随后立即重新请求 */
  onTriFilter(e: WechatMiniprogram.TouchEvent) {
    const { key, option } = e.currentTarget.dataset
    if (!key || !option) return
    store.cycleFilter(key as string, option as string)
    this.buildFilterGroups()
    this.search()
  },

  onResetFilters() {
    store.resetFilters()
    this.buildFilterGroups()
    this.search()
  },

  // ---------- 列表请求 ----------

  /** 将三态筛选转为契约 filters：Record<key,{want,exclude}>（EXCLUDE 透传服务端） */
  buildFilters(): DrinkFilters {
    const s = store.get()
    const state = s.filters[s.mode] || {}
    const out: DrinkFilters = {}
    Object.entries(state).forEach(([key, category]) => {
      const want: string[] = []
      const exclude: string[] = []
      Object.entries(category || {}).forEach(([option, tri]) => {
        if (tri === 'WANT') want.push(option)
        if (tri === 'EXCLUDE') exclude.push(option)
      })
      if (want.length || exclude.length) out[key] = { want, exclude }
    })
    return out
  },

  /**
   * EXCLUDE 命中判定：菜单分类 key 与服务端 cards.attributes 键映射后比较。
   * server 卡片 attributes 键（products.py _coffee/_cocktail_attributes）：
   * coffee: coffeeType/milk/sweetBitter/temperature/caffeine
   * cocktail: baseSpirit/cocktailType/flavor/abv/extra
   * 而 bootstrap taxonomies 沿用 server menus.json 分类键（type/milk/sweet_bitter/temperature/caffeine
   * 与 base/type/flavor/abv/ingredient），故此处建立菜单分类 -> 卡片属性键的映射。
   */
  excludeAttributeValue(drink: DrinkSummary, key: string, option: string): boolean {
    const MENU_KEY_TO_ATTR: Record<string, string> = {
      type: 'coffeeType',
      milk: 'milk',
      sweet_bitter: 'sweetBitter',
      sweetBitter: 'sweetBitter',
      temperature: 'temperature',
      caffeine: 'caffeine',
      base: 'baseSpirit',
      baseSpirit: 'baseSpirit',
      cocktailType: 'cocktailType',
      flavor: 'flavor',
      abv: 'abv',
      extra: 'extra',
      ingredient: 'extra',
    }
    const attrKey = MENU_KEY_TO_ATTR[key] || key
    const attrs = drink.attributes as Record<string, string | string[] | undefined> | undefined
    const raw = attrs?.[attrKey]
    const values = Array.isArray(raw) ? (raw as string[]) : raw ? [String(raw)] : []
    return values.includes(option)
  },

  /** 客户端 EXCLUDE 本地过滤：对服务端结果幂等剔除命中「排除」选项的产品（MockService 已在语义上排除） */
  applyExcludeLocal(items: DrinkSummary[], filters: DrinkFilters): DrinkSummary[] {
    const excludes = Object.entries(filters || {}).flatMap(([key, rule]) =>
      (rule?.exclude || []).map((option) => ({ key, option })),
    )
    if (!excludes.length) return items
    return items.filter((drink) => !excludes.some(({ key, option }) => this.excludeAttributeValue(drink, key, option)))
  },

  async search() {
    const s = store.get()
    const keyword = s.keyword
    const requestId = ++this.requestSeq

    this.setData({ loading: true })

    // 契约口径：keyword + filters（want/exclude 三态透传）+ sort；pageSize=100 单页覆盖原型 100 条筛选窗口
    const params: ListDrinksQuery = {
      mode: s.mode,
      keyword: keyword || undefined,
      filters: this.buildFilters(),
      sort: this.data.sort,
      page: 1,
      pageSize: 100,
    }

    try {
      const allItems: DrinkSummary[] = []
      let total = 0
      let hasMore = true
      for (let page = 1; page <= 6 && hasMore; page += 1) {
        const res = await service.listDrinks({ ...params, page })
        allItems.push(...(res.items || []))
        total = res.total
        hasMore = res.hasMore
      }
      if (requestId !== this.requestSeq) return // 过期响应丢弃
      let items: DrinkSummary[] = allItems
      // EXCLUDE 防御：契约 filters.exclude 已透传服务端；此处按 attributes 本地幂等过滤
      items = this.applyExcludeLocal(items, this.buildFilters())
      // 名称排序幂等防御（服务端 sort=name 未实现时兜底）
      if (this.data.sort === 'name') {
        items = [...items].sort((a, b) => String(a.nameZh || '').localeCompare(String(b.nameZh || ''), 'zh-CN'))
      }
      const favSet = new Set(store.get().favorites || [])
      const selSet = new Set(this.data.compareSelection || [])
      this.setData({
        drinks: items.map((d) => ({ ...d, favorite: favSet.has(d.id), inCompare: selSet.has(d.id) })),
        total: Math.min(total || items.length, items.length),
        loading: false,
      })
    } catch (error) {
      if (requestId !== this.requestSeq) return
      this.setData({ drinks: [], total: 0, loading: false })
      this.showToast((error as Error)?.message || '菜单加载失败，请稍后重试')
    }
  },

  // ---------- 排序 ----------

  onToggleSort() {
    const next: MenuData['sort'] = this.data.sort === 'recommendation' ? 'name' : 'recommendation'
    this.setData({ sort: next })
    // 名称排序客户端完成；综合推荐需重查（服务端默认相关度序）
    if (next === 'recommendation') {
      this.search()
    } else {
      this.applyNameSort()
    }
  },

  applyNameSort() {
    const items = [...this.data.drinks].sort((a, b) => String(a.nameZh || '').localeCompare(String(b.nameZh || ''), 'zh-CN'))
    this.setData({ drinks: items })
  },

  // ---------- 跳转 / 收藏 ----------

  /** mode-switch 组件回调：切模式走 store，订阅刷新自动重查（跨模式清空 keyword/detailTab 由 store.switchMode 负责） */
  onSwitchMode(e: WechatMiniprogram.CustomEvent) {
    const mode = (e.detail as { mode?: string })?.mode as string
    if (mode !== 'coffee' && mode !== 'cocktail') return
    if (store.get().mode === mode) return
    if (mode === 'cocktail' && guardCocktailEntry()) return
    store.switchMode(mode as MenuMode)
  },

  onDrinkOpen(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (id) wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  async onToggleFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    const result = await store.toggleFavoriteLocal(id)
    if (result.ok) {
      this.showToast(result.favorite ? '已收藏' : '已取消收藏')
    } else {
      this.showToast('收藏失败，请稍后重试')
    }
  },

  async onDrinkFavorite(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (!id) return
    const result = await store.toggleFavoriteLocal(id)
    if (result.ok) this.showToast(result.favorite ? '已收藏' : '已取消收藏')
    else this.showToast('收藏失败，请稍后重试')
  },

  onDrinkCompare(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (id) this.onPickCompare({ currentTarget: { dataset: { id } } } as any)
  },

  // ---------- 对比（compare 入口，对齐原型对比页可达性） ----------

  /** 对比模式开关：进入后结果卡显示选择态；退出清空已选 */
  onToggleCompareMode() {
    const next = !this.data.compareMode
    this.setData({
      compareMode: next,
      compareSelection: next ? this.data.compareSelection : [],
    })
    // 同步结果卡选择态
    const selSet = new Set(next ? this.data.compareSelection : [])
    this.setData({ drinks: this.data.drinks.map((d) => ({ ...d, inCompare: selSet.has(d.id) })) })
  },

  /** 点击结果卡「对比」收集：同领域两款（id 不重复），满两款自动进对比页 */
  onPickCompare(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    const mode = this.data.mode
    const current = [...this.data.compareSelection]
    if (current.includes(id)) {
      this.setData({
        compareSelection: current.filter((x) => x !== id),
        drinks: this.data.drinks.map((d) => (d.id === id ? { ...d, inCompare: false } : d)),
      })
      return
    }
    if (current.length >= 2) {
      this.showToast('对比最多选两款，先移除一款')
      return
    }
    const next = [...current, id]
    this.setData({
      compareSelection: next,
      drinks: this.data.drinks.map((d) => (d.id === id ? { ...d, inCompare: true } : d)),
    })
    if (next.length === 2) this.goCompare(next, mode)
  },

  /** 两款齐备：写 store.compareIds 并跳对比页 */
  goCompare(ids: string[], mode: 'coffee' | 'cocktail') {
    const prev = store.get().compareIds
    store.setCompareIds({ ...prev, [mode]: [ids[0], ids[1]] })
    wx.navigateTo({ url: `/pkgCompare/index?left=${encodeURIComponent(ids[0])}&right=${encodeURIComponent(ids[1])}` })
  },

  /** 已选满两款时点浮条按钮进入对比 */
  onGoCompare() {
    const sel = this.data.compareSelection
    if (sel.length < 2) {
      this.showToast('请先选择两款饮品')
      return
    }
    this.goCompare([sel[0], sel[1]], this.data.mode)
  },

  // ---------- Toast ----------

  showToast(text: string) {
    this.setData({ toastText: text, toastShow: true })
  },

  onToastHide() {
    this.setData({ toastShow: false })
  },

  /** 产品图加载失败：换占位图（只 setData data-path 对应字段） */
  onImgError(e: WechatMiniprogram.CustomEvent) {
    const patch = imageErrorPatch(e)
    if (patch) this.setData(patch)
  },
})
