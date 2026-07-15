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
  // 端口约定（HX 产品矩阵）：
  //   5173 - hx-archive-system（档案管理）
  //   5176 - hx-logistics-system（物流管理）
  //   5177 - hx-order-system（订单系统 Web）
  //   5178 - mes-workorder（扫码报工）
  //   5181 - 司机端 H5（mobile-h5，本项目，原 5174 让位给移动端原型静态服务）
  server: {
    port: 5181,
    host: '0.0.0.0',
    strictPort: true,  // 端口被占则启动失败，不自动切换（避免占用 5174 移动端原型端口）
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
