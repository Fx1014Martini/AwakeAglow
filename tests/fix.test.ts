/**
 * 2026-08-17 bug 修复回归测试：
 * - MockService.recommend 无候选时抛业务错误（对齐 BFF 404 DRINK_NOT_FOUND）
 * - Store.needsAgeGate 语义：仅目标模式为 cocktail 且未确认时为 true
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '../services/mock/mock-service'
import { DRINKS } from '../services/mock/mock-data'
import { Store } from '../stores'

describe('MockService.recommend 无候选', () => {
  it('排除全部候选后抛 DRINK_NOT_FOUND（不再 TypeError）', async () => {
    const svc = new MockService()
    const allCoffee = DRINKS.filter((d) => d.mode === 'coffee').map((d) => d.id)
    await expect(svc.recommend({ mode: 'coffee', scene: '日常', excludedDrinkIds: allCoffee })).rejects.toMatchObject({
      code: 'DRINK_NOT_FOUND',
      status: 404,
    })
  })
})

describe('三态筛选契约字典', () => {
  it('getTaxonomies 返回契约 FilterOption[]（value/label），mock 与 real 同构', async () => {
    const svc = new MockService()
    const tax = await svc.getTaxonomies()
    for (const mode of ['coffee', 'cocktail'] as const) {
      for (const group of tax[mode]) {
        expect(group.options.length).toBeGreaterThan(0)
        for (const o of group.options) {
          expect(typeof o.value).toBe('string')
          expect(typeof o.label).toBe('string')
        }
      }
    }
  })
})

describe('Store.needsAgeGate 语义', () => {
  let store: Store

  beforeEach(() => {
    store = new Store(new MockService())
  })

  it('coffee 模式不需要门禁（默认当前模式）', () => {
    expect(store.needsAgeGate()).toBe(false)
  })

  it('目标 cocktail 未确认需要门禁；确认后放行', () => {
    expect(store.needsAgeGate('cocktail')).toBe(true)
    store.confirmAge()
    expect(store.needsAgeGate('cocktail')).toBe(false)
  })

  it('当前模式已是 cocktail 且未确认时，默认参数也触发门禁', () => {
    store.switchMode('cocktail')
    expect(store.needsAgeGate()).toBe(true)
  })
})
