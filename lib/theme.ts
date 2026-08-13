/**
 * 双主题工具（T4 主题修复）。
 * - NAVBAR_THEME：咖啡/鸡尾酒各一套原生导航栏配色，供 wx.setNavigationBarColor 使用。
 *   frontColor 仅支持 #ffffff / #000000（微信 API 约束，见 lib.wx.api.d.ts SetNavigationBarColorOption）；
 *   咖啡浅底 #F8F2E9 → 黑前景；鸡尾酒深底 #080706 → 白前景。
 * - applyNavigationTheme(mode)：把原生导航栏切到当前主题（页面 onShow 调用）。
 * - applyPageTheme(page)：按页面 data.mode 应用主题。页面只需在 onShow 里 `applyPageTheme(this)`。
 *   读取 page.data.mode（各页面从 store.mode 同步，对齐原型 app.js device.dataset.mode = state.mode）。
 *   内部 try/catch 包裹，无 wx 运行时（vitest node 环境/工具预览）静默降级。
 */
import type { StoreMode } from '../stores/index'

export interface NavbarTheme {
  /** 前景（标题/状态栏），仅 #ffffff | #000000 */
  frontColor: '#ffffff' | '#000000'
  /** 背景色，十六进制 */
  backgroundColor: string
  /** 页面 window.backgroundColor（下拉露出底色） */
  pageBackgroundColor: string
}

export const NAVBAR_THEME: Record<StoreMode, NavbarTheme> = {
  coffee: {
    frontColor: '#000000',
    backgroundColor: '#F8F2E9',
    pageBackgroundColor: '#F8F2E9',
  },
  cocktail: {
    frontColor: '#ffffff',
    backgroundColor: '#080706',
    pageBackgroundColor: '#080706',
  },
}

export function applyNavigationTheme(mode: StoreMode): void {
  const t = NAVBAR_THEME[mode]
  wx.setNavigationBarColor({
    frontColor: t.frontColor,
    backgroundColor: t.backgroundColor,
    animation: { duration: 200, timingFunc: 'easeInOut' },
  })
  wx.setBackgroundColor({ backgroundColor: t.pageBackgroundColor })
}

/** 同 applyNavigationTheme，但吞掉非微信运行时错误（vitest node 环境 / 工具预览），页面 onShow 可直接调用 */
export function applyNavigationThemeSafe(mode: StoreMode): void {
  if (typeof wx === 'undefined' || typeof wx.setNavigationBarColor !== 'function') return
  try {
    applyNavigationTheme(mode)
  } catch {
    // 工具/dev 环境个别 API 受限时静默降级，页面主题（WXSS 变量）不受影响
  }
}

/** 按页面当前 data.mode 应用原生导航栏配色（在页面 onShow 调用） */
export function applyPageTheme(page: WechatMiniprogram.Page.Instance<{ mode: StoreMode }, any>): void {
  const mode: StoreMode = page.data.mode === 'cocktail' ? 'cocktail' : 'coffee'
  applyNavigationThemeSafe(mode)
}
