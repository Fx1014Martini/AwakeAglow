/**
 * 鸡尾酒成年门禁页（文档 03 §4 安全门禁）。
 *
 * 触发：guardCocktailEntry 在切鸡尾酒模式 / 冷启动恢复 cocktail 模式 / 深链打开
 * cocktail-* 详情或对比页时，若 store.ageConfirmed 为 false 则跳转至此。
 * 确认后：有 returnUrl 则回深链目标，否则进鸡尾酒菜单；拒绝则回咖啡首页。
 */
import { store } from '../../stores/index'

const TAB_PAGES = [
  '/pages/home/index',
  '/pages/menu/index',
  '/pages/favorites/index',
  '/pages/profile/index',
]

Page({
  data: {
    returnUrl: '',
  },
  onLoad(query: { returnUrl?: string }) {
    this.setData({ returnUrl: query.returnUrl || '' })
  },
  onConfirmAge() {
    store.confirmAge()
    const { returnUrl } = this.data
    if (returnUrl) {
      const target = decodeURIComponent(returnUrl)
      if (TAB_PAGES.some((p) => target.startsWith(p))) {
        wx.switchTab({ url: target, fail: () => wx.switchTab({ url: '/pages/menu/index' }) })
      } else {
        wx.redirectTo({ url: target, fail: () => wx.switchTab({ url: '/pages/menu/index' }) })
      }
    } else {
      // 切模式场景：切到 cocktail 并进菜单页
      store.switchMode('cocktail')
      wx.switchTab({ url: '/pages/menu/index' })
    }
  },
  onDecline() {
    store.switchMode('coffee')
    wx.switchTab({ url: '/pages/home/index' })
  },
})
