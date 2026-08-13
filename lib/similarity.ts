/**
 * 相似度计算（权重可配置）。
 *
 * 参考契约：server/app/domain/rules.py compute_similarity + SIMILARITY_WEIGHTS。
 * 文档 02 §10：标签 Jaccard 30% / 雷达归一化距离 25% / 核心原料相似度 20% /
 * 子分类 10% / 技法 10% / 客观范围 5%。
 *
 * 各维度分数约定 0-1，雷达项按 (1 - 距离) 计入，最终为 0-1 加权和。
 */

import { clamp } from './core'

/** 相似度权重配置（默认与 server rules.py SIMILARITY_WEIGHTS 一致） */
export interface SimilarityWeights {
  tags: number
  radar: number
  ingredients: number
  subcategory: number
  method: number
  objective: number
}

export const DEFAULT_SIMILARITY_WEIGHTS: SimilarityWeights = {
  tags: 0.3,
  radar: 0.25,
  ingredients: 0.2,
  subcategory: 0.1,
  method: 0.1,
  objective: 0.05,
}

export const SIMILARITY_RULE_VERSION = 'similarity-1'

/** 参与相似度的可比较产品视图 */
export interface SimilarityInput {
  tags: string[]
  /** 雷达维度 -> 分数（DTO 0-10；内部按 maxScore 归一化到 0-1） */
  radar: Record<string, number>
  ingredients: string[]
  subcategory?: string | null
  method?: string | null
  /** 客观范围 [lo, hi]（如 ABV / 咖啡因范围） */
  objective?: [number, number] | number | null
}

export interface ComputeSimilarityOptions {
  weights?: Partial<SimilarityWeights>
  /** 雷达分数上限，默认 10（与 DTO RadarMetric score 0-10 一致） */
  radarMaxScore?: number
}

/** Jaccard 相似度 */
export function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const sa = new Set(a)
  const sb = new Set(b)
  let inter = 0
  for (const x of sa) if (sb.has(x)) inter += 1
  return inter / (sa.size + sb.size - inter)
}

/** 雷达归一化距离（与 rules.py radar_distance 一致，radarMaxScore 归一化） */
export function radarDistance(
  a: Record<string, number>,
  b: Record<string, number>,
  radarMaxScore = 10,
): number {
  const dims = Object.keys(a).filter((k) => k in b)
  if (!dims.length) return 1
  const diffSum = dims.reduce((s, d) => s + Math.abs(a[d] - b[d]), 0)
  return diffSum / (radarMaxScore * dims.length)
}

function toRange(v: [number, number] | number | null | undefined): [number, number] | null {
  if (v == null) return null
  return Array.isArray(v) ? v : [v, v]
}

/**
 * 加权相似度计算。返回 0-1。
 *
 * 与 server rules.py 对齐：
 * - tags = Jaccard
 * - radar = 1 - radarDistance（取两产品雷达共同维度）
 * - ingredients = Jaccard
 * - subcategory = 相同 1 否则 0
 * - method = 两者都有且相同 1 否则 0
 * - objective = 范围重叠比例
 */
export function computeSimilarity(
  a: SimilarityInput,
  b: SimilarityInput,
  options: ComputeSimilarityOptions = {},
): number {
  const weights: SimilarityWeights = {
    ...DEFAULT_SIMILARITY_WEIGHTS,
    ...(options.weights || {}),
  }
  const radarMaxScore = options.radarMaxScore ?? 10

  const tags = jaccard(a.tags, b.tags)
  const radar = 1 - radarDistance(a.radar, b.radar, radarMaxScore)
  const ingredients = jaccard(a.ingredients, b.ingredients)
  const subcategory = a.subcategory && a.subcategory === b.subcategory ? 1 : 0
  const method =
    a.method && b.method && a.method === b.method ? 1 : 0

  const rangeA = toRange(a.objective)
  const rangeB = toRange(b.objective)
  let objective = 1
  if (rangeA && rangeB) {
    const lo = Math.max(rangeA[0], rangeB[0])
    const hi = Math.min(rangeA[1], rangeB[1])
    objective = hi < lo ? 0 : (hi - lo) / (hi > 0 ? hi : 1)
  }

  return clamp(
    weights.tags * tags +
      weights.radar * radar +
      weights.ingredients * ingredients +
      weights.subcategory * subcategory +
      weights.method * method +
      weights.objective * objective,
    0,
    1,
  )
}
