/**
 * 场景发现页（pkgExplore/discover）。
 * 展示场景卡片，点击跳转对应模式并触发推荐。
 */
import { service } from '../../services/index'
import { store } from '../../stores/index'
import { applyPageTheme } from '../../lib/theme'
import { guardCocktailEntry } from '../../lib/age-gate'

interface SceneItem {
  id: string
  scene: string
  mode: 'coffee' | 'cocktail'
  desc: string
  homeScene: string
}

Page({
  data: {
    scenes: [] as SceneItem[],
    mode: 'coffee' as 'coffee' | 'cocktail',
  },

  onShow() {
    const mode = store.get().mode
    this.setData({ mode })
    service.getDiscoveryScenes().then(scenes => this.setData({ scenes: scenes as SceneItem[] }))
    applyPageTheme(this as any)
  },

  onSceneTap(e: WechatMiniprogram.TouchEvent) {
    const { id, mode } = e.currentTarget.dataset as { id: string; mode: string }
    if (mode === 'cocktail' && guardCocktailEntry(`/pkgExplore/discover/index`)) return
    if (store.get().mode !== mode) store.switchMode(mode as 'coffee' | 'cocktail')
    // BFF discovery scenes 直接含 homeScene 字段，前端不再需要本地映射表
    const scene = this.data.scenes.find((s: any) => s.id === id)
    const homeScene = scene?.homeScene as string | undefined
    if (homeScene) store.setPendingScene(homeScene)
    wx.switchTab({ url: '/pages/home/index' })
  },
})
