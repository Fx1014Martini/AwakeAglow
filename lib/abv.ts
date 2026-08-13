/**
 * ABV 估算与分档。
 *
 * 参考契约：server/app/domain/rules.py estimate_abv + ABV_FORMULA_VERSION。
 * 公式：sum(酒精体积 * 各自ABV) / 总液体体积 * 稀释因子，返回 (min, max)，±2 范围。
 *
 * 原料入参兼容两种形态：
 * - contracts.js Ingredient：{nameZh, nameEn, amount, unit}
 * - 服务器 RecipeIngredient：{code, name, quantity, unit, abv_default}
 */

import { clamp } from './core'

export const ABV_FORMULA_VERSION = 'abv-1'
export const ABV_DILUTION = 0.8
export const SPIRIT_ABV = 40.0
export const ABV_BAND_TOLERANCE = 2.0

/** 原料入参（兼容 contracts.js Ingredient 与服务器 RecipeIngredient） */
export interface AbvIngredientInput {
  amount?: number | string | null
  quantity?: number | string | null
  unit?: string | null
  /** 该原料的默认 ABV（%） */
  abv_default?: number | null
}

/** ABV 分档 */
export type AbvBand = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'STRONG'

export const ABV_BANDS: readonly { band: AbvBand; label: string }[] = [
  { band: 'NONE', label: '无酒精' },
  { band: 'LOW', label: '低度数' },
  { band: 'MEDIUM', label: '中度数' },
  { band: 'HIGH', label: '高度数' },
  { band: 'STRONG', label: '烈酒' },
]

/** 取原料体积；兼容 amount / quantity 字段与字符串数字 */
function ingredientVolume(ing: AbvIngredientInput): number {
  const raw = ing.amount ?? ing.quantity
  const num = typeof raw === 'number' ? raw : Number.parseFloat(raw as string)
  return Number.isFinite(num) && num > 0 ? num : 0
}

/**
 * 估算鸡尾酒 ABV 范围。返回 (min_abv, max_abv)。
 *
 * 规则（与 rules.py 对齐）：
 * - 仅 ML 液体计入总液体体积；G 按密度近似 1g ≈ 1ml 计入；
 *   非体积单位（PIECE/LEAF/DASH）不计入总液体体积。
 * - 有 abv_default 的 ML 原料计入酒精体积。
 * - 最终 = 酒精体积/总液体体积 * 100 * 稀释因子；范围 ±2。
 * - 无液体原料时返回 (0, 0)。
 */
export function estimateAbv(
  ingredients: AbvIngredientInput[] | null | undefined,
  dilution: number = ABV_DILUTION,
): [number, number] {
  const list = Array.isArray(ingredients) ? ingredients : []
  let totalVol = 0
  let alcoholVol = 0

  for (const ing of list) {
    const vol = ingredientVolume(ing)
    if (ing.unit === 'ML' || ing.unit === 'G') totalVol += vol
  }

  for (const ing of list) {
    const vol = ingredientVolume(ing)
    const abv = ing.abv_default || 0
    if (ing.unit !== 'ML' || vol <= 0 || abv <= 0) continue
    alcoholVol += (vol * abv) / 100
  }

  if (totalVol <= 0) return [0, 0]

  const finalAbv = (alcoholVol / totalVol) * 100 * dilution
  const lo = Math.max(0, finalAbv - ABV_BAND_TOLERANCE)
  const hi = finalAbv + ABV_BAND_TOLERANCE
  return [round1(lo), round1(hi)]
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

/**
 * ABV 分档：
 * 无酒精 (< 0.5) / 低度数 (≤10) / 中度数 (10-20) / 高度数 (20-30) / 烈酒 (>30)。
 */
export function abvBand(abv: number | null | undefined): AbvBand {
  const v = typeof abv === 'number' && Number.isFinite(abv) ? abv : 0
  if (v < 0.5) return 'NONE'
  if (v <= 10) return 'LOW'
  if (v <= 20) return 'MEDIUM'
  if (v <= 30) return 'HIGH'
  return 'STRONG'
}

/** 分档中文名 */
export function abvBandLabel(band: AbvBand): string {
  return ABV_BANDS.find((b) => b.band === band)?.label ?? band
}

/** 由估算范围的中点取分档（范围可能跨档，取中点） */
export function abvBandFromEstimate(range: [number, number]): AbvBand {
  return abvBand((range[0] + range[1]) / 2)
}

export { clamp }
