/**
 * 详情页（PAGE-SPEC §3，对齐原型 templates.js:99-108）。
 * - 模块顺序：四 Tab（概览/配方/雷达/相似）→ Hero（海报图 + 名称 + 收藏按钮）→ Tab 内容
 * - 导航：自定义品牌顶部栏（brand-header，二级页显示返回按钮）
 * - 概览：中文名/英文名/介绍/标签/原料与配比/雷达图 + 相似推荐入口（查看更多› 切到相似 tab）；
 *   配方：材料表 + 步骤列表；雷达：单产品雷达（radar-chart）；相似：相似推荐横滑卡片（点击进详情）
 * - 无 id 兜底：对齐原型 app.js:102 回退当前模式默认产品（mock 数据源下）
 * - 收藏状态跨页面同步：订阅 store，读 store.favorites
 * - 主题接线：根节点 data-mode 跟随全局 store.mode（对齐原型 device 主题），不按饮品领域
 * 数据访问只走 services/ 层单例 service，页面不直接 wx.request。
 */
import { service } from '../services/index'
import { store } from '../stores/index'
import { applyPageTheme } from '../lib/theme'
import { imageErrorPatch } from '../lib/image'
import { guardCocktailEntry, isCocktailDrinkId } from '../lib/age-gate'
import type { RadarMetric } from '../lib/radar'

type DetailMode = 'coffee' | 'cocktail'
type DetailTabKey = 'overview' | 'recipe' | 'radar' | 'similar'

const DETAIL_TABS: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'overview', label: '概览' },
  { key: 'recipe', label: '配方' },
  { key: 'radar', label: '雷达' },
  { key: 'similar', label: '相似' },
]

/** 当前模式默认产品 id（对齐原型 app.js:39 modeDefaultDetail），无 id 时兜底（须存在于数据库） */
const DEFAULT_DETAIL_ID: Record<DetailMode, string> = {
  coffee: 'coffee-oat-latte',
  // cosmopolitan 不在 V6 数据库中，改用存在的经典款
  cocktail: 'cocktail-mojito',
}

interface RenderIngredient {
  nameZh: string
  nameEn: string
  amountText: string
  role?: string
}

interface RenderSimilar {
  id: string
  nameZh: string
  nameEn: string
  imageUrl: string
}

interface RenderItem {
  id: string
  mode: DetailMode
  nameZh: string
  nameEn: string
  intro: string
  description: string
  imageUrl: string
  posterUrl: string
  tags: string[]
  ingredients: RenderIngredient[]
  steps: string[]
  radar: RadarMetric[]
  similar: RenderSimilar[]
}

interface DetailData {
  mode: DetailMode
  loading: boolean
  item: RenderItem | null
  /** 概览「配方比例」前 4 项（对齐原型 ingredients.slice(0,4)） */
  ingredientsPreview: RenderIngredient[]
  tabs: typeof DETAIL_TABS
  activeTab: DetailTabKey
  favorite: boolean
  toastShow: boolean
  toastText: string
}

interface DetailCustom {
  unsubscribe: (() => void) | null
  drinkId: string
  loadDetail(id: string): Promise<void>
  normalizeItem(raw: any): RenderItem
  syncFromStore(): void
  onTabChange(e: WechatMiniprogram.CustomEvent): void
  onToggleFavorite(): Promise<void>
  onOpenSimilar(e: WechatMiniprogram.TouchEvent): void
  onGoSimilarTab(): void
  onBack(): void
  showToast(text: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<DetailData, DetailCustom>({
  data: {
    mode: 'coffee',
    loading: true,
    item: null,
    ingredientsPreview: [],
    tabs: DETAIL_TABS,
    activeTab: 'overview',
    favorite: false,
    toastShow: false,
    toastText: '',
  },

  unsubscribe: null,
  drinkId: '',

  onLoad(query: Record<string, string | undefined>) {
    // 收藏/模式跨页面同步：主题跟随全局 mode（对齐原型 device.dataset.mode = state.mode）
    this.unsubscribe = store.subscribe(() => this.syncFromStore())
    const s = store.get()
    this.setData({
      mode: s.mode === 'cocktail' ? 'cocktail' : 'coffee',
      activeTab: s.detailTab || 'overview',
    })
    let id = ''
    try {
      id = query?.id ? decodeURIComponent(query.id) : ''
    } catch {
      id = query?.id || ''
    }
    // 深链 cocktail 详情：切模式 + 成年门禁
    if (isCocktailDrinkId(id)) {
      store.switchMode('cocktail')
      if (guardCocktailEntry(`/pkgDetail/index?id=${encodeURIComponent(id)}`)) return
    }
    if (!id) {
      // 无 id 兜底：对齐原型 app.js:102 回退当前模式默认产品（mock 数据源下可命中）
      const fallbackId = DEFAULT_DETAIL_ID[s.mode === 'cocktail' ? 'cocktail' : 'coffee']
      this.drinkId = fallbackId
      this.loadDetail(fallbackId)
      return
    }
    this.drinkId = id
    this.loadDetail(id)
  },

  onShow() {
    // 主题接线：导航栏/状态栏随饮品领域变色（详情页主题绑定 item.mode，loadDetail 后再刷新一次）
    applyPageTheme(this)
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
  },

  // ---------- 数据 ----------

  async loadDetail(id: string) {
    this.setData({ loading: true })
    try {
      const raw: any = await service.getDrinkDetail(id)
      const item = this.normalizeItem(raw)
      this.setData({
        item,
        ingredientsPreview: item.ingredients.slice(0, 4),
        favorite: (store.get().favorites || []).includes(id),
        loading: false,
      })
      service.addHistory(id).catch(() => undefined)
      // 浏览历史联动我的页：置顶去重写回 store.profile.history（BFF 在 GET detail 时已落库）
      const profile = store.get().profile
      if (profile) {
        const history = [id, ...(profile.history || []).filter((x) => x !== id)].slice(0, 50)
        store.setProfile({ ...profile, history })
      }
      // 主题跟随全局 mode：详情加载完成后同步一次导航栏颜色
      applyPageTheme(this)
    } catch (error) {
      this.setData({ loading: false, item: null })
      this.showToast((error as Error)?.message || '详情加载失败，请稍后重试')
    }
  },

  /** 契约 DrinkDetail -> 页面渲染模型（单位预格式化为展示文本） */
  normalizeItem(raw: any): RenderItem {
    const ingredients: RenderIngredient[] = Array.isArray(raw?.ingredients)
      ? raw.ingredients.map((ing: any) => ({
          nameZh: ing?.nameZh || '',
          nameEn: ing?.nameEn || '',
          amountText: `${ing?.amount ?? 0}${ing?.unit || ''}`,
          role: ing?.role || undefined,
        }))
      : []
    const similar: RenderSimilar[] = Array.isArray(raw?.similar)
      ? raw.similar.map((s: any) => ({
          id: s?.id || '',
          nameZh: s?.nameZh || '',
          nameEn: s?.nameEn || '',
          imageUrl: s?.imageUrl || '',
        }))
      : []
    return {
      id: raw?.id || '',
      mode: raw?.mode === 'cocktail' ? 'cocktail' : 'coffee',
      nameZh: raw?.nameZh || '',
      nameEn: raw?.nameEn || '',
      intro: raw?.intro || '',
      description: raw?.description || raw?.intro || '',
      imageUrl: raw?.imageUrl || '',
      posterUrl: raw?.posterUrl || raw?.imageUrl || '',
      tags: Array.isArray(raw?.tags) ? raw.tags : [],
      ingredients,
      steps: Array.isArray(raw?.steps) ? raw.steps : [],
      radar: Array.isArray(raw?.radar) ? (raw.radar as RadarMetric[]) : [],
      similar,
    }
  },

  /** 订阅 store：收藏状态与全局主题模式跨页面同步 */
  syncFromStore() {
    const s = store.get()
    const mode: DetailMode = s.mode === 'cocktail' ? 'cocktail' : 'coffee'
    const fav = (s.favorites || []).includes(this.drinkId)
    const patch: Partial<DetailData> = {}
    if (fav !== this.data.favorite) patch.favorite = fav
    if (mode !== this.data.mode) {
      patch.mode = mode
      this.setData(patch)
      applyPageTheme(this)
      return
    }
    if (Object.keys(patch).length) this.setData(patch)
  },

  // ---------- 交互 ----------

  /** Tab 切换：不改 URL，更新 detailTab（对齐原型持久化） */
  onTabChange(e: WechatMiniprogram.CustomEvent) {
    const key = (e.detail as { key?: DetailTabKey } | undefined)?.key as DetailTabKey | undefined
    if (!key) return
    this.setData({ activeTab: key })
    store.setDetailTab(key)
  },

  async onToggleFavorite() {
    if (!this.drinkId) return
    const result = await store.toggleFavoriteLocal(this.drinkId)
    if (result.ok) {
      this.showToast(result.favorite ? '已收藏' : '已取消收藏')
    } else {
      this.showToast('收藏失败，请稍后重试')
    }
  },

  onOpenSimilar(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
    if (!id) return
    wx.navigateTo({ url: `/pkgDetail/index?id=${encodeURIComponent(id)}` })
  },

  /** 概览「查看更多 ›」：切到相似 tab（对齐原型 templates.js:108 data-action="detail-tab" data-tab="similar"） */
  onGoSimilarTab() {
    this.setData({ activeTab: 'similar' })
    store.setDetailTab('similar')
  },

  onBack() {
    wx.navigateBack({ delta: 1 })
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
