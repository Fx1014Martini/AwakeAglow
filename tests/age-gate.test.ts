/**
 * lib/age-gate.ts 单测：鸡尾酒成年门禁守卫。
 * 覆盖 isCocktailDrinkId 纯函数 + guardCocktailEntry 跳转逻辑（mock store + wx）。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const { storeMock } = vi.hoisted(() => ({
  storeMock: {
    needsAgeGate: vi.fn(),
    confirmAge: vi.fn(),
    switchMode: vi.fn(),
  },
}))

vi.mock('../stores/index', () => ({ store: storeMock }))

import { isCocktailDrinkId, guardCocktailEntry, AGE_GATE_PAGE } from '../lib/age-gate'

describe('age-gate / isCocktailDrinkId', () => {
  it('cocktail- 前缀返回 true', () => {
    expect(isCocktailDrinkId('cocktail-martini')).toBe(true)
    expect(isCocktailDrinkId('cocktail-mojito')).toBe(true)
  })
  it('coffee- 前缀返回 false', () => {
    expect(isCocktailDrinkId('coffee-espresso')).toBe(false)
  })
  it('null/undefined/空串返回 false', () => {
    expect(isCocktailDrinkId(null)).toBe(false)
    expect(isCocktailDrinkId(undefined)).toBe(false)
    expect(isCocktailDrinkId('')).toBe(false)
  })
  it('非 cocktail- 开头返回 false', () => {
    expect(isCocktailDrinkId('cocktail')).toBe(false)
    expect(isCocktailDrinkId('some-cocktail-thing')).toBe(false)
  })
})

describe('age-gate / guardCocktailEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).wx = {
      navigateTo: vi.fn(),
      redirectTo: vi.fn(),
    }
  })

  it('需要门禁时跳转 age-gate 页并返回 true', () => {
    storeMock.needsAgeGate.mockReturnValue(true)
    const result = guardCocktailEntry()
    expect(result).toBe(true)
    expect((globalThis as any).wx.navigateTo).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining(AGE_GATE_PAGE) }),
    )
  })

  it('已确认时返回 false 不跳转', () => {
    storeMock.needsAgeGate.mockReturnValue(false)
    const result = guardCocktailEntry()
    expect(result).toBe(false)
    expect((globalThis as any).wx.navigateTo).not.toHaveBeenCalled()
  })

  it('有 returnUrl 时拼接到 URL（encodeURIComponent）', () => {
    storeMock.needsAgeGate.mockReturnValue(true)
    guardCocktailEntry('/pkgDetail/index?id=cocktail-martini')
    const call = (globalThis as any).wx.navigateTo.mock.calls[0][0]
    expect(call.url).toContain('returnUrl=')
    expect(call.url).toContain(encodeURIComponent('/pkgDetail/index?id=cocktail-martini'))
  })

  it('无 returnUrl 时 URL 不含 returnUrl 参数', () => {
    storeMock.needsAgeGate.mockReturnValue(true)
    guardCocktailEntry()
    const call = (globalThis as any).wx.navigateTo.mock.calls[0][0]
    expect(call.url).not.toContain('returnUrl')
  })
})
