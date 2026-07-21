<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-1：调度看板（公司视角）
 *
 * 设计：D2（同 Web 端 DispatchSchedulePage 一致逻辑）— 调度员在路上跟进
 *
 * 与 Web 端功能对齐：
 *  - 4 KPI：待派车 / 运输中 / 今日已完成 / 可派车辆
 *  - 4 Tab：全部 / 待派车 / 运输中 / 已完成
 *  - 关键词筛选：dispatchNo / customerName / yardName / driverName / vehicleNo
 *  - 待派车 Tab：派车按钮触发 AssignDispatchModal
 *
 * 业务流：
 *  - 待派车 Tab：confirmed 状态 → 派车 → dispatched
 *  - 运输中 Tab：dispatched/queued/entering/loading/leaving/in_transit/arrived/driver_confirmed
 *  - 已完成 Tab：completed（今日）/ cancelled
 *
 * 数据：dispatches (props from company/index.vue, 已按 companyName 筛选)
 */

import { computed, ref } from 'vue'
import type { DispatchMock, DispatchStatus } from '@/mock/dispatches'
import { MOCK_VEHICLES } from '@/mock/vehicles'
import EmptyState from '@/components/EmptyState.vue'
import AppSearch from '@/components/AppSearch.vue'

type ScheduleSubTab = 'all' | 'pending' | 'inProgress' | 'completed'

const props = defineProps<{
  dispatches: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'assign', item: DispatchMock): void
}>()

// ===== 4 KPI 计算 =====
const PENDING_STATUSES: DispatchStatus[] = ['confirmed']
const IN_PROGRESS_STATUSES: DispatchStatus[] = [
  'dispatched',
  'queued',
  'entering',
  'loading',
  'leaving',
  'in_transit',
  'arrived',
  'driver_confirmed',
]
const COMPLETED_STATUSES: DispatchStatus[] = ['completed', 'cancelled']

const kpiPending = computed(() => props.dispatches.filter((d) => PENDING_STATUSES.includes(d.status)).length)
const kpiInProgress = computed(() => props.dispatches.filter((d) => IN_PROGRESS_STATUSES.includes(d.status)).length)
const kpiCompletedToday = computed(() => {
  // mock 阶段简化：只看 completed 状态的总数（P1-1 不实现"今日"过滤）
  return props.dispatches.filter((d) => d.status === 'completed').length
})
const kpiAvailableVehicles = computed(() => {
  // 从 props.dispatches 推断 companyId（取第一个 dispatch）
  const sample = props.dispatches[0]
  if (!sample) return 0
  return MOCK_VEHICLES.filter((v) => v.companyId === sample.companyId).length
})

// ===== 4 Tab 切换 =====
const activeSubTab = ref<ScheduleSubTab>('pending')

// ===== 关键词筛选 =====
const keyword = ref('')
const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  // 第一层：按 Tab 过滤
  let list = props.dispatches
  if (activeSubTab.value === 'pending') {
    list = list.filter((d) => PENDING_STATUSES.includes(d.status))
  } else if (activeSubTab.value === 'inProgress') {
    list = list.filter((d) => IN_PROGRESS_STATUSES.includes(d.status))
  } else if (activeSubTab.value === 'completed') {
    list = list.filter((d) => COMPLETED_STATUSES.includes(d.status))
  }
  // 第二层：关键词筛选
  if (!kw) return list
  return list.filter((d) => {
    const haystack = [
      d.dispatchNo,
      d.customerName,
      d.yardNames.join('、'),
      d.driverName || '',
      d.vehicleNo || '',
      d.companyName,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(kw)
  })
})

function formatDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function statusLabel(status: DispatchStatus): string {
  const map: Record<DispatchStatus, string> = {
    draft: '草稿',
    pending_confirm: '待确认',
    confirmed: '已确认',
    dispatching: '派车中',
    dispatched: '已派车',
    queued: '排队中',
    entering: '入园中',
    loading: '装货中',
    leaving: '出场中',
    in_transit: '在途中',
    arrived: '已到达',
    driver_confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function emptyForTab(tab: ScheduleSubTab): { title: string; desc: string } {
  if (tab === 'pending') return { title: '暂无待派车', desc: '已确认的调车单会出现在这里' }
  if (tab === 'inProgress') return { title: '暂无运输中', desc: '已派车的调车单会出现在这里' }
  if (tab === 'completed') return { title: '暂无已完成', desc: '已完成的调车单会出现在这里' }
  return { title: '暂无调车单', desc: '本公司所有调车单会出现在这里' }
}
</script>

<template>
  <view class="tab-pane">
    <!-- ===== 4 KPI 卡 ===== -->
    <view class="kpi-row">
      <view class="kpi-card kpi-pending">
        <text class="kpi-value">{{ kpiPending }}</text>
        <text class="kpi-label">待派车</text>
      </view>
      <view class="kpi-card kpi-progress">
        <text class="kpi-value">{{ kpiInProgress }}</text>
        <text class="kpi-label">运输中</text>
      </view>
      <view class="kpi-card kpi-completed">
        <text class="kpi-value">{{ kpiCompletedToday }}</text>
        <text class="kpi-label">今日已完成</text>
      </view>
      <view class="kpi-card kpi-vehicles">
        <text class="kpi-value">{{ kpiAvailableVehicles }}</text>
        <text class="kpi-label">可派车辆</text>
      </view>
    </view>

    <!-- ===== 关键词筛选（O5：AppSearch 统一组件） ===== -->
    <AppSearch
      v-model="keyword"
      placeholder="搜索派车单号/客户/园区/司机/车牌"
      custom-class="company-filter-search"
    />

    <!-- ===== 4 Sub Tab ===== -->
    <view class="sub-tabs">
      <view
        v-for="t in [
          { key: 'all' as ScheduleSubTab, label: '全部' },
          { key: 'pending' as ScheduleSubTab, label: '待派车' },
          { key: 'inProgress' as ScheduleSubTab, label: '运输中' },
          { key: 'completed' as ScheduleSubTab, label: '已完成' },
        ]"
        :key="t.key"
        class="sub-tab"
        :class="{ active: activeSubTab === t.key }"
        @click="activeSubTab = t.key"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- ===== 列表 / 空状态 ===== -->
    <view v-if="filteredList.length === 0" class="empty-wrap">
      <EmptyState
        icon="/static/icons/list.svg"
        :title="emptyForTab(activeSubTab).title"
        :desc="emptyForTab(activeSubTab).desc"
      />
    </view>

    <view v-else class="list">
      <view v-for="d in filteredList" :key="d.id" class="dispatch-card">
        <view class="card-head">
          <text class="dispatch-no">{{ d.dispatchNo }}</text>
          <view class="status-tag">{{ statusLabel(d.status) }}</view>
        </view>
        <view class="meta-row">
          <text class="meta-label">方向</text>
          <text class="meta-value">{{ d.direction }}</text>
          <text class="meta-divider">·</text>
          <text class="meta-label">装货</text>
          <text class="meta-value">{{ formatDate(d.expectedLoadTime) }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/customer.svg" mode="aspectFit" />
          <text class="info-label">客户</text>
          <text class="info-value ellipsis">{{ d.customerName }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/yard.svg" mode="aspectFit" />
          <text class="info-label">园区</text>
          <text class="info-value">{{ d.yardNames.join('、') }}</text>
        </view>
        <view v-if="d.driverName && d.driverName !== '-'" class="info-row">
          <image class="info-icon" src="/static/icons/user.svg" mode="aspectFit" />
          <text class="info-label">司机</text>
          <text class="info-value">{{ d.driverName }} · {{ d.vehicleNo }}</text>
        </view>

        <!-- 操作：仅待派车 Tab 显示派车按钮 -->
        <view v-if="d.status === 'confirmed'" class="card-actions">
          <button class="btn-assign" @click="emit('assign', d)">
            <image class="btn-icon" src="/static/icons/truck.svg" mode="aspectFit" />
            派车（选车辆+司机）
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding-bottom: 40rpx; }

/* ===== KPI 卡 ===== */
.kpi-row {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.kpi-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-xs);
  border-radius: var(--radius-md);
}
.kpi-value {
  font-size: 40rpx;
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-mono);
  line-height: 1.2;
}
.kpi-label {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-top: 4rpx;
}
.kpi-pending { background: rgba(250, 140, 22, 0.08); }
.kpi-pending .kpi-value { color: #fa8c16; }
.kpi-progress { background: rgba(22, 119, 255, 0.08); }
.kpi-progress .kpi-value { color: #1677ff; }
.kpi-completed { background: rgba(82, 196, 26, 0.08); }
.kpi-completed .kpi-value { color: #52c41a; }
.kpi-vehicles { background: rgba(114, 46, 209, 0.08); }
.kpi-vehicles .kpi-value { color: #722ed1; }

/* ===== O5：AppSearch 容器（仅留间距，组件自带样式） ===== */
.company-filter-search {
  margin: 0 var(--space-md) var(--space-sm);
}

/* ===== 4 Sub Tab ===== */
.sub-tabs {
  display: flex;
  background: var(--color-card);
  margin: 0 var(--space-md) var(--space-md);
  border-radius: var(--radius-md);
  padding: 4rpx;
}
.sub-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-sm) 0;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--motion-fast) var(--ease-out-quart);
}
.sub-tab.active {
  background: var(--role-company);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-semibold);
}

/* ===== 列表 ===== */
.list { padding: 0 var(--space-md); }
.empty-wrap { padding: 60rpx var(--space-md); }
.dispatch-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-bg);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
}
.status-tag {
  font-size: var(--font-size-mini);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-info-text);
  font-weight: var(--font-weight-medium);
}

.meta-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx dashed var(--color-divider);
  font-size: var(--font-size-sub);
}
.meta-label { color: var(--color-text-secondary); margin-right: 4rpx; }
.meta-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
}
.meta-divider { color: var(--color-divider); margin: 0 var(--space-xs); }

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.info-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--role-company);
}
.info-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 80rpx;
  margin-left: var(--space-xs);
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-assign {
  flex: 1;
  height: 80rpx;
  background: var(--role-company);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.btn-icon {
  width: 32rpx;
  height: 32rpx;
}
</style>