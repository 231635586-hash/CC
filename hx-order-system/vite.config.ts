import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Vite 配置 - 端口 5177（区分物流系统 5176 / hx-archive-system 5173，可并行对照演示）
// 部署：build 产物文件名不带 hash，preview 端口 5177
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5177,
    host: '0.0.0.0',
    open: true,
    strictPort: true,  // 端口被占则启动失败，避免占用 5176 物流端口
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: 5177,
    host: '0.0.0.0',
    open: true,
    headers: {
      // 强制所有响应不缓存（解决浏览器拿到旧 dist 的问题）
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    // 生产部署：文件名不带 hash 后缀（如 assets/index.js 而非 assets/index-abc123.js）
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
