/**
 * 雷达归一化与 SVG 坐标计算。
 *
 * 参考契约：
 * - DTO radar：xingxun-responsive-prototype/js/api/contracts.js RadarMetric[{key,label,score 0-10}]
 * - SVG 结构：xingxun-responsive-prototype/js/pages/templates.js radarSvg()
 * - 服务器字段：server/app/schemas/contracts.py（RadarValue {code, score}）
 */

import { clamp } from './core'

/** 雷达指标 DTO（score 0-10） */
export interface RadarMetric {
  key: string
  label?: string
  score: number
}

/** 页面可渲染的归一化雷达维度 */
export interface NormalizedRadarMetric extends RadarMetric {
  /** 0-100 百分比，用于渲染条长/坐标缩放 */
  percent: number
  /** 归一化后的半径比例 0-1，用于 SVG 坐标 */
  ratio: number
}

/** 归一化上下文：原始分数范围 + 各维度解析结果 */
export interface NormalizeRadarResult {
  metrics: NormalizedRadarMetric[]
  /** 原始分数上限（数据 0-10，见 contracts.js RadarMetric） */
  maxScore: number
  labels: string[]
}

/** SVG 单点坐标（相对 viewBox 原点） */
export interface RadarPoint {
  x: number
  y: number
}

/** 雷达 SVG 渲染数据（单/双产品） */
export interface RadarChartData {
  /** 中心点 */
  center: RadarPoint
  /** 多边形顶点半径（网格外圈） */
  radius: number
  /** 顶点数（不足 3 补足） */
  count: number
  /** 网格层（内到外，如 0.25/0.5/0.75/1） */
  grid: RadarPoint[][]
  /** 轴线（中心到各顶点） */
  axes: RadarPoint[]
  /** 维度标签位置 */
  labels: RadarPoint[]
  /** 第一个产品的形状点（单产品时即自身） */
  shape: RadarPoint[]
  /** 可选第二个产品的形状点 */
  shapeSecond: RadarPoint[]
}

export const RADAR_DEFAULT_SIZE = 220
export const RADAR_DEFAULT_MAX_SCORE = 10

/**
 * 归一化 DTO radar 为页面可渲染结构。
 *
 * DTO 形态兼容：
 * - contracts.js RadarMetric[]：{key, label, score}
 * - 服务器 RadarValue[]：{code, score}
 * score 取值 0-10，逐项 clamp 到 [0, 10]。
 */
export function normalizeRadar(
  metrics: RadarMetric[] | Array<{ code: string; score: number }> | null | undefined,
  maxScore = RADAR_DEFAULT_MAX_SCORE,
): NormalizeRadarResult {
  const list = Array.isArray(metrics) ? metrics : []
  const safeMax = maxScore > 0 ? maxScore : RADAR_DEFAULT_MAX_SCORE
  const out: NormalizedRadarMetric[] = list.map((m) => {
    const key = (m as RadarMetric).key ?? (m as { code: string }).code ?? ''
    const label = (m as RadarMetric).label ?? ''
    const raw = clamp(Number(m.score) || 0, 0, safeMax)
    return {
      key,
      label,
      score: raw,
      percent: (raw / safeMax) * 100,
      ratio: raw / safeMax,
    }
  })
  return {
    metrics: out,
    maxScore: safeMax,
    labels: out.map((m) => m.label || m.key),
  }
}

/**
 * SVG 雷达图坐标计算（支持单/双产品）。
 *
 * 与 templates.js radarSvg 布局对齐：中心 (cx, cy)，半径 r，
 * 顶点自正上方（-PI/2）起顺时针等角分布。score 0-10 -> 半径比例 0-1。
 */
export function radarPoints(
  metrics: RadarMetric[] | null | undefined,
  size: number = RADAR_DEFAULT_SIZE,
): RadarChartData {
  const n = Math.max((metrics || []).length, 3)
  const center: RadarPoint = { x: size / 2, y: size / 2 }
  const radius = size / 2 - size * 0.16 // 预留标签空间
  const cx = center.x
  const cy = center.y

  const point = (i: number, scale: number): RadarPoint => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / n
    return {
      x: cx + Math.cos(angle) * radius * scale,
      y: cy + Math.sin(angle) * radius * scale,
    }
  }

  const grid: RadarPoint[][] = [0.25, 0.5, 0.75, 1].map((scale) =>
    Array.from({ length: n }, (_, i) => point(i, scale)),
  )
  const axes = Array.from({ length: n }, (_, i) => point(i, 1))
  const labels = Array.from({ length: n }, (_, i) => point(i, 1.22))

  const shapeOf = (
    data: RadarMetric[] | null | undefined,
    maxScore: number,
  ): RadarPoint[] => {
    const list = Array.isArray(data) ? data : []
    const ratio = (i: number): number => {
      const raw = clamp(Number(list[i]?.score) || 0, 0, maxScore)
      return raw / maxScore
    }
    return Array.from({ length: n }, (_, i) => point(i, ratio(i)))
  }

  return {
    center,
    radius,
    count: n,
    grid,
    axes,
    labels,
    shape: shapeOf(metrics, RADAR_DEFAULT_MAX_SCORE),
    shapeSecond: [],
  }
}

/**
 * 双产品雷达坐标：在 radarPoints 基础上附加第二个产品形状。
 * second 与 metrics 维度不一致时按索引对齐（按模板约定二者同维）。
 */
export function radarPointsCompare(
  a: RadarMetric[] | null | undefined,
  b: RadarMetric[] | null | undefined,
  size: number = RADAR_DEFAULT_SIZE,
): RadarChartData {
  const chart = radarPoints(a, size)
  chart.shapeSecond = chart.shape.map((_, i) => {
    const raw = clamp(Number(b?.[i]?.score) || 0, 0, RADAR_DEFAULT_MAX_SCORE)
    return radarShapePoint(i, chart, raw / RADAR_DEFAULT_MAX_SCORE)
  })
  return chart
}

/** 单点重算：给定索引与半径比例，返回对应坐标（radarPointsCompare 内部用） */
function radarShapePoint(i: number, chart: RadarChartData, scale: number): RadarPoint {
  const angle = -Math.PI / 2 + (i * Math.PI * 2) / chart.count
  return {
    x: chart.center.x + Math.cos(angle) * chart.radius * scale,
    y: chart.center.y + Math.sin(angle) * chart.radius * scale,
  }
}
