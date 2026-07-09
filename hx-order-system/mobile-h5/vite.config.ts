import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

/**
 * 注入 favicon link（uni-app H5 内置 HTML 模板不带 favicon，避免浏览器 404）
 */
function faviconPlugin() {
  return {
    name: 'hx-h5-favicon',
    transformIndexHtml() {
      return [
        {
          tag: 'link',
          attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
          injectTo: 'head' as const,
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [uni(), faviconPlugin()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
