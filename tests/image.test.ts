/**
 * lib/image.ts 单测：图片兜底逻辑。
 * 覆盖 IMG_PLACEHOLDER 常量 + imageErrorPatch 返回 setData 补丁。
 */
import { describe, it, expect } from 'vitest'
import { IMG_PLACEHOLDER, imageErrorPatch } from '../lib/image'

describe('image / IMG_PLACEHOLDER', () => {
  it('指向本地占位图', () => {
    expect(IMG_PLACEHOLDER).toBe('/assets/images/placeholder.jpg')
  })
})

describe('image / imageErrorPatch', () => {
  it('有 data-path 时返回单字段补丁', () => {
    const e = {
      currentTarget: { dataset: { path: 'featured.imageUrl' } },
    } as unknown as WechatMiniprogram.CustomEvent
    expect(imageErrorPatch(e)).toEqual({ 'featured.imageUrl': IMG_PLACEHOLDER })
  })

  it('不同 data-path 生成不同补丁键', () => {
    const e = {
      currentTarget: { dataset: { path: 'drinks[0].imageUrl' } },
    } as unknown as WechatMiniprogram.CustomEvent
    expect(imageErrorPatch(e)).toEqual({ 'drinks[0].imageUrl': IMG_PLACEHOLDER })
  })

  it('无 data-path 时返回 null', () => {
    const e = {
      currentTarget: { dataset: {} },
    } as unknown as WechatMiniprogram.CustomEvent
    expect(imageErrorPatch(e)).toBeNull()
  })

  it('currentTarget 缺失时返回 null', () => {
    const e = {} as WechatMiniprogram.CustomEvent
    expect(imageErrorPatch(e)).toBeNull()
  })
})
