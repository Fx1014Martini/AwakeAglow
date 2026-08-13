/**
 * lib/similarity.ts 纯函数单测：
 * - jaccard / radarDistance 子函数
 * - computeSimilarity 加权合成 + 对称性 + 权重覆盖
 *
 * 参考契约：server/app/domain/rules.py compute_similarity + SIMILARITY_WEIGHTS。
 */
import { describe, it, expect } from 'vitest'
import {
  jaccard,
  radarDistance,
  computeSimilarity,
  DEFAULT_SIMILARITY_WEIGHTS,
  SIMILARITY_RULE_VERSION,
  type SimilarityInput,
} from '../lib/similarity'

const base = (over: Partial<SimilarityInput> = {}): SimilarityInput => ({
  tags: ['奶咖', '微甜'],
  radar: { sweet: 7, body: 5 },
  ingredients: ['浓缩咖啡', '燕麦奶'],
  subcategory: '咖啡拿铁',
  method: '意式萃取',
  ...over,
})

describe('jaccard', () => {
  it('完全相同为 1，完全不相交为 0，空集为 0', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(1)
    expect(jaccard(['a'], ['b'])).toBe(0)
    expect(jaccard([], ['a'])).toBe(0)
    expect(jaccard(['a'], [])).toBe(0)
  })

  it('部分交集正确', () => {
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBe(1 / 3)
    expect(jaccard(['a', 'b', 'c'], ['b', 'c', 'd'])).toBe(2 / 4)
  })
})

describe('radarDistance', () => {
  it('无共同维度返回 1', () => {
    expect(radarDistance({ a: 5 }, { b: 5 })).toBe(1)
    expect(radarDistance({}, {})).toBe(1)
  })

  it('归一化差异除以 (maxScore * 维度数)', () => {
    expect(radarDistance({ sweet: 10 }, { sweet: 0 })).toBe(1)
    expect(radarDistance({ sweet: 10 }, { sweet: 5 })).toBe(0.5)
  })
})

describe('computeSimilarity', () => {
  it('相同产品相似度为 1', () => {
    const a = base()
    expect(computeSimilarity(a, { ...a })).toBe(1)
  })

  it('对称性：sim(a,b) === sim(b,a)', () => {
    const a = base()
    const b = base({ tags: ['奶咖'], radar: { sweet: 4, body: 8 }, method: '冷萃' })
    expect(computeSimilarity(a, b)).toBeCloseTo(computeSimilarity(b, a), 10)
  })

  it('权重合成：标签 Jaccard 30% + 雷达 25% + 原料 20% + 子分类 10% + 技法 10% + 客观 5%', () => {
    // 构造仅标签共享 50% 的两产品（其余维度差异拉满）
    const a = base({ radar: { sweet: 10 }, ingredients: ['X'], subcategory: 'A', method: 'M1' })
    const b = base({ tags: ['奶咖', '冰'], radar: { sweet: 0 }, ingredients: ['Y'], subcategory: 'B', method: 'M2' })
    // tags = 1/3, radar = 0, ingredients = 0, subcategory = 0, method = 0, objective = 1
    const expected = DEFAULT_SIMILARITY_WEIGHTS.tags * (1 / 3) + DEFAULT_SIMILARITY_WEIGHTS.objective * 1
    expect(computeSimilarity(a, b)).toBeCloseTo(expected, 10)
  })

  it('objective 范围重叠比例计入 5% 权重', () => {
    const a = base({ objective: [0, 10] })
    const b = base({ objective: [5, 15] })
    // 其余维度相同 → 标签/雷达/原料/子分类/技法 = 各自权重；objective 重叠 5/10
    const w = DEFAULT_SIMILARITY_WEIGHTS
    const expected = w.tags + w.radar + w.ingredients + w.subcategory + w.method + w.objective * 0.5
    expect(computeSimilarity(a, b)).toBeCloseTo(expected, 10)
  })

  it('自定义权重覆盖默认值', () => {
    const a = base()
    const b = base({ tags: ['黑咖啡'] })
    const tagsOnly = computeSimilarity(a, b, { weights: { tags: 1, radar: 0, ingredients: 0, subcategory: 0, method: 0, objective: 0 } })
    // tags 无交集 → 0
    expect(tagsOnly).toBe(0)
  })

  it('结果钳制在 [0, 1]', () => {
    const a = base()
    const b = base({})
    const v = computeSimilarity(a, b)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(1)
  })

  it('规则版本号存在', () => {
    expect(SIMILARITY_RULE_VERSION).toBe('similarity-1')
  })
})
