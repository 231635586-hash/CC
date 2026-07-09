# 华翔司机端 H5 移动端设计规范（5174 端口）

> **适用**：`mobile-h5/` 全部页面（司机端）
> **强制规范**：所有 H5 页面**必须**嵌套在 iPhone 外壳 Frame 中展示，**禁止**等比例放大到 Web 全屏。
> **设计基准**：iPhone 14 Pro 屏幕尺寸（393 × 852 pt，含安全区）。

---

## 1. 屏幕尺寸与单位

| 项 | 值 | 说明 |
|---|---|---|
| **基准宽度** | 375 rpx | iPhone 标准屏宽 |
| **基准高度** | 812 rpx | iPhone X 系列 |
| **rpx 换算** | 750rpx = 100% 屏宽 | uni-app 标准 |
| **安全区顶部** | 88 rpx | iPhone 刘海屏 |
| **安全区底部** | 34 rpx | iPhone 底部 home indicator |
| **Tabbar 高度** | 100 rpx | 移动端底部导航 |

> **rpx** = uni-app 响应式像素，**所有页面必须使用 rpx**，禁止直接用 px。

---

## 2. 颜色系统

### 2.1 品牌色

| 名称 | 颜色值 | 用途 |
|---|---|---|
| **主色（品牌蓝）** | `#1677ff` | 主按钮、Logo、强调元素 |
| **主色悬浮** | `#4096ff` | 按钮 hover/active |
| **主色浅** | `#e6f4ff` | 选中态背景、Tag 背景 |
| **主色深** | `#0958d9` | 按钮 pressed |

### 2.2 状态色（订单状态）

| 状态 | 颜色 | 背景 | 文字 | 用例 |
|---|---|---|---|---|
| **待出发** | `#faad14` | `#fff7e6` | `#874d00` | dispatched |
| **入园中** | `#13c2c2` | `#e6fffb` | `#006d75` | entering |
| **装货中** | `#722ed1` | `#f9f0ff` | `#391085` | loading |
| **出场中** | `#eb2f96` | `#fff0f6` | `#9e1068` | leaving |
| **已完成** | `#52c41a` | `#f6ffed` | `#135200` | completed |
| **已取消** | `#8c8c8c` | `#f5f5f5` | `#262626` | cancelled |

### 2.3 中性色

| 名称 | 颜色值 | 用途 |
|---|---|---|
| **背景灰** | `#f5f5f5` | 页面背景 |
| **卡片白** | `#ffffff` | 卡片背景 |
| **分割线** | `#f0f0f0` | 卡片间分隔 |
| **主文字** | `#262626` | 标题 |
| **次文字** | `#595959` | 正文 |
| **弱文字** | `#8c8c8c` | 辅助说明 |
| **占位** | `#bfbfbf` | placeholder |

---

## 3. 字号系统

| 级别 | 字号 | 字重 | 用途 |
|---|---|---|---|
| **超大标题** | 48 rpx | 700 | 启动屏、欢迎语 |
| **页面标题** | 36 rpx | 700 | 工作台顶部 |
| **卡片标题** | 32 rpx | 600 | 派车单编号、消息标题 |
| **正文** | 28 rpx | 400 | 主要内容 |
| **说明** | 26 rpx | 400 | 副标题 |
| **辅助** | 24 rpx | 400 | 时间、标签 |
| **极小** | 22 rpx | 400 | 备注、版权 |

---

## 4. 间距系统

| 级别 | 间距 | 用途 |
|---|---|---|
| **xs** | 8 rpx | 文字与图标间距 |
| **sm** | 16 rpx | 卡片内元素间距 |
| **md** | 24 rpx | 卡片内边距（标准） |
| **lg** | 32 rpx | 卡片间距 |
| **xl** | 48 rpx | 区块间距 |

---

## 5. 圆角系统

| 名称 | 圆角 | 用途 |
|---|---|---|
| **卡片** | 16 rpx | 通用卡片 |
| **按钮** | 12 rpx | 主按钮、Tag |
| **输入框** | 12 rpx | 表单输入 |
| **小标签** | 8 rpx | 状态 Tag |
| **胶囊** | 999 rpx | Tab 标签 |

---

## 6. 阴影系统

| 名称 | 阴影值 | 用途 |
|---|---|---|
| **轻** | `0 2rpx 8rpx rgba(0,0,0,0.04)` | 卡片 |
| **中** | `0 4rpx 16rpx rgba(0,0,0,0.08)` | 浮层 |
| **重** | `0 8rpx 24rpx rgba(0,0,0,0.12)` | 弹窗 |

---

## 7. 组件规范

### 7.1 卡片（最常用）

```css
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  margin-bottom: 20rpx;
}
```

### 7.2 主按钮

```css
.btn-primary {
  height: 88rpx;
  background: #1677ff;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-primary:active {
  background: #0958d9;
}
```

### 7.3 状态 Tag

```css
.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 500;
}
/* 例：待出发 */
.tag-pending { color: #874d00; background: #fff7e6; }
```

---

## 8. 🚨 iPhone 外壳 Frame（强制规范）

**所有 H5 页面在演示、截图、嵌入文档时，必须嵌套在 PhoneFrame 中**。禁止直接 Web 全屏等比例放大。

### 8.1 容器规范

```html
<view class="phone-frame">
  <view class="phone-screen">
    <!-- 真实页面内容 -->
  </view>
</view>
```

### 8.2 容器 CSS（Web 端开发参考）

```css
.phone-frame {
  width: 393px;          /* iPhone 14 Pro 屏宽 */
  height: 852px;         /* iPhone 14 Pro 屏高 */
  margin: 32px auto;
  border: 12px solid #1a1a1a;
  border-radius: 56px;   /* iPhone 圆角 */
  background: #000;
  box-shadow: 
    0 0 0 2px #2a2a2a,
    0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
  position: relative;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  overflow-y: auto;
  border-radius: 44px;
}
```

### 8.3 演示场景

- ✅ 客户演示：用 PhoneFrame 包截图
- ✅ 设计文档：HTML 嵌入 PhoneFrame 截图
- ✅ 内部沟通：浏览器预览时强制 PhoneFrame 容器
- ❌ **禁止**：直接用浏览器全屏比例看 H5

---

## 9. 路由与页面框架

### 9.1 标准页面结构

```
┌─────────────────────────────┐
│  StatusBar（系统状态栏）       │
│  ─────────────────────────── │
│  NavigationBar（导航栏）       │
│  ─────────────────────────── │
│                             │
│  Content（滚动区）            │
│                             │
│  ─────────────────────────── │
│  Tabbar（底部导航，可选）      │
└─────────────────────────────┘
```

### 9.2 5 个核心页面

| 路由 | 标题 | Tabbar? |
|---|---|---|
| `/pages/index/index` | 工作台 | ✅ |
| `/pages/driver/orders/index` | 我的派车单 | ✅ |
| `/pages/driver/push-center/index` | 消息中心 | ✅ |
| `/pages/driver/order-detail/index` | 派车单详情 | ❌ |
| `/pages/driver/gps-in/index` | GPS 入园 | ❌ |

---

## 10. 反模式（禁止）

| ❌ 反模式 | ✅ 正确做法 |
|---|---|
| 用 px 写尺寸 | 用 rpx |
| 字号直接 14 / 16 | 用规范字号 28 / 32 / 36 |
| 颜色硬编码 #ccc | 用规范颜色变量 |
| emoji 装饰图标 | 用 SVG / IconFont |
| 等比例放大 H5 到 Web | 用 PhoneFrame 容器 |
| 卡片用直角 | 用 16rpx 圆角 |
| 按钮 < 80rpx 高 | 主按钮 ≥ 88rpx |
| 多色拼接 | 主色 + 状态色，最多 3 色 |

---

## 11. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-07-09 | 创建本规范（5174 端口司机端 v1.0） |

---

**相关文档**：
- [docs/PRD/](../PRD/)：业务需求
- [docs/plans/](../plans/)：技术方案
- [docs/standards/components.md](./components.md)：共享组件规范（PC 端）