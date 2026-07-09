<script lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'

export default {
  onLaunch() {
    console.log('华翔物流 H5 启动')
  },
  onShow() {
    console.log('App Show')
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
  /* 品牌色 */
  --color-brand: #1677ff;
  --color-brand-hover: #4096ff;
  --color-brand-active: #0958d9;
  --color-brand-bg: #e6f4ff;

  /* 状态色（订单状态 Tag） */
  --color-status-pending: #faad14;
  --color-status-pending-bg: #fff7e6;
  --color-status-pending-text: #874d00;
  --color-status-entering: #13c2c2;
  --color-status-entering-bg: #e6fffb;
  --color-status-entering-text: #006d75;
  --color-status-loading: #2f54eb;
  --color-status-loading-bg: #f0f5ff;
  --color-status-loading-text: #1d39c4;
  --color-status-leaving: #fa8c16;
  --color-status-leaving-bg: #fff7e6;
  --color-status-leaving-text: #ad4e00;
  --color-status-completed: #52c41a;
  --color-status-completed-bg: #f6ffed;
  --color-status-completed-text: #135200;
  --color-status-cancelled: #8c8c8c;
  --color-status-cancelled-bg: #f5f5f5;
  --color-status-cancelled-text: #595959;

  /* 中性色 */
  --color-bg: #f5f5f5;
  --color-card: #ffffff;
  --color-divider: #f0f0f0;
  --color-text-primary: #262626;
  --color-text-regular: #595959;
  --color-text-secondary: #8c8c8c;
  --color-text-placeholder: #bfbfbf;
  --color-text-on-brand: #ffffff;

  /* 字号 */
  --font-size-display: 48rpx;     /* 卡片大数字 */
  --font-size-title: 40rpx;       /* 页面标题 */
  --font-size-card-title: 32rpx;  /* 卡片标题 */
  --font-size-body: 28rpx;        /* 正文 */
  --font-size-sub: 26rpx;         /* 副标题 */
  --font-size-caption: 24rpx;     /* 说明文字 */
  --font-size-mini: 22rpx;        /* 极小（时间/备注） */

  /* 间距 */
  --space-xs: 8rpx;
  --space-sm: 16rpx;
  --space-md: 24rpx;
  --space-lg: 32rpx;
  --space-xl: 48rpx;

  /* 圆角 */
  --radius-sm: 8rpx;
  --radius-md: 12rpx;
  --radius-lg: 16rpx;
  --radius-xl: 24rpx;
  --radius-pill: 999rpx;

  /* 阴影 */
  --shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);

  /* 渐变 */
  --gradient-brand: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
}

page {
  background-color: var(--color-bg);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
</style>