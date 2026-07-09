import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

export function createApp() {
  // uni-app H5 模式下根组件必须是 App.vue（带 onLaunch/onShow 等生命周期）
  // 注意：vue 运行时即便 root 没 template 也不会真正渲染 view，只是触发 "missing template" 警告。
  // 这里显式传入 App 让 Vue 有可识别的根组件，清除控制台噪音。
  const app = createSSRApp(App)
  app.use(createPinia())
  return {
    app,
  }
}
