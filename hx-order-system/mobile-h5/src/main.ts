import { createSSRApp, createApp as createVueApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import DemoControlPanel from './components/DemoControlPanel.vue'

/**
 * 主 App 实例 — 挂载到 #app（uni-app runtime 管理）
 */
export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return {
    app,
  }
}

/**
 * v0.3-MVP：演示控制台 — 独立 Vue 实例挂载到 body
 *
 * 为什么用独立实例？
 *  - uni-app H5 的 App.vue 是特殊文件，<template> 块可能不被处理
 *  - 用独立 Vue 实例直接 mount 到 body，绕开 uni-app 的 #app 渲染管线
 *  - DemoControlPanel 自己读 localStorage（与 roleStore 共享同一 key）
 *  - 切换角色时写 localStorage + uni.reLaunch()，主 App 重新加载到新角色
 *
 * 时机：DOMContentLoaded 后挂载（确保 body 已就绪）
 */
export function mountDemoControlPanel() {
  if (typeof document === 'undefined') return

  // 检查是否在 Frame 模式（>=768px）
  const isFrameMode = window.innerWidth >= 768
  if (!isFrameMode) return

  // 创建独立挂载点
  const mountPoint = document.createElement('div')
  mountPoint.id = 'hx-demo-control-panel-root'
  document.body.appendChild(mountPoint)

  // 创建独立 Vue 实例（用 createVueApp 别名避免跟我导出的 createApp 冲突）
  const demoApp = createVueApp(DemoControlPanel)
  demoApp.use(createPinia())
  demoApp.mount(mountPoint)

  // 暴露卸载方法（用于 hot reload）
  if (typeof window !== 'undefined') {
    ;(window as any).__hxUnmountDemoPanel?.()
    ;(window as any).__hxUnmountDemoPanel = () => {
      demoApp.unmount()
      mountPoint.remove()
    }
  }
}

// 仅在浏览器环境自动挂载
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountDemoControlPanel)
  } else {
    mountDemoControlPanel()
  }

  // 窗口 resize 时重新判断（desktop <-> tablet 切换）
  let resizeTimer: number | null = null
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      const isFrameMode = window.innerWidth >= 768
      const existing = document.getElementById('hx-demo-control-panel-root')
      if (isFrameMode && !existing) {
        mountDemoControlPanel()
      } else if (!isFrameMode && existing) {
        ;(window as any).__hxUnmountDemoPanel?.()
      }
    }, 200)
  })
}