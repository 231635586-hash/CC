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
 * v0.3-MVP：演示控制台
 *   - 不在 App.vue 里（uni-app 对 App.vue template 处理有特殊行为）
 *   - 改由 main.ts 单独挂载独立 Vue 实例到 body（详见 main.ts:mountDemoControlPanel）
 */

import { onMounted, onUnmounted } from 'vue'

const FRAME_MIN_WIDTH = 768  // px，>= 此值触发 iPhone 14 Frame

function syncFrameMode(): void {
  if (typeof window === 'undefined') return
  const enabled = window.innerWidth >= FRAME_MIN_WIDTH
  document.documentElement.classList.toggle('hx-frame-on', enabled)
}

export default {
  onLaunch() {
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
 * 华翔司机端 H5 - 设计 Token（CSS Variables）
 * 详见 docs/standards/mobile-h5-design.md
 * 改这里一处 → 全局生效
 * ============================================== */

:root {
  /* ============================================
   * 品牌色（Linear-style 单一 accent，饱和度 < 80%）
   * ============================================ */
  --color-brand: #1677ff;
  --color-brand-hover: #4096ff;
  --color-brand-active: #0958d9;
  --color-brand-bg: #eff6ff;

  /* ============================================
   * 语义状态色（taste-skill §4.2 精简至 2 档）
   *   - success: 成功/已完成/正方向
   *   - warn:    待处理/警告
   *   - info:    进行中/中性提示
   * ============================================ */
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-success-text: #065f46;
  --color-warn: #f59e0b;
  --color-warn-bg: #fffbeb;
  --color-warn-text: #92400e;
  --color-info: #6366f1;
  --color-info-bg: #eef2ff;
  --color-info-text: #3730a3;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --color-danger-text: #991b1b;

  /* 兼容旧命名（v0.2.x 旧代码，保留过渡） */
  --color-status-pending: var(--color-warn);
  --color-status-pending-bg: var(--color-warn-bg);
  --color-status-pending-text: var(--color-warn-text);
  --color-status-entering: var(--color-info);
  --color-status-entering-bg: var(--color-info-bg);
  --color-status-entering-text: var(--color-info-text);
  --color-status-loading: var(--color-info);
  --color-status-loading-bg: var(--color-info-bg);
  --color-status-loading-text: var(--color-info-text);
  --color-status-leaving: var(--color-warn);
  --color-status-leaving-bg: var(--color-warn-bg);
  --color-status-leaving-text: var(--color-warn-text);
  --color-status-completed: var(--color-success);
  --color-status-completed-bg: var(--color-success-bg);
  --color-status-completed-text: var(--color-success-text);
  --color-status-cancelled: #8c8c8c;
  --color-status-cancelled-bg: #f5f5f5;
  --color-status-cancelled-text: #595959;

  /* ============================================
   * 中性色（暖中性 #fafaf9，taste-skill §4.2 升级）
   * ============================================ */
  --color-bg: #fafaf9;
  --color-card: #ffffff;
  --color-divider: #f0eeec;
  --color-text-primary: #1a1a1a;
  --color-text-regular: #4b5563;
  --color-text-secondary: #6b7280;
  --color-text-placeholder: #9ca3af;
  --color-text-on-brand: #ffffff;

  /* ============================================
   * 字体族（taste-skill §4.1 系统字体栈，禁 Inter 默认）
   * ============================================ */
  --font-family-sans: ui-sans-serif, system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-family-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  /* ============================================
   * 字号（a11y 提升：min 12px = 24rpx @ 750rpx 屏宽）
   * ============================================ */
  --font-size-display: 40rpx;     /* 卡片大数字（原 48rpx 略大） */
  --font-size-title: 36rpx;       /* 页面标题 */
  --font-size-card-title: 32rpx;  /* 卡片标题 */
  --font-size-body: 28rpx;        /* 正文 */
  --font-size-sub: 26rpx;         /* 副标题 */
  --font-size-caption: 24rpx;     /* 说明文字（min 12px） */
  --font-size-mini: 24rpx;        /* 极小（提到 12px） */

  /* ============================================
   * 字重（taste-skill §4.1 字重档位锁定）
   * 中文字重统一：禁止 300（部分字体不支持），用 400/500/600/700 四档
   * ============================================ */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* ============================================
   * 行高（taste-skill §4.1 行高档位锁定）
   * ============================================ */
  --line-height-snug: 1.4;     /* 标题/卡片标题 */
  --line-height-base: 1.5;     /* 正文 */
  --line-height-loose: 1.6;    /* 长段落/说明 */

  /* ============================================
   * 间距
   * ============================================ */
  --space-xs: 8rpx;
  --space-sm: 16rpx;
  --space-md: 24rpx;
  --space-lg: 32rpx;
  --space-xl: 48rpx;

  /* ============================================
   * 圆角（taste-skill §4.4 形状一致性锁定）
   * 单一档 12rpx（6px @ 750rpx 屏宽），与 Linear / iOS 风格一致
   * 旧 5 档全部 collapse 到 12rpx（pill 除外）
   *   sm=8   → 12
   *   md=12  → 12
   *   lg=16  → 12
   *   xl=24  → 12
   *   pill   → 999（药丸专用）
   * ============================================ */
  --radius-sm: 12rpx;
  --radius-md: 12rpx;
  --radius-lg: 12rpx;
  --radius-xl: 12rpx;
  --radius-pill: 999rpx;

  /* ============================================
   * 阴影（更克制，taste-skill §4.4 仅在层级需要时用）
   * ============================================ */
  --shadow-sm: 0 1rpx 2rpx rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

  /* ============================================
   * 渐变（taste-skill §4.2 浅色背景不要 AI 紫蓝渐变 → 用纯色）
   * ============================================ */
  --gradient-brand: var(--color-brand);
}

page {
  background-color: var(--color-bg);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ==========================================================
 * A11y + 物理反馈（taste-skill §4.5 触觉反馈 + §4.7 a11y）
 * ========================================================== */

/* 所有可点击 view / button 按压时给物理反馈（移动端 + 触屏关键） */
view[hover-class]:active,
button:active,
.dispatch-card:active,
.tabbar-item:active,
.card:active,
.wb-current:active,
.wb-stat:active,
.me-item:active,
.msg-card:active,
.gps-card:active,
.gps-status-card:active,
.tab-pane .info-row:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
  opacity: 0.92;
}

/* 尊重用户系统级"减少动画"设置（taste-skill §6.B 强制） */
@media (prefers-reduced-motion: reduce) {
  view[hover-class]:active,
  button:active,
  .dispatch-card:active,
  .tabbar-item:active,
  .card:active,
  .wb-current:active,
  .wb-stat:active,
  .me-item:active,
  .msg-card:active,
  .gps-card:active,
  .gps-status-card:active,
  .tab-pane .info-row:active {
    transform: none;
    transition: none;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 文字最小 12px (24rpx) — 已在 token 中锁死，防御性兜底 */
text {
  font-family: var(--font-family-sans);
}

/* 时间数字用等宽字体，避免抖动 */
.timeline-time,
.gps-pos-value,
.gps-distance-value,
.sign-link-url,
.dispatch-no {
  font-family: var(--font-family-mono);
}

/* Timeline dot 加 aria-label fallback via :before 伪元素视觉标识 */
/* （仅视觉层，语义层用 text.label 已表达） */
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
    /* Safari 优化 */
    -webkit-overflow-scrolling: touch;
  }

  /* ✅ Frame 实际生效在 #app（实测确认 #app 内才是 uni-app 内容） */
  html.hx-frame-on #app {
    width: 390px;
    height: 844px;
    max-width: 390px;
    max-height: 844px;
    flex-shrink: 0;
    background: var(--color-card);
    border-radius: 47px;
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
    flex-grow: 0;
    flex-basis: 390px;
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