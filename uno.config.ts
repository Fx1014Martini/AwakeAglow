import { defineConfig, presetUno } from 'unocss';

/**
 * UnoCSS 配置。
 * 扫描 src/ 与 pages/ 下的 TS/JS/WXML 中的 class，生成 styles/uno.css。
 * 小程序运行时通过 app.wxss 引入生成产物（或按页面拆分注入）。
 */
export default defineConfig({
  // 微信小程序 WXSS 不支持 `*` 通配符、`\` 转义类名、CSS 变量 reset：
  //  - preflight: false 关闭默认 `*,::before,::after{...}` reset
  //  - 内容源仅指向 src/uno-usage.ts 白名单，避免从组件 wxml/wxss 误提取
  //    `hidden`/`block`/`tab` 等类名导致生成微信不兼容的原子类
  presets: [
    presetUno({
      preflight: false
    })
  ],
  extractors: [],
  content: {
    filesystem: ['src/uno-usage.{ts,js}'],
    inline: []
  },
  theme: {
    colors: {
      // 咖啡暖纸主题
      coffee: {
        bg: '#F8F2E9',
        elevated: '#FFFDF8',
        text: '#3B2A21',
        muted: '#695D54',
        primary: '#B94727'
      },
      // 鸡尾酒深莓主题
      cocktail: {
        bg: '#1A1423',
        elevated: '#241C33',
        text: '#F4ECFF',
        muted: '#A89BC8',
        primary: '#E4588C'
      }
    }
  },
  shortcuts: {
    'safe-bottom': 'pb-[env(safe-area-inset-bottom)]',
    'safe-top': 'pt-[env(safe-area-inset-top)]'
  }
});
