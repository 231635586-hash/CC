<script setup lang="ts">
/**
 * 演示控制台（v0.3-MVP）
 *
 * 挂载方式：独立 Vue 实例，由 main.ts:mountDemoControlPanel 挂到 body
 * 跟主 App 不共享 pinia，但共享 localStorage（hx_user_role key）
 * 切换角色时：写 localStorage + uni.reLaunch() 主 App 重新加载到新角色首页
 *
 * 样式应用 taste-skill 纪律：
 *  - VARIANCE 5 / MOTION 3 / DENSITY 4
 *  - 形状一致性：所有元素 8px 圆角
 *  - 颜色锁定：4 角色色作为身份标识（非装饰 accent）
 *  - 反 AI-slop：无 em-dash、无版本标签、无装饰横线、无 eyebrow 滥用
 *  - 路由检测：兼容 uni-app H5 hash 路由 + getCurrentPages 双 fallback
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { UserRole } from '@/types/driver'

const STORAGE_KEY = 'hx_user_role'

const visible = ref(true)
const currentRole = ref<UserRole>('driver')
const currentRoute = ref<string>('-')

interface RoleConfig {
  role: UserRole
  label: string
  emoji: string
  color: string
  homePath: string
  defaultUserId: string
}

const roles: RoleConfig[] = [
  { role: 'driver', label: '司机', emoji: '🚚', color: '#1677ff', homePath: '/pages/driver/orders/index', defaultUserId: 'mock-driver-002' },
  { role: 'salesperson', label: '营销业务员', emoji: '📋', color: '#13c2c2', homePath: '/pages/salesperson/index', defaultUserId: 'mock-sp-001' },
  { role: 'company', label: '物流公司', emoji: '🚛', color: '#fa8c16', homePath: '/pages/company/index', defaultUserId: 'mock-co-001' },
  // ❌ v0.3.0-M2.2 删除：customer 角色(客户签收全链路已下线)
]

const driverShortcuts = [
  { key: 'workbench', label: '工作台', emoji: '📊' },
  { key: 'orders', label: '派车单', emoji: '📋' },
  { key: 'messages', label: '消息', emoji: '💬' },
  { key: 'gps', label: 'GPS', emoji: '📍' },
  { key: 'me', label: '我的', emoji: '👤' },
]

const currentRoleConfig = computed(() => roles.find((r) => r.role === currentRole.value))

function readCurrentRoleFromStorage(): UserRole {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.currentRole) return parsed.currentRole as UserRole
    }
  } catch {}
  return 'driver'
}

/**
 * 路由检测：uni-app H5 默认 hash 路由
 * 优先级：hash 解析 > getCurrentPages > pathname
 */
function getCurrentRoute(): string {
  try {
    // 1) hash 路由（uni-app H5 默认）
    const hash = window.location.hash
    const hashMatch = hash.match(/\/(pages\/[\w/-]+)/)
    if (hashMatch) return hashMatch[1]

    // 2) pathname（Vite dev 默认 / 或 /index.html）
    const path = window.location.pathname
    if (path && path !== '/' && path !== '/index.html') {
      return path.replace(/^\//, '')
    }

    // 3) uni-app getCurrentPages 全局函数（如果存在）
    const getPages = (window as any).getCurrentPages || (window as any).uni?.getCurrentPages
    if (getPages) {
      const pages = getPages()
      const last = pages[pages.length - 1]
      if (last?.route) return last.route
    }
  } catch {}
  return '-'
}

function switchToRole(role: UserRole) {
  if (role === currentRole.value) return

  const cfg = roles.find((r) => r.role === role)
  if (!cfg) return

  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed = existing ? JSON.parse(existing) : {}
    parsed.currentRole = role
    parsed.currentUserId = cfg.defaultUserId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (e) {
    console.error('[DemoControlPanel] localStorage write failed', e)
  }

  try {
    ;(uni as any).reLaunch({ url: cfg.homePath })
  } catch {
    window.location.href = cfg.homePath
  }
}

function gotoDriverTab(tab: string) {
  try {
    localStorage.setItem('ui', JSON.stringify({ activeTab: tab }))
  } catch {}
  ;(uni as any).reLaunch({ url: '/pages/driver/orders/index' })
}

/**
 * v0.3.0-M2.2：演示控制台"状态机快捷推进"按钮
 *  - 仅在 H5 端本地生效（mobile-h5 与 PC web 不同端口不共享 storage）
 *  - 通过 window CustomEvent 与主 App 通信，主 App 内修改 dispatchList
 *  - 与 PC 端的"通知入场(Mock 道闸)"对应：演示场景下让司机侧独立看到进入 entering 的效果
 */
function triggerGateOpenLocal() {
  window.dispatchEvent(new CustomEvent('demo-trigger-gate'))
  // 这里不弹 toast,主 App 内 handleTriggerGateOpen 收到事件后会反馈
}

function triggerCompleteLocal() {
  window.dispatchEvent(new CustomEvent('demo-trigger-complete'))
}

function toggleVisible() {
  visible.value = !visible.value
}

let routeTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  currentRole.value = readCurrentRoleFromStorage()
  currentRoute.value = getCurrentRoute()

  // 监听 hashchange（uni-app 路由切换时）
  window.addEventListener('hashchange', () => {
    currentRoute.value = getCurrentRoute()
  })

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      currentRole.value = readCurrentRoleFromStorage()
    }
  })

  // 兜底轮询（hashchange 不触发时）
  routeTimer = setInterval(() => {
    currentRole.value = readCurrentRoleFromStorage()
    currentRoute.value = getCurrentRoute()
  }, 1000)
})

onUnmounted(() => {
  if (routeTimer) clearInterval(routeTimer)
})
</script>

<template>
  <!-- 完整面板 -->
  <div v-if="visible" class="demo-panel">
    <!-- 标题 + 隐藏 -->
    <div class="panel-head">
      <span class="panel-title">演示控制台</span>
      <button class="panel-hide" @click="toggleVisible" title="隐藏控制台" aria-label="隐藏控制台">—</button>
    </div>

    <!-- 当前角色（紧凑 chip） -->
    <div class="section">
      <div class="section-label">当前角色</div>
      <div class="current-role-chip" :style="{ background: currentRoleConfig?.color || '#475569' }">
        <span class="chip-emoji">{{ currentRoleConfig?.emoji }}</span>
        <span class="chip-label">{{ currentRoleConfig?.label }}</span>
      </div>
    </div>

    <!-- 切换为角色（横向 2x2，紧凑） -->
    <div class="section">
      <div class="section-label">切换为</div>
      <div class="role-list">
        <button
          v-for="r in roles"
          :key="r.role"
          class="role-btn"
          :class="{ active: currentRole === r.role }"
          :style="currentRole === r.role
            ? { background: r.color, color: '#fff', borderColor: r.color }
            : { borderColor: r.color, color: r.color }"
          @click="switchToRole(r.role)"
        >
          <span class="role-emoji">{{ r.emoji }}</span>
          <span class="role-label">{{ r.label }}</span>
        </button>
      </div>
    </div>

    <!-- 快捷跳转（仅司机模式，竖向列表） -->
    <div v-if="currentRole === 'driver'" class="section">
      <div class="section-label">司机 Tab 快捷跳转</div>
      <div class="shortcut-list">
        <button
          v-for="s in driverShortcuts"
          :key="s.key"
          class="shortcut-btn"
          @click="gotoDriverTab(s.key)"
        >
          <span class="shortcut-emoji">{{ s.emoji }}</span>
          <span class="shortcut-label">{{ s.label }}</span>
          <span class="shortcut-arrow">›</span>
        </button>
      </div>
    </div>

    <!-- v0.3.0-M2.2：状态机快捷推进 -->
    <div v-if="currentRole === 'driver'" class="section">
      <div class="section-label">⏩ 状态机演示</div>
      <div class="shortcut-list">
        <button class="shortcut-btn" @click="triggerGateOpenLocal">
          <span class="shortcut-emoji">🚪</span>
          <span class="shortcut-label">模拟道闸放行(queued → entering)</span>
          <span class="shortcut-arrow">›</span>
        </button>
        <button class="shortcut-btn" @click="triggerCompleteLocal">
          <span class="shortcut-emoji">✅</span>
          <span class="shortcut-label">模拟完成(driver_confirmed → completed)</span>
          <span class="shortcut-arrow">›</span>
        </button>
      </div>
    </div>

    <!-- 当前路径 -->
    <div class="section">
      <div class="section-label">当前路径</div>
      <div class="route-text">{{ currentRoute }}</div>
    </div>

    <div class="panel-foot">仅桌面 Frame 模式显示</div>
  </div>

  <!-- 收起后的小图标 -->
  <button v-else class="demo-panel-toggle" @click="toggleVisible" title="展开控制台" aria-label="展开控制台">🎬</button>
</template>

<style scoped>
/* ============================================
 * taste-skill 应用：
 *  - 8px 单一圆角系统
 *  - 1 种 panel 背景 + 4 角色身份色（语义非装饰）
 *  - 系统字体栈（不引入 Inter）
 *  - 仅 hover/active 微动效（MOTION = 3）
 *  - 反 AI-slop：删 hairline 装饰、无 em-dash、无 eyebrow
 * ============================================ */

.demo-panel {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 268px;
  background: rgb(15 23 42 / 0.96); /* slate-900 */
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  backdrop-filter: blur(16px) saturate(160%);
  border-radius: 10px;
  border: 1px solid rgb(255 255 255 / 0.08);
  padding: 14px;
  color: rgb(241 245 249); /* slate-100，非纯白 */
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  z-index: 2147483647;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 10px 30px rgb(0 0 0 / 0.35);
  box-sizing: border-box;
  /* Safari: 防止内容可选中 */
  -webkit-user-select: none;
  user-select: none;
  /* Safari: 防止点击高亮 */
  -webkit-tap-highlight-color: transparent;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgb(255 255 255 / 0.06); /* 仅 head 留分隔,footer 不留 */
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgb(248 250 252);
}
.panel-hide {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgb(148 163 184);
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s ease, color 0.15s ease;
}
.panel-hide:hover {
  background: rgb(255 255 255 / 0.1);
  color: rgb(248 250 252);
}

.section {
  margin-bottom: 14px;
}
.section:last-of-type {
  margin-bottom: 0;
}
.section-label {
  font-size: 10.5px;
  font-weight: 500;
  color: rgb(203 213 225); /* slate-300,提亮对比度 */
  margin-bottom: 8px;
  letter-spacing: 0.02em; /* 中英文混排,从 0.04em 降到 0.02em 避免"桌面 Frame"空格怪 */
}

/* 当前角色 chip：紧凑居中 */
.current-role-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #fff;
  transition: background 0.2s ease;
}
.chip-emoji {
  font-size: 14px;
  line-height: 1;
}
.chip-label {
  letter-spacing: 0.02em;
}

/* 角色按钮：2x2 网格，横向 emoji+label 单行 */
.role-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.role-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1.5px solid;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: transform 0.12s ease, opacity 0.15s ease;
  -webkit-transition: transform 0.12s ease, opacity 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
.role-btn:hover { opacity: 0.85; }
.role-btn:active { transform: scale(0.97); -webkit-transform: scale(0.97); }
.role-emoji {
  font-size: 14px;
  line-height: 1;
}
.role-label {
  font-size: 12px;
}

/* 快捷跳转：竖向列表（readable, not compressed） */
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: rgb(255 255 255 / 0.03);
  border-radius: 8px;
  padding: 3px;
}
.shortcut-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  color: rgb(226 232 240);
  text-align: left;
  width: 100%;
  transition: background 0.12s ease;
  -webkit-transition: background 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.shortcut-btn:hover {
  background: rgb(255 255 255 / 0.06);
}
.shortcut-btn:active {
  background: rgb(255 255 255 / 0.1);
}
.shortcut-emoji {
  font-size: 14px;
  line-height: 1;
  width: 18px;
  text-align: center;
}
.shortcut-label {
  flex: 1;
  letter-spacing: 0.01em;
}
.shortcut-arrow {
  font-size: 14px;
  color: rgb(100 116 139);
  font-weight: var(--font-weight-regular, 400);
}

/* 当前路径：等宽字体 */
.route-text {
  font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, monospace;
  font-size: 11px;
  padding: 7px 10px;
  background: rgb(0 0 0 / 0.28);
  border-radius: 6px;
  color: rgb(203 213 225);
  word-break: break-all;
  line-height: 1.45;
  letter-spacing: 0;
}

/* footer：无 hairline,简洁一行说明 */
.panel-foot {
  margin-top: 14px;
  font-size: 10px;
  color: rgb(100 116 139);
  text-align: center;
  /* 中英文混排不加 letter-spacing,避免"桌面 Frame"空格怪 */
}

/* 收起后的小图标 */
.demo-panel-toggle {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgb(15 23 42 / 0.96);
  border: 1px solid rgb(255 255 255 / 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  z-index: 2147483647;
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.4);
  transition: transform 0.15s ease;
  -webkit-transition: transform 0.15s ease;
  color: rgb(241 245 249);
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
.demo-panel-toggle:hover { transform: scale(1.06); -webkit-transform: scale(1.06); }
.demo-panel-toggle:active { transform: scale(0.92); -webkit-transform: scale(0.92); }

/* 尊重减少动画（taste-skill §6.B 强制） */
@media (prefers-reduced-motion: reduce) {
  .role-btn, .shortcut-btn, .panel-hide, .demo-panel-toggle, .current-role-chip {
    transition: none !important;
  }
}
</style>