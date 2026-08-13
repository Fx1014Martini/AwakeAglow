/**
 * SVG 雷达图（Canvas 2D 实现）。
 *
 * 微信小程序 WXML 不支持 <svg>/<polygon>/<line> 标签，必须用 Canvas 2D 绘制。
 * - score 0-10，坐标计算复用 lib/radar.ts 的 radarPoints / radarPointsCompare
 * - 支持单产品（metrics）与双产品叠加（compareMetrics）
 * - metrics / compareMetrics: [{ key, label, score }] 或 [{ code, score }]
 */
import {
  radarPoints,
  radarPointsCompare,
  type RadarMetric,
} from '../../lib/radar'

type PointInput = RadarMetric[] | Array<{ code: string; score: number }> | null

function normalizeInput(input: PointInput): RadarMetric[] | null {
  if (!Array.isArray(input)) return null
  return input.map((m) => {
    const key = (m as RadarMetric).key ?? (m as { code: string }).code ?? ''
    return {
      key,
      label: (m as RadarMetric).label ?? '',
      score: Number((m as RadarMetric).score ?? (m as { code: string; score: number }).score ?? 0) || 0,
    }
  })
}

Component({
  properties: {
    metrics: { type: Array, value: [] as any[] },
    compareMetrics: { type: Array, value: [] as any[] },
    size: { type: Number, value: 220 },
    mode: { type: String, value: 'coffee' },
  },

  data: {
    canvasSize: 220,
    hasCompare: false,
    /** 供 WXML canvas 元素使用 */
    radarId: 'radar-canvas',
  },

  observers: {
    'metrics, compareMetrics, size'() {
      this.drawRadar()
    },
  },

  lifetimes: {
    attached() {
      this.drawRadar()
    },
  },

  methods: {
    drawRadar() {
      const props = this.properties
      const size = Number(props.size) > 0 ? Number(props.size) : 220
      const metrics = normalizeInput(props.metrics as PointInput)
      const compare = normalizeInput(props.compareMetrics as PointInput)
      const hasCompare = Array.isArray(compare) && compare.length > 0

      const chart = hasCompare
        ? radarPointsCompare(metrics, compare, size)
        : radarPoints(metrics, size)

      const labels = (chart.labels || []).map((_, i) => {
        const m = metrics?.[i] as RadarMetric | undefined
        return m?.label || m?.key || ''
      })

      this.setData({ canvasSize: size, hasCompare }, () => {
        // setData 回调后 canvas 节点已渲染，执行绘制
        this.renderCanvas(chart, labels)
      })
    },

    renderCanvas(chart: ReturnType<typeof radarPoints>, labels: string[]) {
      const query = this.createSelectorQuery()
      query.select('#radar-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return
          const canvas = res[0].node
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          const dpr = (typeof wx !== 'undefined' ? wx.getSystemInfoSync().pixelRatio : 2) || 2
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          const w = res[0].width
          const h = res[0].height
          ctx.clearRect(0, 0, w, h)

          // 读取 CSS 变量映射的颜色（组件无法直接读 CSS 变量，用近似值）
          // 对齐原型 app.css .radar-grid/.radar-axis/.radar-shape/.radar-label
          const isCocktail = (this.properties.mode || this.data.mode) === 'cocktail'
          // 网格/轴线：原型 stroke:var(--border)，咖啡 rgba(119,80,39,.12)，鸡尾酒 rgba(212,167,91,.16)
          const gridColor = isCocktail ? 'rgba(212,167,91,.16)' : 'rgba(119,80,39,.12)'
          const axisColor = gridColor
          // 数据形状：原型 fill:primary 34%，stroke:primary 2px
          const primaryColor = isCocktail ? '#d4a75b' : '#9c6118'
          const primaryFill = isCocktail ? 'rgba(212,167,91,.34)' : 'rgba(156,97,24,.34)'
          // 第二产品：原型 fill:rgba(102,64,35,.18)，stroke:currentColor 1px，opacity:.72
          const secondStroke = primaryColor
          const secondFill = isCocktail ? 'rgba(212,167,91,.18)' : 'rgba(102,64,35,.18)'
          // 标签：原型 fill:var(--text2)，font-size:8px
          const labelColor = isCocktail ? '#a89174' : '#806b5a'

          const cx = chart.center.x
          const cy = chart.center.y

          // 1. 网格层（4 层，原型 [.25,.5,.75,1]）
          ctx.strokeStyle = gridColor
          ctx.lineWidth = 1
          ;(chart.grid || []).forEach((ring) => {
            const pts = ring as unknown as Array<{ x: number; y: number }>
            ctx.beginPath()
            pts.forEach((p, i) => {
              if (i === 0) ctx.moveTo(p.x, p.y)
              else ctx.lineTo(p.x, p.y)
            })
            ctx.closePath()
            ctx.stroke()
          })

          // 2. 轴线（中心到各顶点）
          ctx.strokeStyle = axisColor
          ctx.lineWidth = 1
          ;(chart.axes || []).forEach((p) => {
            const pt = p as unknown as { x: number; y: number }
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(pt.x, pt.y)
            ctx.stroke()
          })

          // 3. 第二产品形状（叠加，原型 stroke-width:1, opacity:.72）
          if (this.data.hasCompare && chart.shapeSecond && chart.shapeSecond.length > 0) {
            ctx.fillStyle = secondFill
            ctx.strokeStyle = secondStroke
            ctx.lineWidth = 1
            ctx.globalAlpha = 0.72
            ctx.beginPath()
            chart.shapeSecond.forEach((p, i) => {
              const pt = p as unknown as { x: number; y: number }
              if (i === 0) ctx.moveTo(pt.x, pt.y)
              else ctx.lineTo(pt.x, pt.y)
            })
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            ctx.globalAlpha = 1
          }

          // 4. 第一产品形状（原型 stroke-width:2）
          ctx.fillStyle = primaryFill
          ctx.strokeStyle = primaryColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ;(chart.shape || []).forEach((p, i) => {
            const pt = p as unknown as { x: number; y: number }
            if (i === 0) ctx.moveTo(pt.x, pt.y)
            else ctx.lineTo(pt.x, pt.y)
          })
          ctx.closePath()
          ctx.fill()
          ctx.stroke()

          // 5. 数据顶点圆点（增强可读性，原型无此元素，作为 Canvas 2D 优化）
          ctx.fillStyle = primaryColor
          ;(chart.shape || []).forEach((p) => {
            const pt = p as unknown as { x: number; y: number }
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
            ctx.fill()
          })

          // 6. 标签（原型 font-size:8px，text-anchor:middle，dominant-baseline:middle）
          ctx.fillStyle = labelColor
          ctx.font = '8px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ;(chart.labels || []).forEach((p, i) => {
            const pt = p as unknown as { x: number; y: number }
            ctx.fillText(labels[i] || '', pt.x, pt.y)
          })
        })
    },
  },
})
