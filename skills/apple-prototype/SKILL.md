---
name: apple-prototype
description: 当用户需要生成高保真HTML原型时使用，参考苹果设计风格，每个功能模块完成后即时确认，支持Web端和App端双平台
---

# Apple-prototype 高保真原型 Skill

## 概述

帮助产品经理快速生成苹果风格的高保真HTML原型。

**核心原则：**
- 与PRD文档紧密绑定
- 每个功能模块完成后即时确认
- 准确性优先，避免模棱两可

---

## 设计流程

### Phase 1 — PRD解析

1. 读取PRD文档内容
2. 分析功能模块结构
3. 识别页面、状态、交互场景
4. 确定目标平台（Web端/App端）

### Phase 2 — 模块确认循环

**Step 1 — 架构图输出**
- 出具中文ASCII架构图
- 清晰展示页面层级和跳转关系

**Step 2 — 方案推荐**
- 提供设计方案（含视觉参考）
- 提供备选方案（标注差异）
- 说明推荐理由

**Step 3 — 用户确认**
- 用户确认后进入原型开发
- 有疑问则沟通澄清
- 循环直到所有模块完成

### Phase 3 — 原型开发

**P0 核心（必须实现）：**
1. 动效系统 — spring动画曲线
2. 图标系统 — SVG图标（禁止emoji）
3. 状态覆盖 — 常规/空/加载/错误/边界

**P1 品质（推荐实现）：**
4. 主题切换 — 暗色/亮色双主题
5. 响应式适配 — 多断点支持
6. 交互反馈 — Modal/Drawer/Toast

---

## 平台适配

### Web端

| 约束项 | 说明 |
|--------|------|
| 响应式断点 | 桌面端（≥1200px）、平板（768-1199px）、移动端（<768px） |
| 交互方式 | 悬停、键盘导航、点击触发、拖拽 |
| 浏览器兼容 | Chrome 80+、Safari 14+、Firefox 75+、Edge 80+ |

### App端

| 约束项 | 说明 |
|--------|------|
| 安全区域 | 适配刘海屏、底部横条（使用env(safe-area-inset-*)） |
| 触控热区 | 最小44×44像素（用于按钮、列表项等可交互元素） |
| 手势处理 | 滑动（Swipe）、拖拽（Drag）、捏合缩放（Pinch）、长按（Long press） |
| 触感反馈 | momentum滚动、弹性边界（overscroll-effect） |

### 移动端汉堡菜单实现规范

```css
/* 汉堡按钮 - 3条横线，每条高度2px，间距6px */
.hamburger {
  width: 24px;
  height: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}
.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background: currentColor;
  border-radius: 1px;
  transition: transform 0.25s ease;
}

/* 展开状态 - 变为X */
.hamburger.active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger.active span:nth-child(2) {
  opacity: 0;
}
.hamburger.active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* 侧边菜单 - 从左侧滑入 */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100%;
  background: var(--bg-secondary);
  transform: translateX(-100%);
  transition: transform 0.3s var(--ease-spring);
  z-index: 1000;
  padding-top: env(safe-area-inset-top);
}
.mobile-menu.open {
  transform: translateX(0);
}

/* 遮罩层 */
.mask-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.mask-overlay.active {
  opacity: 1;
  pointer-events: auto;
}
```

---

## 色彩系统

### 主色板

```css
:root {
  /* 主色 */
  --color-primary: #007AFF;
  --color-primary-light: #4DA3FF;
  --color-primary-dark: #0056B3;

  /* 语义色 */
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-danger: #FF3B30;
  --color-info: #5AC8FA;

  /* 中性灰阶 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### 深色主题（默认）

```css
:root {
  --bg-primary: #000000;
  --bg-secondary: #1c1c1e;
  --bg-tertiary: #2c2c2e;
  --bg-elevated: rgba(255, 255, 255, 0.08);

  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.3);

  --border: rgba(255, 255, 255, 0.1);
  --divider: rgba(255, 255, 255, 0.06);
}
```

### 亮色主题

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-tertiary: #e5e5ea;
  --bg-elevated: rgba(0, 0, 0, 0.04);

  --text-primary: #1d1d1f;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-tertiary: rgba(0, 0, 0, 0.3);

  --border: rgba(0, 0, 0, 0.1);
  --divider: rgba(0, 0, 0, 0.06);
}
```

---

## 圆角系统

| 级别 | 值 | 用途 |
|------|-----|------|
| sm | 6px | 小标签、Badge |
| md | 10px | 按钮、输入框 |
| lg | 14px | 卡片、弹窗 |
| xl | 20px | 大卡片、面板 |
| full | 9999px | 圆形头像、胶囊按钮 |

---

## 动效系统

### 动效曲线

```css
/* 弹性进入（推荐） */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 平滑过渡 */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* 标准曲线 */
--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);

/* 轻微弹性 */
--ease-bounce: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### 动效时长

| 类型 | 时长 | 使用场景 |
|------|------|----------|
| 微交互 | 150ms | 按钮hover、图标切换、checkbox勾选 |
| 标准过渡 | 250ms | 主题切换、tabs切换、tooltip出现/消失 |
| 复杂动画 | 400ms | Modal出现、Drawer滑出、Panel展开、页面转场 |

### 动效与交互映射表

| 交互场景 | 动效类型 | 时长 | 曲线 |
|----------|----------|------|------|
| 按钮hover/press | scale + opacity | 150ms | ease |
| 下拉菜单展开 | translateY + opacity | 250ms | spring |
| Modal出现 | scale + opacity | 300ms | spring |
| Drawer滑入 | translateX | 300ms | spring |
| Panel展开/收起 | height + opacity | 250ms | smooth |
| Toast出现/消失 | translateY + opacity | 250ms | spring |
| Banner切换 | opacity | 400ms | ease |
| 进度条拖拽 | 实时跟随 | 0ms | linear |
| 主题切换 | 颜色渐变 | 250ms | ease |

### 常用动效

| 动效 | CSS |
|------|-----|
| 淡入 | opacity 0→1, 250ms ease |
| 滑入 | translateY 20px→0, 300ms spring |
| 缩放 | scale 0.95→1, 250ms spring |
| 展开 | height auto, 300ms smooth |

---

## SVG图标规范

**必须使用SVG图标，禁止emoji。**

图标属性：
- 线宽：1.5px - 2px
- 圆角：2px
- 尺寸：16/20/24/32px
- 颜色：currentColor

### 常用图标映射

| 功能 | SVG |
|------|-----|
| 播放 | `<polygon points="5 3 19 12 5 21 5 3"/>` |
| 暂停 | `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>` |
| 上一首 | `<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>` |
| 下一首 | `<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>` |
| 收藏 | `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>` |
| 搜索 | `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>` |
| 关闭 | `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` |
| 菜单 | `<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>` |
| 箭头 | `<polyline points="6 9 12 15 18 9"/>` |
| 勾选 | `<polyline points="20 6 9 17 4 12"/>` |
| 加号 | `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>` |
| 减号 | `<line x1="5" y1="12" x2="19" y2="12"/>` |

---

## 布局系统

### 间距

```css
/* 4px基础网格 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 栅格

```css
.grid { display: grid; gap: var(--space-4); }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
.grid-6 { grid-template-columns: repeat(6, 1fr); }
.grid-12 { grid-template-columns: repeat(12, 1fr); }

@media (max-width: 1200px) { .grid-6 { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 768px) { .grid-6, .grid-4 { grid-template-columns: repeat(2, 1fr); } }
```

### 容器

```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-6); }
.container-sm { max-width: 768px; }
.container-lg { max-width: 1440px; }
```

---

## 组件清单

### 基础组件

| 组件 | 说明 |
|------|------|
| Button | 按钮（主要/次要/文字/图标） |
| Input | 输入框（文本/密码/搜索） |
| Select | 选择器 |
| Checkbox | 复选框 |
| Radio | 单选框 |
| Switch | 开关 |
| Badge | 徽标 |
| Tag | 标签 |
| Avatar | 头像 |
| Progress | 进度条 |

### 导航组件

| 组件 | 说明 |
|------|------|
| Tabs | 标签页 |
| Breadcrumb | 面包屑 |
| Pagination | 分页 |
| Steps | 步骤条 |

### 反馈组件

| 组件 | 说明 |
|------|------|
| Modal | 模态弹窗 |
| Drawer | 侧边抽屉 |
| Toast | 轻提示 |
| Tooltip | 鼠标悬浮提示 |
| Alert | 警告提示 |
| Loading | 加载状态 |

### 数据展示

| 组件 | 说明 |
|------|------|
| Card | 卡片 |
| Table | 表格 |
| List | 列表 |
| Empty | 空状态 |

### 布局组件

| 组件 | 说明 |
|------|------|
| Container | 容器 |
| Grid | 栅格 |
| Divider | 分隔线 |
| Space | 间距 |

---

## 状态覆盖

| 状态 | 说明 |
|------|------|
| 常规 | 默认展示，数据正常 |
| 悬停 | 鼠标悬停状态 |
| 激活 | 当前选中状态 |
| 禁用 | 不可点击状态 |
| 空状态 | 无数据占位设计 |
| 加载 | 骨架屏shimmer动画 |
| 错误 | 错误提示+重试按钮 |
| 边界 | 文字省略、滚动处理 |

---

## 交互模式

### Modal（模态弹窗）

```javascript
// 创建Modal实例
const modal = new Modal({
  title: '确认操作',
  content: '确定要删除这项内容吗？',
  width: 400,
  maskClose: true,        // 点击遮罩关闭
  showClose: true,        // 显示关闭按钮
  confirmText: '确定',
  cancelText: '取消',
  onConfirm: () => {
    console.log('确认回调');
    modal.close();
  },
  onCancel: () => {
    console.log('取消回调');
    modal.close();
  }
});

// 打开/关闭
modal.open();   // 打开
modal.close();  // 关闭

// 静态调用（推荐）
Modal.confirm({
  title: '删除确认',
  content: '此操作不可撤销，确定继续吗？',
  onConfirm: () => doDelete()
});
```

### Drawer（侧边抽屉）

```javascript
// 创建Drawer实例
const drawer = new Drawer({
  title: '播放列表',
  content: '<ul><li>歌曲1</li><li>歌曲2</li></ul>',
  placement: 'right',    // left/right/top/bottom
  width: 360,            // 宽度（placement为left/right时）
  height: 400,           // 高度（placement为top/bottom时）
  maskClose: true,
  onClose: () => {
    console.log('抽屉已关闭');
  }
});

drawer.open();
drawer.close();

// 静态调用
Drawer.right({
  title: '歌词面板',
  content: lyricContent,
  width: 300
});
```

### Toast（轻提示）

```javascript
// 基本用法
Toast.show('操作成功');
Toast.show('加载中...', { type: 'loading', duration: 0 }); // duration=0持续显示
Toast.show('加载失败', { type: 'error' });
Toast.show('注意事项', { type: 'warning' });
Toast.show('提示信息', { type: 'info' });

// 带持续时间（毫秒）
Toast.show('3秒后消失', { duration: 3000 });

// 手动关闭
const toast = Toast.show('我不会自动消失', { duration: 0 });
toast.close();

// 配置全局默认duration
Toast.config({ duration: 2000 });
```

### Tabs（标签页）

```javascript
// HTML结构
/*
<div class="tabs">
  <div class="tab-list">
    <button class="tab active" data-tab="tab1">标签一</button>
    <button class="tab" data-tab="tab2">标签二</button>
    <button class="tab" data-tab="tab3">标签三</button>
  </div>
  <div class="tab-panels">
    <div class="tab-panel active" id="tab1">内容一</div>
    <div class="tab-panel" id="tab2">内容二</div>
    <div class="tab-panel" id="tab3">内容三</div>
  </div>
</div>
*/

// 初始化
const tabs = new Tabs('.tabs', {
  activeIndex: 0,           // 默认激活索引
  onChange: (index, id) => {
    console.log(`切换到标签${index + 1}, id: ${id}`);
  }
});

// 方法
tabs.setActive(1);         // 切换到第二个标签
tabs.getActiveIndex();      // 获取当前索引
tabs.getActiveId();         // 获取当前ID
```

### Accordion（手风琴）

```javascript
// HTML结构
/*
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-header">问题一</button>
    <div class="accordion-content">答案一的内容</div>
  </div>
  <div class="accordion-item">
    <button class="accordion-header">问题二</button>
    <div class="accordion-content">答案二的内容</div>
  </div>
</div>
*/

// 初始化
const accordion = new Accordion('.accordion', {
  singleOpen: true,         // 同时只展开一个
  onToggle: (index, isOpen) => {
    console.log(`索引${index}已${isOpen ? '展开' : '收起'}`);
  }
});

// 方法
accordion.open(0);          // 展开第一个
accordion.close(0);         // 收起第一个
accordion.toggle(1);        // 切换第二个
accordion.closeAll();       // 全部收起
```

### Dropdown（下拉菜单）

```javascript
// HTML结构
/*
<div class="dropdown">
  <button class="dropdown-trigger">选择选项</button>
  <div class="dropdown-menu">
    <div class="dropdown-item" data-value="1">选项一</div>
    <div class="dropdown-item" data-value="2">选项二</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" data-value="3">选项三</div>
  </div>
</div>
*/

// 初始化
const dropdown = new Dropdown('.dropdown', {
  onSelect: (value, text) => {
    console.log(`选择了${text}, value: ${value}`);
  }
});

// 方法
dropdown.open();
dropdown.close();
dropdown.getValue();        // 获取当前值
dropdown.setValue('2');     // 设置值
```

---

## 迭代管理

### 版本号

| 级别 | 用途 |
|------|------|
| 主版本 | 重大架构调整 |
| 次版本 | 功能模块更新 |
| 修订版 | 小幅调整 |

### 变更日志

| 字段 | 说明 |
|------|------|
| 版本号 | v1.0 |
| 日期 | 更新日期 |
| 内容 | 具体改动 |
| 原因 | 改动原因 |

---

## 交付物

| 文件 | 说明 |
|------|------|
| `产品名-模块名.html` | 高保真原型 |
| `产品名-模块名-架构图.txt` | ASCII架构图 |
| `产品名-模块名-交互说明.md` | 交互文档 |
| `产品名-模块名-使用指南.md` | 操作手册 |

---

## 目录结构

```
skills/apple-prototype/
  SKILL.md
  模板/
    通用组件库.html      # 完整组件库
    交互逻辑.js          # 交互封装
  资源/
```

---

## 自检清单

### P0 核心校验（每项原型必须通过）

| 校验项 | 验证方法 | 通过标准 |
|--------|----------|----------|
| SVG图标 | 检查代码中无任何emoji字符 | 代码搜索无😊、🎵等emoji |
| Spring动画 | 控制台执行`getComputedStyle(el).transition` | 包含`cubic-bezier(0.34, 1.56` |
| 主题切换 | 点击主题切换按钮，页面配色变化 | 深色/浅色主题正确切换 |
| 响应式布局 | 浏览器缩放到不同宽度 | 布局在三个断点正确适配 |
| 交互可演示 | 手动测试每个交互功能 | 进度条可拖动、按钮可点击、面板可展开 |

### P1 品质校验（推荐通过）

| 校验项 | 验证方法 | 通过标准 |
|--------|----------|----------|
| 状态覆盖 | 测试每个组件的各状态 | 悬停/激活/禁用样式正常 |
| 无console错误 | 打开F12检查console | 无Error级别日志 |
| 动画流畅度 | 观察动画是否有卡顿 | 60fps，无跳帧 |

### P2 增强校验（增强型原型）

| 校验项 | 验证方法 | 通过标准 |
|--------|----------|----------|
| 键盘导航 | Tab键切换焦点，Enter确认 | 可完全键盘操作 |
| ARIA支持 | 检查可访问性属性 | 有role、aria-label |
| 触控适配 | 手机模拟器测试 | 触控热区≥44×44px |

### 自检执行流程

```
1. 打开原型HTML文件
2. 检查SVG图标 → 无emoji
3. 测试主题切换 → 双主题正常
4. 测试响应式 → 三断点正常
5. 测试核心交互 → 可用
6. 打开控制台 → 无Error
7. 如有问题，修复后从Step 2重新开始
```

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.1 | 2026-05-20 | 增强自检清单（ actionable验证步骤）；补充组件调用示例；添加移动端触控规范和汉堡菜单实现 |
| v1.0 | 2026-05-18 | 初始版本 |