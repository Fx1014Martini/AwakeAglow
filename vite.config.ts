import { defineConfig } from 'vitest/config';
import UnoCSS from '@unocss/vite';

/**
 * Vite 配置。
 * @unocss/vite 插件用于在构建时生成 styles/uno.css。
 * build 输出到 dist/，供小程序工具或 CI 消费。
 */
export default defineConfig({
  plugins: [UnoCSS()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts']
  }
});
