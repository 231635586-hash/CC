<script lang="ts">
/**
 * 华翔物流司机端 H5 - 根组件
 *
 * 桌面浏览器（viewport ≥ 768px）自动套 iPhone 14 外壳 Frame：
 *   - 在中央显示 390×844 CSS 像素的设备
 *   - 包含刘海 + Home Indicator + 金属中框阴影
 *   - 真机/移动浏览器保持全屏
 *
 * 设计依据：.claude/projects/-Users-roro-Vibe-coding/memory/mobile-h5-prototype-mockup-spec.md
 *   "演示稿画布是桌面浏览器尺寸，中央放手机外壳容器，移动端 UI 绘制在 Frame 内"
 *
 * v2.0 · 2026-07-15：接入 mobile-design-system skill
 *   - 设计 token 抽离到 src/styles/tokens.css
 *   - 全局样式（按钮反馈 / 触摸目标 / reduced-motion / 三态模板）抽离到 src/styles/global.css
 *   - 本文件仅保留 App.vue 特有样式（iPhone 14 Frame + Timeline dot）
 *   - Pre-Flight 12 项主要由 global.css 强制执行
 *
 * v0.3-MVP：演示控制台
 *   - 不在 App.vue 里（uni-app 对 App.vue template 处理有特殊行为）
 *   - 改由 main.ts 单独挂载独立 Vue 实例到 body（详见 main.ts:mountDemoControlPanel）
 */

import { onMounted, onUnmounted } from 'vue'
import { initGlobalErrorHandler } from './utils/errorHandler'

const FRAME_MIN_WIDTH = 768  // px，>= 此值触发 iPhone 14 Frame

function syncFrameMode(): void {
  if (typeof window === 'undefined') return
  const enabled = window.innerWidth >= FRAME_MIN_WIDTH
  document.documentElement.classList.toggle('hx-frame-on', enabled)
}

export default {
  onLaunch() {
    // O2：初始化全局错误处理（捕获 JS 错误 + Promise rejection）
    initGlobalErrorHandler()
    console.log('华翔物流 H5 启动')
    // v0.3-MVP：首次启动跳角色选择（避免直接进司机端）
    // 已选过角色（localStorage 有 hx_user_role）则不跳
    const stored = uni.getStorageSync('hx_user_role')
    if (!stored) {
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/role-select/index' })
      }, 100)
    }
  },
  onShow() {
    console.log('App Show')
  },
  setup() {
    onMounted(() => {
      syncFrameMode()
      window.addEventListener('resize', syncFrameMode)
    })
    onUnmounted(() => {
      window.removeEventListener('resize', syncFrameMode)
    })
  },
}
</script>

<style>
/* ==============================================
 * v2.0：接入 mobile-design-system skill
 *
 * 全局 token 与按钮反馈 / 触摸目标 / reduced-motion / 三态模板
 * → src/styles/global.css（@import 自动应用，含 tokens.css 链式加载）
 *
 * 本文件仅保留 App.vue 特有样式：
 *   - Timeline dot 装饰（项目 dashboard 细节）
 *   - iPhone 14 Frame 演示模式（≥768px 桌面浏览器）
 * ============================================== */

@import './styles/global.css';

/* ==============================================
 * Timeline dot decoration（项目特有细节）
 * 仅仪表盘历史时间轴使用，skill 设计 token 未覆盖
 * ============================================== */
.timeline-dot {
  position: relative;
}
.timeline-dot.done::after {
  content: '';
  position: absolute;
  inset: 4rpx;
  background: currentColor;
  border-radius: 50%;
  opacity: 0.4;
}

/* ==========================================================
 * iPhone 14 Frame（桌面浏览器演示模式）
 * 视口宽度 ≥ 768px 时启用，移动端真机保持全屏
 * 设备尺寸：390 × 844 CSS px（物理 1170 × 2532 @ 3x）
 *
 * ⚠️ uni-app H5 实际 DOM 树：
 *    body > #app > uni-app (custom element) >
 *      uni-page > uni-page-wrapper > uni-page-body > div.page
 *    自定义元素的样式必须用标签选择器（如 uni-page {}）
 *
 * v2.0：硬编码值改为 var(--frame-w / --frame-h / --frame-border-radius)
 *     token 在 tokens.css :root 中，与 skill Pre-Flight 第 1 项「tokens 一致」对齐
 * ========================================================== */
@media (min-width: 768px) {
  /* 外层：暗色舞台 + flex 居中 */
  html.hx-frame-on,
  html.hx-frame-on body {
    height: 100%;
    overflow: hidden;
  }

  html.hx-frame-on body {
    background: radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  html.hx-frame-on #app {
    width: var(--frame-w, 390px);
    height: var(--frame-h, 844px);
    max-width: 390px;
    max-height: 844px;
    flex-shrink: 0;
    background: var(--color-card);
    border-radius: var(--frame-border-radius, 47px);
    overflow: hidden;
    position: relative;
    isolation: isolate;
    transform: translateZ(0);
    /* 金属中框 + 阴影 */
    box-shadow:
      0 0 0 2px #2a2a2a,
      0 0 0 6px #1a1a1a,
      0 0 0 8px #0a0a0a,
      0 30px 60px -10px rgba(0, 0, 0, 0.55),
      0 18px 36px -18px rgba(0, 0, 0, 0.4);
  }

  /* 顶部刘海（Dynamic Island 风格） */
  html.hx-frame-on #app::before {
    content: '';
    position: absolute;
    top: 11px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 32px;
    background: #000;
    border-radius: 20px;
    z-index: 99999;
    pointer-events: none;
  }

  /* 底部 Home Indicator */
  html.hx-frame-on #app::after {
    content: '';
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 134px;
    height: 5px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 3px;
    z-index: 99999;
    pointer-events: none;
  }

  /* uni-app 标签选择器（自定义元素，无 class） */
  html.hx-frame-on uni-app {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  /* uni-page / uni-page-wrapper / uni-page-body：撑满 Frame(844px)
     注：uni-page-head 保留 height: auto(原生 nav bar 自带 ~44px 高度,详情页用) */
  html.hx-frame-on uni-page,
  html.hx-frame-on uni-page-wrapper,
  html.hx-frame-on uni-page-body {
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* uni-page-head：原生 nav bar，保留 auto 高度（orders 用 :deep() 自身隐藏） */
  html.hx-frame-on uni-page-head {
    display: block;
    position: relative;
    width: 100%;
    height: auto;
    box-sizing: border-box;
    overflow: hidden;
  }

  /* 业务 .page 容器：填满 Frame 高度，填满剩余空间 */
  html.hx-frame-on .page {
    width: 100% !important;
    max-width: 390px !important;
    min-height: 100% !important;
    max-height: 844px !important;
    box-sizing: border-box !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  /* 业务 .tabbar：position: fixed 改 absolute（相对 transformed #app） */
  html.hx-frame-on .tabbar {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 390px !important;
    z-index: 100 !important;
  }

  /* 防御：所有内容 max-width 100% */
  html.hx-frame-on #app * {
    max-width: 100%;
  }

  /* ⚠️ SVG icon 关键修复：uni-image 把 img 包了一层无 width 的 div,
     必须强制让 div + img 跟随父级 uni-image 的尺寸 */
  html.hx-frame-on uni-image {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  html.hx-frame-on uni-image img,
  html.hx-frame-on uni-image > div {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: contain !important;
  }

  /* .tooltips / .uni-mask 等弹层不应该在 Frame 中
     因为它们是 fixed 会越过 Frame — 但 1440 视口下，会越过。
     不做调整，因为弹层场景本来就是全屏的，让浏览器全屏展示是合理的 */
}

/* 移动端：保持默认全屏（无 Frame） */
@media (max-width: 767px) {
  html:not(.hx-frame-on) body {
    margin: 0;
  }
}
</style>
