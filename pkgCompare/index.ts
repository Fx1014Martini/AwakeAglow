/**
 * 对比页（PAGE-SPEC §4）。
 * - 顶部双卡（左 VS 右）
 * - 双雷达叠加（radar-chart 的 compareMetrics，组件内部经 lib/radar.ts radarPointsCompare 计算）
 * - 维度表：咖啡（咖啡类型/奶类/甜苦程度/饮用温度/咖啡因/适合场景）；鸡尾酒（基酒/鸡尾酒类型/风味倾向/成品酒精度/其他主要成分/适合场景）
 * - 推荐结论
 * - 调 service.compare({ drinkIds }) 并渲染 items/conclusion（契约 CompareRequest/CompareResult，mock 与 real 同构）
 * - 主题接线：根节点 data-mode 按领域（store.mode）切换双主题；store 模式切换后自动加载该模式默认对比组
 * 数据访问只走 services/ 层单例 service，页面不直接 wx.request。
 */
import { service } from '../services/index'
import { store } from '../stores/index'
import { applyPageTheme } from '../lib/theme'
import { imageErrorPatch } from '../lib/image'
import { guardCocktailEntry, isCocktailDrinkId } from '../lib/age-gate'
import type { RadarMetric } from '../lib/radar'
import type { DrinkDetail } from '../lib/contracts'

type CompareMode = 'coffee' | 'cocktail'

/** 维度表定义由 BFF GET /compare-rows 提供（taxonomy groups + scene），前端不再硬编码。 */

interface CompareRow {
  key: string
  label: string
  left: string
  right: string
}

interface CompareData {
  mode: CompareMode
  loading: boolean
  left: DrinkDetail | null
  right: DrinkDetail | null
  radarMetrics: RadarMetric[]
  radarCompareMetrics: RadarMetric[]
  rows: CompareRow[]
  /** 维度表定义（BFF /compare-rows） */
  compareRows: { coffee: Array<{ key: string; label: string }>; cocktail: Array<{ key: string; label: string }> }
  /** 推荐结论双卡标题（对齐原型 renderCompare：按模式固定文案） */
  conclusionLeftTitle: string
  conclusionRightTitle: string
  toastShow: boolean
  toastText: string
}

interface CompareCustom {
  unsubscribe: (() => void) | null
  loadCompare(): Promise<void>
  buildRows(): CompareRow[]
  onOpenDetail(e: WechatMiniprogram.TouchEvent): void
  showToast(text: string): void
  onToastHide(): void
  onImgError(e: WechatMiniprogram.CustomEvent): void
}

Page<CompareData, CompareCustom>({
  data: {
    mode: 'coffee',
    loading: true,
    left: null,
    right: null,
    radarMetrics: [],
    radarCompareMetrics: [],
    rows: [],
    compareRows: { coffee: [], cocktail: [] },
    conclusionLeftTitle: '',
    conclusionRightTitle: '',
    toastShow: false,
    toastText: '',
  },

  unsubscribe: null,

  onLoad(query: Record<string, string | undefined>) {
    this.unsubscribe = store.subscribe(() => {
      const nextMode: CompareMode = store.get().mode === 'cocktail' ? 'cocktail' : 'coffee'
      // 模式切换后自动加载该模式默认对比组
      if (nextMode !== this.data.mode) this.loadCompare()
    })
    const s = store.get()
    this.setData({ mode: s.mode === 'cocktail' ? 'cocktail' : 'coffee' })
    // 支持从菜单结果卡带参进入：?left=..&right=..
    const leftId = query?.left ? decodeURIComponent(query.left) : ''
    const rightId = query?.right ? decodeURIComponent(query.right) : ''
    // 深链 cocktail 对比的成年门禁
    if (isCocktailDrinkId(leftId) || isCocktailDrinkId(rightId)) {
      store.switchMode('cocktail')
      const returnUrl = `/pkgCompare/index?left=${encodeURIComponent(leftId)}&right=${encodeURIComponent(rightId)}`
      if (guardCocktailEntry(returnUrl)) return
    }
    if (leftId && rightId) {
      const mode: CompareMode = s.mode === 'cocktail' ? 'cocktail' : 'coffee'
      const prev = s.compareIds
      store.setCompareIds({ ...prev, [mode]: [leftId, rightId] })
    }
    service.getCompareRows().then((rows) => {
      this.setData({ compareRows: rows })
      this.loadCompare()
    }).catch(() => this.loadCompare())
  },

  onShow() {
    // 主题接线：导航栏/状态栏随当前模式变色（WXSS 变量经根 view data-mode 已生效）
    applyPageTheme(this)
  },

  onUnload() {
    if (this.unsubscribe) this.unsubscribe()
  },

  // ---------- 数据 ----------

  async loadCompare() {
    const s = store.get()
    const mode: CompareMode = s.mode === 'cocktail' ? 'cocktail' : 'coffee'
    const pair = s.compareIds[mode]
    const ids = Array.isArray(pair) ? pair.filter(Boolean) : []
    if (ids.length < 2) {
      this.setData({ loading: false, left: null, right: null, rows: [], conclusionLeftTitle: '', conclusionRightTitle: '' })
      this.showToast('对比需要两款饮品')
      return
    }
    this.setData({ mode, loading: true })
    try {
      const res = await service.compare({ drinkIds: ids })
      const items: DrinkDetail[] = Array.isArray(res?.items) ? res.items : []
      const left = items[0] || null
      const right = items[1] || null
      if (!left || !right) {
        this.setData({ loading: false, left: null, right: null, rows: [], conclusionLeftTitle: '', conclusionRightTitle: '' })
        this.showToast('对比数据不完整')
        return
      }
      const conclusion = Array.isArray(res?.conclusion) ? res.conclusion : []
      this.setData({
        left,
        right,
        radarMetrics: Array.isArray(left.radar) ? left.radar : [],
        radarCompareMetrics: Array.isArray(right.radar) ? right.radar : [],
        conclusionLeftTitle: conclusion[0] || (mode === 'coffee' ? '更适合专注办公' : '更适合社交优雅'),
        conclusionRightTitle: conclusion[1] || (mode === 'coffee' ? '更适合夏日清爽' : '更适合轻松放松'),
        loading: false,
      })
      this.buildRows()
    } catch (error) {
      this.setData({ loading: false, left: null, right: null, rows: [], conclusionLeftTitle: '', conclusionRightTitle: '' })
      this.showToast((error as Error)?.message || '对比加载失败，请稍后重试')
    }
  },

  /** 维度表渲染：按当前模式取 6 行，值取 attributes/场景，缺省显示 — */
  buildRows(): CompareRow[] {
    const mode = this.data.mode
    const left = this.data.left
    const right = this.data.right
    if (!left || !right) return []
    const value = (item: DrinkDetail, key: string): string => {
      if (key === 'scene') {
        const scenes = Array.isArray(item.scene) ? item.scene : []
        if (scenes.length) return scenes.join('、')
      }
      const raw = item.attributes?.[key]
      if (Array.isArray(raw)) return raw.join('、')
      if (raw != null && raw !== '') return String(raw)
      return '—'
    }
    const rows = (this.data.compareRows[mode] || []).map(({ key, label }) => ({
      key,
      label,
      left: value(left, key),
      right: value(right, key),
    }))
    this.setData({ rows })
    return rows
  },

  // ---------- 交互 ----------

  onOpenDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string
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

  /** 产品图加载失败：换占位图（只 setData data-path 对应字段） */
  onImgError(e: WechatMiniprogram.CustomEvent) {
    const patch = imageErrorPatch(e)
    if (patch) this.setData(patch)
  },
})
