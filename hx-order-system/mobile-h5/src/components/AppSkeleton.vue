<script setup lang="ts">
/**
 * v0.3.0-M2.2 + O1：通用 Loading 骨架屏组件
 *
 * 用途：数据加载中显示，避免空白闪烁
 *
 * 设计：
 *  - 多种预设类型：list（列表项）/ card（卡片）/ detail（详情页）/ kpi（KPI 卡）
 *  - count 参数控制行/卡片数
 *  - 纯 CSS 闪烁动画（uni-app 不支持 framer-motion）
 *  - 接收 loading 状态自动控制显示
 *
 * Why：当前 3 个主页面（driver/orders、salesperson、company）都有 loading.value=true
 *      状态但 template 没用到，加载中用户看到空白闪烁，体验差。
 */

interface Props {
  /** 显示模式 */
  type?: 'list' | 'card' | 'detail' | 'kpi'
  /** 行/卡片数（默认 3） */
  count?: number
  /** 是否显示 */
  show?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'list',
  count: 3,
  show: true,
})
</script>

<template>
  <view v-if="show" :class="['skeleton', `skeleton-${type}`]">
    <!-- 列表项骨架（driver 派车单 / salesperson 调车单 / company 待派车） -->
    <template v-if="type === 'list'">
      <view v-for="i in count" :key="i" class="skel-list-item">
        <view class="skel-line skel-title"></view>
        <view class="skel-line skel-row"></view>
        <view class="skel-line skel-row-short"></view>
      </view>
    </template>

    <!-- 卡片骨架（库存卡 / 调度看板卡片） -->
    <template v-else-if="type === 'card'">
      <view v-for="i in count" :key="i" class="skel-card">
        <view class="skel-line skel-card-title"></view>
        <view class="skel-line skel-row"></view>
        <view class="skel-line skel-row"></view>
        <view class="skel-line skel-row-short"></view>
      </view>
    </template>

    <!-- 详情页骨架（派车单详情） -->
    <template v-else-if="type === 'detail'">
      <view class="skel-detail-summary"></view>
      <view class="skel-card">
        <view class="skel-line skel-card-title"></view>
        <view v-for="i in 5" :key="i" class="skel-timeline-row">
          <view class="skel-dot"></view>
          <view class="skel-line skel-timeline-line"></view>
        </view>
      </view>
      <view class="skel-card">
        <view class="skel-line skel-card-title"></view>
        <view class="skel-line skel-row"></view>
        <view class="skel-line skel-row"></view>
      </view>
    </template>

    <!-- KPI 卡骨架（顶部统计行） -->
    <template v-else-if="type === 'kpi'">
      <view class="skel-kpi-row">
        <view v-for="i in count" :key="i" class="skel-kpi-card">
          <view class="skel-line skel-kpi-num"></view>
          <view class="skel-line skel-kpi-label"></view>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped>
.skeleton {
  width: 100%;
  padding: var(--space-md);
}

/* ===== 通用闪烁动画 ===== */
@keyframes skel-shimmer {
  0% { background-position: -200rpx 0; }
  100% { background-position: calc(200rpx + 100%) 0; }
}

/* ===== 基础灰条 ===== */
.skel-line {
  height: 24rpx;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg) 0%,
    var(--color-divider) 50%,
    var(--color-bg) 100%
  );
  background-size: 200rpx 100%;
  animation: skel-shimmer 1.5s infinite linear;
  margin-bottom: var(--space-sm);
}
.skel-row { width: 70%; }
.skel-row-short { width: 40%; }
.skel-title { height: 36rpx; width: 50%; margin-bottom: var(--space-md); }
.skel-card-title { height: 32rpx; width: 60%; margin-bottom: var(--space-md); }

/* ===== 列表项骨架 ===== */
.skeleton-list .skel-list-item {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}

/* ===== 卡片骨架 ===== */
.skeleton-card .skel-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}

/* ===== 详情页骨架 ===== */
.skeleton-detail .skel-detail-summary {
  background: var(--gradient-brand);
  height: 200rpx;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  margin: 0 var(--space-md) var(--space-md);
}
.skeleton-detail .skel-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin: 0 var(--space-md) var(--space-md);
  box-shadow: var(--shadow-sm);
}
.skel-timeline-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-md);
  gap: var(--space-sm);
}
.skel-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: var(--color-divider);
  flex-shrink: 0;
}
.skel-timeline-line {
  flex: 1;
  height: 20rpx;
}

/* ===== KPI 卡骨架 ===== */
.skel-kpi-row {
  display: flex;
  gap: var(--space-sm);
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.skel-kpi-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}
.skel-kpi-num {
  width: 60%;
  height: 56rpx;
}
.skel-kpi-label {
  width: 70%;
  height: 20rpx;
}
</style>