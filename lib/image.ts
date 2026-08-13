/**
 * 产品图兜底：骨架占位 + 加载失败换占位图。
 * - wxml：image 加 lazy-load + binderror="onImgError" + data-path（setData 路径，如 featured.imageUrl / drinks[{{index}}].imageUrl）
 * - 页面 handler：const patch = imageErrorPatch(e); if (patch) this.setData(patch) —— 只更新变化字段
 */

/** 加载失败兜底图（1x1 中性色 JPEG，配合 wxss 骨架背景色使用） */
export const IMG_PLACEHOLDER = '/assets/images/placeholder.jpg'

/** 由 binderror 事件生成 setData 补丁；无 data-path 时返回 null */
export function imageErrorPatch(e: WechatMiniprogram.CustomEvent): Record<string, string> | null {
  const path = (e.currentTarget?.dataset?.path as string | undefined) || ''
  if (!path) return null
  return { [path]: IMG_PLACEHOLDER }
}
