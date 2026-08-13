/**
 * lib/core.ts 纯函数单测：
 * - enumCn 枚举中文（命中/未命中回退/空值）
 * - triState 三态循环（NONE→WANT→EXCLUDE→NONE）
 * - safeArea / px2rpx / clamp 通用工具
 *
 * 测试不依赖 wx / getApp，纯函数断言（vitest node 环境）。
 */
import { describe, it, expect } from 'vitest'
import {
  enumCn,
  triState,
  safeArea,
  px2rpx,
  clamp,
  type EnumsDict,
  type TriState,
} from '../lib/core'

// 与 server/app/data/enums.json 同构的字典 fixture
const DICT: EnumsDict = {
  domain: { COFFEE: '咖啡', COCKTAIL: '鸡尾酒' },
  temperature: { HOT: '热饮', COLD: '冷饮', VARIABLE: '可变温度' },
  alcohol_state: { NONE: '无酒精', CONTAINS: '含酒精', UNKNOWN: '酒精度未知' },
  unit: { ML: '毫升', G: '克' },
}

describe('enumCn 枚举中文', () => {
  it('命中返回中文', () => {
    expect(enumCn('domain', 'COFFEE', DICT)).toBe('咖啡')
    expect(enumCn('temperature', 'HOT', DICT)).toBe('热饮')
    expect(enumCn('alcohol_state', 'UNKNOWN', DICT)).toBe('酒精度未知')
  })

  it('未命中 code 回退原值', () => {
    expect(enumCn('domain', 'TEA', DICT)).toBe('TEA')
    expect(enumCn('no-such-category', 'X', DICT)).toBe('X')
  })

  it('空值返回空串', () => {
    expect(enumCn('domain', null, DICT)).toBe('')
    expect(enumCn('domain', undefined, DICT)).toBe('')
    expect(enumCn('domain', '', DICT)).toBe('')
  })

  it('显式 dict 优先于注册表（缺省 dict 时回退原值）', () => {
    expect(enumCn('domain', 'COFFEE')).toBe('COFFEE')
    expect(enumCn('domain', 'COCKTAIL', DICT)).toBe('鸡尾酒')
  })
})

describe('triState 三态循环', () => {
  const cycle: TriState[] = ['NONE', 'WANT', 'EXCLUDE']

  it('NONE → WANT → EXCLUDE → NONE', () => {
    let s: TriState = 'NONE'
    for (let i = 0; i < 6; i += 1) {
      expect(s).toBe(cycle[i % 3])
      s = triState(s)
    }
  })

  it('缺省/空值视为 NONE，下一步为 WANT', () => {
    expect(triState()).toBe('WANT')
    expect(triState(null)).toBe('WANT')
    expect(triState(undefined)).toBe('WANT')
  })

  it('未知状态按 NONE 处理（indexOf -1 → 回绕到首位 NONE）', () => {
    // TS 层面 TriState 不允许非法值；运行时防御：indexOf=-1 时 (idx+1)%3=0 → NONE
    expect(triState('WEIRD' as TriState)).toBe('NONE')
  })
})

describe('safeArea 安全区', () => {
  it('无 systemInfo 时兜底全 0', () => {
    expect(safeArea()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(safeArea(null)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
    expect(safeArea({})).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })

  it('返回拷贝而非引用', () => {
    const area = { top: 44, right: 0, bottom: 34, left: 0 }
    const out = safeArea({ safeArea: area })
    expect(out).toEqual(area)
    expect(out).not.toBe(area)
  })
})

describe('px2rpx 换算', () => {
  it('390 设计宽基准（AGENT-HANDOFF 1px≈1.923rpx）', () => {
    expect(px2rpx(390)).toBe(750)
    expect(px2rpx(195)).toBe(375)
  })

  it('1px ≈ 1.923rpx', () => {
    expect(px2rpx(1)).toBeCloseTo(1.923, 2)
  })

  it('非法屏幕宽度回退为原始 px', () => {
    expect(px2rpx(10, 0)).toBe(10)
    expect(px2rpx(10, -1)).toBe(10)
  })
})

describe('clamp', () => {
  it('夹取到 [min, max]', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})
