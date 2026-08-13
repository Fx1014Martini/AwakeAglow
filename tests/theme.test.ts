/**
 * 双主题切换机制回归测试（F4-THEME）。
 * - 选择器修复：themes.wxss 必须使用 view[data-mode] 命中根 view（page[data-mode] 永不命中）。
 * - 导航栏配色：咖啡浅底 #F8F2E9 -> 黑前景；鸡尾酒深底 #080706 -> 白前景。
 * - --xx-* 语义层 + .theme-coffee/.theme-cocktail 类支持。
 * - 无 wx 运行时（vitest node 环境）调用 applyNavigationThemeSafe 静默降级不抛错。
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NAVBAR_THEME, applyNavigationThemeSafe } from '../lib/theme'

const THEMES_WXSS = readFileSync(resolve(__dirname, '../styles/themes.wxss'), 'utf-8')

describe('双主题选择器（F4-THEME red->green）', () => {
  it('themes.wxss 使用 view[data-mode] 命中根 view（修复前 page[data-mode] 为 0）', () => {
    expect(THEMES_WXSS.match(/view\[data-mode\]/g)?.length ?? 0).toBeGreaterThan(0)
  })

  it('不再存在 page[data-mode] 死选择器', () => {
    expect(THEMES_WXSS).not.toMatch(/page\[data-mode\]/)
  })

  it('主题变量映射在 view[data-mode] 选择器块内（咖啡默认 + 鸡尾酒覆盖）', () => {
    expect(THEMES_WXSS).toMatch(/view\[data-mode\]\.page,/)
    expect(THEMES_WXSS).toMatch(/view\[data-mode\]\.page-root/)
    expect(THEMES_WXSS).toMatch(/view\[data-mode="cocktail"\]\.page,/)
    expect(THEMES_WXSS).toMatch(/--xx-bg: #080706/)
  })

  it('--xx-* 语义层已定义（业务组件解耦 TDesign）', () => {
    expect(THEMES_WXSS).toMatch(/--xx-primary/)
    expect(THEMES_WXSS).toMatch(/--xx-surface/)
    expect(THEMES_WXSS).toMatch(/--xx-text/)
    expect(THEMES_WXSS).toMatch(/--xx-card-shadow/)
  })

  it('.theme-coffee/.theme-cocktail 类选择器支持', () => {
    expect(THEMES_WXSS).toMatch(/\.theme-coffee/)
    expect(THEMES_WXSS).toMatch(/\.theme-cocktail/)
  })
})

describe('导航栏配色（F4-THEME）', () => {
  it('咖啡：浅底 #F8F2E9 配黑前景', () => {
    expect(NAVBAR_THEME.coffee.backgroundColor).toBe('#F8F2E9')
    expect(NAVBAR_THEME.coffee.frontColor).toBe('#000000')
  })

  it('鸡尾酒：深底 #080706 配白前景', () => {
    expect(NAVBAR_THEME.cocktail.backgroundColor).toBe('#080706')
    expect(NAVBAR_THEME.cocktail.frontColor).toBe('#ffffff')
  })

  it('node 环境（无 wx）调用 applyNavigationThemeSafe 静默降级不抛错', () => {
    expect(() => applyNavigationThemeSafe('cocktail')).not.toThrow()
    expect(() => applyNavigationThemeSafe('coffee')).not.toThrow()
  })
})
