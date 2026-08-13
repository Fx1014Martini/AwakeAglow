/**
 * lib/abv.ts 纯函数单测：
 * - estimateAbv 酒精体积/总液体体积 × 稀释因子，返回 (min, max) ±2
 * - abvBand 五档边界：无酒精 / ≤10 / 10-20 / 20-30 / >30
 * - abvBandLabel / abvBandFromEstimate
 *
 * 参考契约：server/app/domain/rules.py estimate_abv + ABV_FORMULA_VERSION。
 */
import { describe, it, expect } from 'vitest'
import {
  estimateAbv,
  abvBand,
  abvBandLabel,
  abvBandFromEstimate,
  ABV_FORMULA_VERSION,
  ABV_DILUTION,
  type AbvBand,
  type AbvIngredientInput,
} from '../lib/abv'

/** contracts.js Ingredient 形态 */
const ing = (amount: number, unit: string, abv_default?: number): AbvIngredientInput => ({
  amount,
  unit,
  abv_default,
})

describe('estimateAbv', () => {
  it('无液体原料返回 (0, 0)', () => {
    expect(estimateAbv(null)).toEqual([0, 0])
    expect(estimateAbv([])).toEqual([0, 0])
    expect(estimateAbv([ing(2, 'PIECE')])).toEqual([0, 0])
    expect(estimateAbv([ing(3, 'DASH')])).toEqual([0, 0])
  })

  it('经典金汤力：40ml 金酒 40% + 120ml 汤力水 → ~8% ±2', () => {
    const [lo, hi] = estimateAbv([
      ing(40, 'ML', 40),
      ing(120, 'ML'),
    ])
    expect(lo).toBeCloseTo(8 - 2, 1)
    expect(hi).toBeCloseTo(8 + 2, 1)
  })

  it('酒精体积 = 体积 × ABV / 100，再除以总液体体积 × 稀释因子', () => {
    // 40ml*0.4 = 16ml 酒精 / 160ml 总液体 = 10% × 0.8 = 8%
    const [lo, hi] = estimateAbv([ing(40, 'ML', 40), ing(120, 'ML')], ABV_DILUTION)
    expect(lo).toBeCloseTo(6, 1)
    expect(hi).toBeCloseTo(10, 1)
  })

  it('G 按 1g≈1ml 计入总液体，但不计酒精体积（无 abv_default）', () => {
    const [lo, hi] = estimateAbv([ing(40, 'ML', 40), ing(120, 'G')])
    expect(lo).toBeCloseTo(6, 1)
    expect(hi).toBeCloseTo(10, 1)
  })

  it('自定义稀释因子生效', () => {
    const noDilution = estimateAbv([ing(40, 'ML', 40), ing(120, 'ML')], 1)
    expect(noDilution[0]).toBeCloseTo(8, 1)
    expect(noDilution[1]).toBeCloseTo(12, 1)
  })

  it('无 abv_default 的 ML 原料酒精体积为 0，但总液体参与计算（最终范围 [0, 2]）', () => {
    // finalAbv=0，范围仍按 ±2 给出（lo 钳制到 0）
    expect(estimateAbv([ing(100, 'ML')])).toEqual([0, 2])
  })
})

describe('abvBand 五档边界', () => {
  const cases: Array<[number, AbvBand]> = [
    [0, 'NONE'],
    [0.4, 'NONE'],
    [0.5, 'LOW'],
    [10, 'LOW'],
    [10.1, 'MEDIUM'],
    [20, 'MEDIUM'],
    [20.1, 'HIGH'],
    [30, 'HIGH'],
    [30.1, 'STRONG'],
    [40, 'STRONG'],
  ]
  it.each(cases)('abv %s → %s', (abv, band) => {
    expect(abvBand(abv)).toBe(band)
  })

  it('null/undefined/NaN 按 0（无酒精）处理', () => {
    expect(abvBand(null)).toBe('NONE')
    expect(abvBand(undefined)).toBe('NONE')
    expect(abvBand(Number.NaN)).toBe('NONE')
  })
})

describe('abvBandLabel', () => {
  it('返回中文名', () => {
    expect(abvBandLabel('NONE')).toBe('无酒精')
    expect(abvBandLabel('LOW')).toBe('低度数')
    expect(abvBandLabel('MEDIUM')).toBe('中度数')
    expect(abvBandLabel('HIGH')).toBe('高度数')
    expect(abvBandLabel('STRONG')).toBe('烈酒')
  })

  it('未知档回退原值', () => {
    expect(abvBandLabel('UNKNOWN' as AbvBand)).toBe('UNKNOWN')
  })
})

describe('abvBandFromEstimate', () => {
  it('按估算范围中点取档', () => {
    expect(abvBandFromEstimate([6, 10])).toBe('LOW')
    expect(abvBandFromEstimate([18, 22])).toBe('MEDIUM')
    expect(abvBandFromEstimate([28, 32])).toBe('HIGH')
    expect(abvBandFromEstimate([35, 40])).toBe('STRONG')
  })
})

describe('版本常量', () => {
  it('ABV_FORMULA_VERSION 存在', () => {
    expect(ABV_FORMULA_VERSION).toBe('abv-1')
  })
})
