/**
 * 三态筛选应用集成测试：
 * - Store.cycleFilter 三态循环（复用 lib/core.ts triState 纯函数）
 * - 构建 filters（menu 页 buildFilters 语义：WANT→want[] / EXCLUDE→exclude[]）
 * - MockService.listDrinks 按 filters 应用三态筛选（无网络，本地 mock 数据）
 *
 * 覆盖 T10 第 6 类：三态筛选应用。纯 Node 环境，不触网。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Store, type StoreMode } from '../stores'
import { MockService } from '../services/mock/mock-service'
import { DRINKS } from '../services/mock/mock-data'
import type { AppService } from '../services/index'

describe('Store.cycleFilter 三态循环', () => {
  let store: Store

  beforeEach(() => {
    store = new Store(new MockService())
  })

  it('同一选项循环 NONE→WANT→EXCLUDE→NONE', () => {
    const mode: StoreMode = 'coffee'
    store.switchMode(mode)

    store.cycleFilter('milk', '燕麦奶')
    expect(store.state.filters.coffee.milk?.['燕麦奶']).toBe('WANT')

    store.cycleFilter('milk', '燕麦奶')
    expect(store.state.filters.coffee.milk?.['燕麦奶']).toBe('EXCLUDE')

    store.cycleFilter('milk', '燕麦奶')
    expect(store.state.filters.coffee.milk?.['燕麦奶']).toBe('NONE')
    // NONE 状态仍保留键（值为 NONE），与页面 buildFilters 一致（跳过空）
  })

  it('coffee/cocktail 双模式筛选隔离', () => {
    store.switchMode('coffee')
    store.cycleFilter('milk', '燕麦奶')
    store.switchMode('cocktail')
    store.cycleFilter('baseSpirit', '金酒')

    expect(store.state.filters.coffee.milk?.['燕麦奶']).toBe('WANT')
    expect(store.state.filters.cocktail.milk?.['燕麦奶']).toBeUndefined()
    expect(store.state.filters.cocktail.baseSpirit?.['金酒']).toBe('WANT')
  })

  it('resetFilters 清空当前模式', () => {
    store.switchMode('coffee')
    store.cycleFilter('milk', '燕麦奶')
    store.resetFilters()
    expect(store.state.filters.coffee).toEqual({})
  })
})

/** 与 pages/menu/index.ts buildFilters 同构的纯函数：入参为 store.state.filters[mode] */
function buildFilters(state: Record<string, Record<string, string>>): Record<
  string,
  { want?: string[]; exclude?: string[] }
> {
  const out: Record<string, { want?: string[]; exclude?: string[] }> = {}
  Object.entries(state || {}).forEach(([key, category]) => {
    const want: string[] = []
    const exclude: string[] = []
    Object.entries(category || {}).forEach(([option, tri]) => {
      if (tri === 'WANT') want.push(option)
      if (tri === 'EXCLUDE') exclude.push(option)
    })
    if (want.length || exclude.length) out[key] = { want, exclude }
  })
  return out
}

describe('三态筛选应用（MockService.listDrinks）', () => {
  let store: Store
  let service: MockService

  beforeEach(() => {
    service = new MockService()
    store = new Store(service)
  })

  it('WANT：命中所有选项才保留（milk=燕麦奶）', async () => {
    store.switchMode('coffee')
    store.cycleFilter('milk', '燕麦奶')
    const filters = buildFilters(store.state.filters.coffee)

    const res = await service.listDrinks({ mode: 'coffee', filters, pageSize: 100 })
    expect(res.total).toBeGreaterThan(0)
    for (const item of res.items) {
      const milk = item.attributes.milk
      const values = Array.isArray(milk) ? milk : [milk]
      expect(values).toContain('燕麦奶')
    }
  })

  it('EXCLUDE：排除命中选项的产品（milk=牛奶）', async () => {
    store.switchMode('coffee')
    store.cycleFilter('milk', '牛奶')
    store.cycleFilter('milk', '牛奶')
    expect(store.state.filters.coffee.milk?.['牛奶']).toBe('EXCLUDE')
    const filters = buildFilters(store.state.filters.coffee)

    const res = await service.listDrinks({ mode: 'coffee', filters, pageSize: 100 })
    const allCoffee = DRINKS.filter((d) => d.mode === 'coffee')
    expect(res.total).toBeLessThan(allCoffee.length)
    for (const item of res.items) {
      const milk = item.attributes.milk
      const values = Array.isArray(milk) ? milk : [milk]
      expect(values).not.toContain('牛奶')
    }
  })

  it('未选状态（NONE）不参与筛选：结果与全部产品一致', async () => {
    const res = await service.listDrinks({ mode: 'coffee', filters: {}, pageSize: 100 })
    const allCoffee = DRINKS.filter((d) => d.mode === 'coffee')
    expect(res.total).toBe(allCoffee.length)
  })
})

describe('F6 交互修复', () => {
  describe('Store.switchMode 清空 keyword/detailTab', () => {
    let store: Store

    beforeEach(() => {
      store = new Store(new MockService())
    })

    it('模式切换后 keyword 与 detailTab 复位', () => {
      store.setKeyword('燕麦')
      store.setDetailTab('recipe')
      store.switchMode('cocktail')
      expect(store.state.keyword).toBe('')
      expect(store.state.detailTab).toBe('overview')
    })
  })

  describe('Store.toggleFavoriteLocal 顺序更新（失败不改状态）', () => {
    it('成功后才更新 favorites：失败不残留乐观状态', async () => {
      const failing = {
        toggleFavorite: vi.fn().mockRejectedValue(new Error('network down')),
      } as unknown as Pick<AppService, 'toggleFavorite'>
      const store = new Store(failing as unknown as AppService)
      const before = store.state.favorites
      const result = await store.toggleFavoriteLocal('coffee-oat-latte')
      expect(result.ok).toBe(false)
      expect(store.state.favorites).toEqual(before)
    })

    it('成功后以服务端 favorites 为准更新', async () => {
      const ok = {
        toggleFavorite: vi.fn().mockResolvedValue({ favorite: true, favorites: ['coffee-oat-latte', 'coffee-latte'] }),
      } as unknown as Pick<AppService, 'toggleFavorite'>
      const store = new Store(ok as unknown as AppService)
      const result = await store.toggleFavoriteLocal('coffee-latte')
      expect(result.ok).toBe(true)
      expect(store.state.favorites).toEqual(['coffee-oat-latte', 'coffee-latte'])
    })
  })

  describe('MockService.recommend 排除已展示饮品（换一杯）', () => {
    let service: MockService

    beforeEach(() => {
      service = new MockService()
    })

    it('两次推荐返回不同饮品', async () => {
      const first = await service.recommend({ mode: 'coffee', scene: '换一杯' })
      expect(first.drink).toBeTruthy()
      const second = await service.recommend({ mode: 'coffee', scene: '换一杯', excludedDrinkIds: [first.drink.id] })
      expect(second.drink).toBeTruthy()
      expect(second.drink.id).not.toBe(first.drink.id)
    })
  })
})
