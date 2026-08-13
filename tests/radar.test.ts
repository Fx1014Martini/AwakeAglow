/**
 * lib/radar.ts 纯函数单测：
 * - normalizeRadar DTO → 渲染结构（score/percent/ratio/maxScore/labels）
 * - score 0-10 边界与非法值钳制
 * - radarPoints / radarPointsCompare SVG 坐标
 *
 * 参考契约：xingxun-responsive-prototype/js/api/contracts.js RadarMetric（score 0-10）。
 */
import { describe, it, expect } from 'vitest'
import {
  normalizeRadar,
  radarPoints,
  radarPointsCompare,
  RADAR_DEFAULT_MAX_SCORE,
  type RadarMetric,
} from '../lib/radar'

describe('normalizeRadar DTO → 渲染结构', () => {
  it('合法 DTO：score 0-10 → percent/ratio 归一化', () => {
    const input: RadarMetric[] = [
      { key: 'sweet', label: '甜度', score: 8 },
      { key: 'body', label: '醇厚度', score: 4 },
    ]
    const out = normalizeRadar(input)
    expect(out.maxScore).toBe(RADAR_DEFAULT_MAX_SCORE)
    expect(out.metrics).toHaveLength(2)
    expect(out.metrics[0]).toMatchObject({ key: 'sweet', label: '甜度', score: 8, percent: 80, ratio: 0.8 })
    expect(out.metrics[1]).toMatchObject({ key: 'body', label: '醇厚度', score: 4, percent: 40, ratio: 0.4 })
    expect(out.labels).toEqual(['甜度', '醇厚度'])
  })

  it('服务器形态 {code, score} 兼容', () => {
    const out = normalizeRadar([{ code: 'sweet', score: 6 }])
    expect(out.metrics[0]).toMatchObject({ key: 'sweet', label: '', score: 6, ratio: 0.6 })
  })

  it('score 越界钳制：负→0、>10→10', () => {
    const out = normalizeRadar([
      { key: 'a', score: -3 },
      { key: 'b', score: 12 },
    ])
    expect(out.metrics[0].score).toBe(0)
    expect(out.metrics[0].ratio).toBe(0)
    expect(out.metrics[1].score).toBe(10)
    expect(out.metrics[1].ratio).toBe(1)
  })

  it('score 缺失/非数字按 0 处理', () => {
    const out = normalizeRadar([{ key: 'a', score: Number.NaN } as unknown as RadarMetric])
    expect(out.metrics[0].score).toBe(0)
    expect(out.metrics[0].percent).toBe(0)
  })

  it('null/undefined/空数组安全返回空结构', () => {
    for (const input of [null, undefined, []]) {
      const out = normalizeRadar(input)
      expect(out.metrics).toEqual([])
      expect(out.labels).toEqual([])
      expect(out.maxScore).toBe(10)
    }
  })

  it('自定义 maxScore 生效', () => {
    const out = normalizeRadar([{ key: 'a', score: 5 }], 5)
    expect(out.maxScore).toBe(5)
    expect(out.metrics[0]).toMatchObject({ score: 5, percent: 100, ratio: 1 })
  })
})

describe('radarPoints SVG 坐标', () => {
  it('顶点数不足 3 时补足为 3', () => {
    const chart = radarPoints([{ key: 'sweet', score: 5 }])
    expect(chart.count).toBe(3)
    expect(chart.grid).toHaveLength(4)
    expect(chart.axes).toHaveLength(3)
    expect(chart.shape).toHaveLength(3)
  })

  it('坐标以中心为圆心，半径 < 尺寸一半', () => {
    const chart = radarPoints([{ key: 'sweet', score: 10 }, { key: 'body', score: 0 }], 220)
    expect(chart.center).toEqual({ x: 110, y: 110 })
    expect(chart.radius).toBeLessThan(110)
    for (const p of chart.axes) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(220)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(220)
    }
  })

  it('radarPointsCompare 附加 shapeSecond（顶点数补足为 3）', () => {
    const a: RadarMetric[] = [
      { key: 'sweet', score: 8 },
      { key: 'body', score: 4 },
    ]
    const b: RadarMetric[] = [
      { key: 'sweet', score: 2 },
      { key: 'body', score: 6 },
    ]
    const chart = radarPointsCompare(a, b)
    // 顶点数不足 3 时按模板约定补足为 3
    expect(chart.count).toBe(3)
    expect(chart.shapeSecond).toHaveLength(3)
    expect(chart.shape).toHaveLength(3)
  })
})
