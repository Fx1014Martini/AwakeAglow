/**
 * 鸡尾酒成年门禁（对齐 miniprogram/pages/cocktail/index.js age gate，文档 03 §4）。
 *
 * 触发条件：进入鸡尾酒领域内容前（切模式 / 冷启动恢复 cocktail 模式 / 深链打开
 * cocktail-* 详情或对比页），若 store.ageConfirmed 为 false 则先展示门禁页。
 * 持久化：确认态写入 store（storage），跨启动稳定；单向置位，无清除入口。
 * 咖啡模式不受影响（guardCocktailEntry 对 coffee 直接放行）。
 */
import { store } from '../stores/index'

/** 门禁页路由（主包页面，已注册 app.json） */
export const AGE_GATE_PAGE = '/pages/age-gate/index'

/**
 * 进入鸡尾酒领域守卫：未确认则跳门禁页并返回 true（调用方中止本次进入）；
 * 已确认或目标非 cocktail 返回 false（放行）。
 *
 * @param returnUrl 可选：确认后门禁页 redirectTo 回该地址（深链场景用，需已 encodeURIComponent）
 */
export function guardCocktailEntry(returnUrl?: string): boolean {
  if (!store.needsAgeGate()) return false
  const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''
  wx.navigateTo({
    url: `${AGE_GATE_PAGE}${query}`,
    fail: () => {
      // navigateTo 失败（页面栈满等极端场景）退化为 redirectTo，保证门禁不被绕过
      wx.redirectTo({ url: `${AGE_GATE_PAGE}${query}` })
    },
  })
  return true
}

/** drinkId 是否属鸡尾酒领域（契约 drinkId 前缀复用产品 code，DECISIONS §1） */
export function isCocktailDrinkId(id: string | undefined | null): boolean {
  return typeof id === 'string' && id.indexOf('cocktail-') === 0
}
