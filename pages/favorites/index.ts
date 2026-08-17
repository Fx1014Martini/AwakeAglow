/**
 * 收藏页（PAGE-SPEC §5）。
 * - 数据：store.favorites（双模式统一收藏集）+ service.listDrinks({mode, pageSize})
 * - 交互：点击卡片进详情；爱心取消收藏（顺序更新，失败 toast 提示）
 * - 空态：无收藏时展示 empty 组件
 * - 猜你喜欢：当前模式未收藏的前几个
 * - 主题：根节点 data-mode 切换双主题（app.wxss view[data-mode]）+ 导航栏变色（lib/theme）
 */
import { store } from '../../stores/index'
import { service } from '../../services/index'
import { applyPageTheme } from '../../lib/theme'
import { imageErrorPatch } from '../../lib/image'
import { guardCocktailEntry } from '../../lib/age-gate'
import type { AppService } from '../../services/index'
import type { DrinkSummary } from '../../lib/contracts'

/** 收藏卡片：契约 DrinkSummary + 本地收藏标记 */
type FavoriteCard = DrinkSummary & { favorite?: boolean }

interface FavoritesData {
  mode: 'coffee' | 'cocktail'
  favorites: FavoriteCard[]
  suggestions: FavoriteCard[]
  loading: boolean
  toastVisible: boolean
  toastContent: string
}

interface FavoritesCustom {
  service: AppService
  unsubscribe?: () => void
  loadAll(): void
  fetchAllModeDrinks(mode: 'coffee' | 'cocktail'): Promise<DrinkSummary[]>
  refresh(): void
  onSwitchMode(e: WechatMiniprogram.CustomEvent): void
  onDrinkOpen(e: WechatMiniprogram.CustomEvent): void
  onDrinkFavorite(e: WechatMiniprogram.CustomEvent): void
  onGoMenu(): void
  showToast(content: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<FavoritesData, FavoritesCustom>({
  data: {
    mode: 'coffee',
    favorites: [],
    suggestions: [],
    loading: true,
    toastVisible: false,
    toastContent: '',
  },

  service,

  onLoad() {},

  onShow() {
    applyPageTheme(this)
    const tabbar = (this as any).getTabBar?.()
    if (tabbar) tabbar.setData({ selected: 2 })
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
    this.setData({ mode, loading: true })
    const favIds = new Set(state.favorites)
    // 收藏详情按 id 精准拉取；「猜你喜欢」用当前模式列表前几款未收藏的
    Promise.all([
      this.fetchAllModeDrinks(mode),
      this.service.listDrinks({ mode, page: 1, pageSize: 100 }).catch(() => ({ items: [] as DrinkSummary[] })),
    ])
      .then(([favDrinks, page]) => {
        const favorites = favDrinks.map((d) => ({ ...d, favorite: true }))
        const suggestions = (page.items || []).filter((d) => !favIds.has(d.id)).slice(0, 3)
        this.setData({ favorites, suggestions, loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
        this.showToast('收藏加载失败，请稍后再试')
      })
  },

  /** 按 id 拉取收藏详情（避免全量分页拉取） */
  async fetchAllModeDrinks(_mode: 'coffee' | 'cocktail'): Promise<DrinkSummary[]> {
    const favIds = store.get().favorites
    const results = await Promise.all(favIds.map(id => this.service.getDrinkDetail(id).catch(() => null)))
    return results.filter(Boolean) as DrinkSummary[]
  },

  /** 由 store 状态变化触发：模式变更时重载，否则仅本地过滤（不重复请求） */
  refresh() {
    const state = store.get()
    const mode = state.mode
    if (mode !== this.data.mode) {
      this.setData({ mode })
      this.loadAll()
      return
    }
    const favIds = new Set(state.favorites)
    const favorites = this.data.favorites
      .filter((d) => favIds.has(d.id))
      .map((d) => ({ ...d, favorite: true }))
    const suggestions = this.data.suggestions
      .filter((d) => !favIds.has(d.id))
      .map((d) => ({ ...d, favorite: false }))
    this.setData({ favorites, suggestions })
  },

  onSwitchMode(e: WechatMiniprogram.CustomEvent) {
    const mode = (e.detail as { mode?: string })?.mode as 'coffee' | 'cocktail' | undefined
    if (!mode) return
    if (store.get().mode === mode) return
    if (mode === 'cocktail' && guardCocktailEntry()) return
    store.switchMode(mode)
  },

  onDrinkOpen(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (id) wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  onDrinkFavorite(e: WechatMiniprogram.CustomEvent) {
    const id = (e.detail?.id || e.currentTarget?.dataset?.id) as string
    if (!id) return
    store.toggleFavoriteLocal(id).then((result) => this.showToast(result.ok ? (result.favorite ? '已收藏' : '已取消收藏') : '收藏操作失败'))
  },

  onGoMenu() {
    wx.switchTab({ url: '/pages/menu/index' })
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
