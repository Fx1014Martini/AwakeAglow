/**
 * PAG 动效加载器（占位实现）。
 *
 * 背景：腾讯 libpag 的微信小程序用法是接入 `libpag` npm 包，用 PAGView 加载 `.pag`
 * 动效文件（如 `PAGView.init('/assets/pag/xxx.pag')`）。
 *
 * 当前状态：
 * - `assets/pag/` 下为占位 `.pag` 文本文件；真实 `.pag` 需用 PAG 素材工具
 *   （PAGViewer / PAG Designer / AE + PAG 导出插件）生成后替换。
 * - 若 `libpag` npm 包未接入，`playPagAnimation` 返回 CSS 过渡兜底 handle：
 *   向目标节点追加 `.pag-fallback` 类（页面 wxss 定义过渡动画），保证 UI 不阻塞。
 */

export type PagMode = 'home-hero' | 'detail-hero' | 'overlay'

/** assets/pag/ 占位文件映射（真实 .pag 接入后替换为实际文件路径） */
export const PAG_FILES: Record<PagMode, string> = {
  'home-hero': '/assets/pag/home-hero.pag',
  'detail-hero': '/assets/pag/detail-hero.pag',
  overlay: '/assets/pag/overlay.pag',
}

export interface PagPlayOptions {
  /** 播放次数，0 为无限循环（默认 1） */
  loop?: number
  /** 是否保留最后一帧（默认 false） */
  keepLastFrame?: boolean
  /** 播放结束回调（真实 PAGView 路径生效；CSS 兜底由动画自行结束） */
  onEnd?: () => void
}

export interface PagTarget {
  /** 附加 CSS 类名（CSS 过渡兜底路径使用） */
  addClass?(className: string): void
  /** 移除 CSS 类名 */
  removeClass?(className: string): void
  /** 设置行内样式 / CSS 变量（如进度） */
  setStyle?(name: string, value: string): void
}

export interface PagViewHandle {
  /** 是否为真实 libpag 渲染（false 表示 CSS 过渡兜底） */
  readonly native: boolean
  /** 当前动画文件 */
  readonly pagFile: string
  play(): void
  pause(): void
  stop(): void
  /** 释放资源（真实 PAGView 需销毁；兜底仅清理类） */
  destroy(): void
  /** 进度 0-1 */
  setProgress(value: number): void
}

// 小程序 CommonJS 环境声明（tsconfig moduleResolution: Bundler 无 node types，手工声明）
declare const require: ((id: string) => unknown) | undefined

/**
 * 探测可用的 libpag 模块。
 * 微信小程序：`require('libpag')`（npm 接入后可用），或全局注入 `wx.PAGView`。
 * 返回 null 时走 CSS 兜底。
 */
function resolveLibpag(): unknown {
  // 1) npm 包：require('libpag')
  if (typeof require === 'function') {
    try {
      const mod = require('libpag') as { PAGView?: unknown } | undefined
      if (mod && mod.PAGView) return mod.PAGView
    } catch {
      // libpag 未安装：继续探测
    }
  }
  // 2) 微信插件 / 全局注入：wx.PAGView
  if (typeof wx !== 'undefined' && (wx as { PAGView?: unknown }).PAGView) {
    return (wx as { PAGView?: unknown }).PAGView
  }
  return null
}

/**
 * CSS 过渡兜底实现：通过 target.addClass/removeClass 切换 `.pag-fallback`，
 * 页面 wxss 需为 `.pag-fallback` 定义过渡动画（如渐显/位移）。
 */
function createFallbackHandle(pagFile: string, target: PagTarget, options: PagPlayOptions): PagViewHandle {
  const loop = options.loop ?? 1
  const toggleClass = (className: string, on: boolean) => {
    if (on) target.addClass?.(className)
    else target.removeClass?.(className)
  }
  return {
    native: false,
    pagFile,
    play() {
      target.setStyle?.('--pag-loop', String(loop))
      target.setStyle?.('--pag-progress', '0')
      toggleClass('pag-fallback', true)
    },
    pause() {
      target.setStyle?.('animation-play-state', 'paused')
    },
    stop() {
      toggleClass('pag-fallback', false)
      target.setStyle?.('--pag-progress', '0')
    },
    destroy() {
      toggleClass('pag-fallback', false)
    },
    setProgress(value) {
      target.setStyle?.('--pag-progress', String(Math.max(0, Math.min(1, value))))
    },
  }
}

/**
 * 播放 PAG 动效。
 * @param target  动画承载节点（真实 PAGView 挂载点 / CSS 兜底类操作目标）
 * @param pagFile 动效文件路径（如 PAG_FILES['home-hero']）
 * @param options 播放选项
 */
export async function playPagAnimation(
  target: PagTarget | null,
  pagFile: string,
  options: PagPlayOptions = {},
): Promise<PagViewHandle> {
  const safeTarget: PagTarget = target || {}
  const libpag = resolveLibpag()
  if (libpag) {
    // 真实 libpag 路径（TODO(T9)：libpag npm 包接入后在此实现原生挂载）。
    // 接入示例：
    //   const PAG = require('libpag')
    //   await PAG.init()
    //   const view = await PAG.PAGView.init(pagFile, { canvas })
    //   view.play()
    // 接入前先返回 CSS 兜底，保证页面可用。
  }
  const handle = createFallbackHandle(pagFile, safeTarget, options)
  handle.play()
  return handle
}

/**
 * PAGView 类：面向未来的 PAG 封装，语义与真实 libpag PAGView 对齐。
 * 当前若 libpag 不可用，内部使用 CSS 过渡兜底（见 playPagAnimation）。
 */
export class PAGView {
  private handle: PagViewHandle | null = null
  private readonly pagFile: string
  private readonly options: PagPlayOptions

  constructor(pagFile: string, options: PagPlayOptions = {}) {
    this.pagFile = pagFile
    this.options = options
  }

  /** 挂载到目标节点并开始播放 */
  async mount(target: PagTarget): Promise<PagViewHandle> {
    this.handle = await playPagAnimation(target, this.pagFile, this.options)
    return this.handle
  }

  play(): void {
    this.handle?.play()
  }

  pause(): void {
    this.handle?.pause()
  }

  stop(): void {
    this.handle?.stop()
  }

  destroy(): void {
    this.handle?.destroy()
    this.handle = null
  }

  setProgress(value: number): void {
    this.handle?.setProgress(value)
  }

  get native(): boolean {
    return Boolean(this.handle?.native)
  }
}
