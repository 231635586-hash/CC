# 华翔物流管理系统 (HX-LOGISTICS-SYSTEM)

> 独立的物流业务系统，与 `hx-archive-system`（人员档案系统）完全解耦。
> 部署目标：Vercel 自动部署（生产）+ 本地 Mock 数据（开发演示）。

---

## 📋 项目信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 华翔物流管理系统 (HX-LOGISTICS-SYSTEM) |
| Web 端口（开发） | 5175 |
| **司机端 H5 端口（开发）** | **5177** |
| Web 端口（生产） | 由 Vercel 分配 |
| 技术栈 | Vite 5 + React 18 + TypeScript + Ant Design 5 + Zustand |
| **司机端 H5 技术栈** | **uni-app + Vue 3 + TypeScript + Pinia** |
| 启动命令（Web） | `npm install && npm run dev` |
| 启动命令（H5） | `cd mobile-h5 && npm install && npm run dev:h5` |
| 启动命令（生产预览） | `npm run build && npm run preview` |
| 关联项目 | hx-archive-system（独立项目，互不影响） |

---

## ✨ 已交付功能（M1 阶段）

### 1. 营销管理（`/marketing`）

| 路由 | 模块 | 关键能力 |
|------|------|----------|
| `/marketing/dispatch` | 调车单管理 | 发起 / 编辑 / 详情 / 确认 / **作废** / **删除**；拼车 + 多园区 |
| `/marketing/dispatch/:id` | 调车单详情 | 基本信息 / 货物清单 / 派车信息 / 状态时间轴 |
| `/marketing/inventory` | 库存管理 | 待调货明细 / 业务员字段 / 必填红星 / Excel 导入 |
| `/marketing/customers` | 客户档案 | 软删除 / 添加人字段 / 启停用 / 操作列固定 |
| `/marketing/companies` | 物流公司档案 | TruckSize 统一 / 启停用 |
| `/marketing/warehouse` | 成品库 | M2 占位 |

### 2. 物流管理（`/logistics`）

| 路由 | 模块 | 关键能力 |
|------|------|----------|
| `/logistics/dispatch` | **派车调度** | 4 Tab（全部/待派车/运输中/已完成）/ 多维筛选 / 分页 10-100 / 拼车聚类 / 详情入口 / WS 订阅桩 |
| `/logistics/vehicles` | 车辆档案 | 关联物流公司 / 车型 / **默认司机下拉** / 启停用 |
| `/logistics/drivers` | **司机档案** | 增删改查 / 启停用 / 搜索（姓名/手机/驾驶证） |
| `/logistics/locations` | 车辆位置 | 在线统计 / 新鲜度 / **4 列扩展**：物流公司/司机/联系方式/目的地（聚合调车单） |

### 3. 库房管理（`/warehouse`，M2 已实装）

| 路由 | 模块 | 关键能力 |
|------|------|----------|
| `/warehouse/queue` | 排队管理 | 4 统计（排队中/装货中/今日完成/平均等待） + 状态驱动操作按钮 + 通知入场/装货完成/通知离场 |
| `/warehouse/loading` | 装货管理 | 装货进度跟踪 + 停留时长 |
| `/warehouse/dispatch/:id` | 单据详情 | 基本信息 + 货物清单 + **多园区时间线**（antd Steps） |

**M2 业务流**：司机排队登记 → 库房通知入场（生成 QR）→ 司机扫码入场 → 装货完成 → 通知离场 → 扫码离场（多园区循环）→ 全部完成 → 状态 completed。

### 4. 司机端 H5（`mobile-h5/`，M2 已实装）

| 路由 | 模块 | 关键能力 |
|------|------|----------|
| `/pages/driver/queue-register` | 排队登记 | 输入调车编号 + 司机姓名 + 联系电话 |
| `/pages/driver/scan-in` | 扫码入场 | 解析 URL token + snapshot → postMessage 通知 Web 端 |
| `/pages/driver/scan-out` | 扫码离场 | 同 scan-in 但发送 YARD_LEFT |
| `/pages/driver/multi-yard-prompt` | 多园区引导 | 当前园区完成后跳转下一园区 |

**数据交互**：URL 参数传递（base64 snapshot）+ `window.opener.postMessage` 跨 origin 通信。

### 5. 门禁 / 磅房 / 品质（M3 占位）

| 路由 | 模块 | 阶段 |
|------|------|------|
| `/weighing` | 磅房管理 | M2 上线 |
| `/quality` | 品质管理 | M3 上线 |
| `/gate` | 门禁配置 | M1（已实装） |

### 4. 系统管理（`/system`）

| 路由 | 模块 | 关键能力 |
|------|------|----------|
| `/system/users` | 用户管理 | 角色分配 / 公司隔离 / 启停用 |
| `/system/roles` | 角色管理 | 权限点分组 / 4 个预置角色 |
| `/system/dingtalk` | 钉钉配置 | 群机器人 / 消息模板 / 变量占位符 + QUEUE_REGISTER 模板 |

### 5. 基础设施

- ✅ **登录页** + 4 个演示账号一键填充
- ✅ **404 页面**（支持返回 + 显示当前路径）
- ✅ **WebSocket 桩**（`src/services/ws.ts`：M1 占位，未来对接真实后端）
- ✅ **HTTP 客户端**（Axios + 拦截器）
- ✅ **共享组件** 11 个：`PageContainer` / `SearchForm` / `FormSection` / `Empty` / `AuthGuard` / `StatusTag` / `DeleteAction` / `SharedRenderers` / `InventoryPickerModal` 等
- ✅ **共享 hook**：`useCurrentOperator` / `resolveOperator`
- ✅ **类型系统**：`Dispatch` / `Driver` / `Vehicle` / `LogisticsCompany` 等聚合在 `types/index.ts`

---

## 🏗️ 项目结构

```
hx-logistics-system（物流管理）/
├── public/                         # 静态资源
├── src/
│   ├── components/                 # 共享组件（11+ 个）
│   │   ├── PageContainer.tsx       # 页面容器（标题 + extra 操作区）
│   │   ├── SearchForm.tsx          # 通用筛选表单
│   │   ├── FormSection.tsx         # 表单分组容器
│   │   ├── DeleteAction.tsx        # 复用的删除按钮 + Popconfirm
│   │   ├── StatusTag.tsx           # 通用状态标签
│   │   ├── SharedRenderers.tsx     # 园区/状态等共享 render 函数
│   │   ├── InventoryPickerModal.tsx # 库存选择弹窗
│   │   ├── tablePresets.ts         # 表格 scroll 宽度预设
│   │   └── ...
│   ├── features/                   # 业务功能模块（按业务划分）
│   │   ├── auth/                   # 登录 / 鉴权
│   │   ├── marketing/              # 营销管理
│   │   │   ├── dispatch/           # 调车单管理
│   │   │   ├── inventory/          # 库存管理
│   │   │   ├── customer/           # 客户档案
│   │   │   └── company/            # 物流公司档案
│   │   ├── logistics/              # 物流管理
│   │   │   ├── dispatch/           # 派车调度
│   │   │   ├── vehicle/            # 车辆档案
│   │   │   ├── driver/             # 司机档案
│   │   │   ├── company/            # 物流公司
│   │   │   └── location/           # 车辆位置
│   │   ├── system/                 # 系统管理
│   │   │   ├── user/               # 用户管理
│   │   │   ├── role/               # 角色管理
│   │   │   └── dingtalk/           # 钉钉配置
│   │   ├── NotFoundPage.tsx        # 404 页
│   │   └── UnderConstruction.tsx   # M2/M3 占位
│   ├── hooks/                      # 自定义 hook
│   │   └── useOperator.ts          # 当前操作人 hook
│   ├── layouts/                    # 布局
│   │   └── MainLayout.tsx          # 主布局（侧边栏 + 头部 + 内容）
│   ├── mock/                       # Mock 数据层
│   │   ├── seed.ts                 # 种子数据
│   │   ├── db.ts                   # localStorage 持久化 + migrate
│   │   ├── constants.ts            # Fallback 常量
│   │   ├── customer.ts             # 客户 Mock 加载
│   │   └── inventory.ts            # 库存 Mock 加载
│   ├── router/                     # 路由
│   │   └── index.tsx
│   ├── services/                   # 服务层
│   │   ├── http.ts                 # Axios + 拦截器
│   │   └── ws.ts                   # WebSocket 桩（M1）
│   ├── stores/                     # Zustand 状态
│   │   ├── auth.ts                 # 鉴权
│   │   ├── dispatch.ts             # 调车单
│   │   ├── customer.ts             # 客户
│   │   ├── inventory.ts            # 库存
│   │   └── dict.ts                 # 全局字典（公司/车辆/司机/园区等）
│   ├── types/                      # 类型定义
│   │   ├── index.ts                # 聚合导出 + 通用枚举
│   │   ├── dispatch.ts             # 调车单 + 发运方式 + 车型 + 作废
│   │   ├── archives.ts             # 车辆 / 司机 / 物流公司 / 位置
│   │   └── system.ts               # 用户 / 角色 / 钉钉 / 园区
│   ├── utils/                      # 工具函数
│   │   └── index.ts                # 时间 / 城市解析 / genId
│   ├── App.tsx
│   └── main.tsx
├── vercel.json                     # Vercel 部署配置（已就绪）
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── README.md                       # 本文档
└── CHANGELOG.md                    # 版本演进日志
```

---

## 🚀 启动与构建

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（端口 5175）
npm run dev

# 3. 浏览器访问
open http://localhost:5175

# 4. 演示账号（登录页一键填充）
#   - admin / 系统管理员
#   - marketing / 营销业务员（李营销）
#   - dispatch / 物流调度员
#   - logistics / 物流公司管理员
```

### 本地生产预览

```bash
npm run build          # tsc 检查 + Vite 打包 → dist/
npm run preview        # 本地预览 dist/（端口 4173）
```

### 类型检查 / Lint

```bash
npx tsc --noEmit       # 仅类型检查
npm run lint           # ESLint
```

---

## 📦 部署

### Vercel 自动部署（推荐）

仓库已包含 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

部署步骤：

1. 在 [vercel.com](https://vercel.com) 关联 GitHub 仓库 `231635586-hash/hx-logistics-system`
2. Vercel 自动识别 Vite 项目 + 应用 `vercel.json`
3. 推送 main 分支 → Vercel 自动 build + 部署
4. 默认域名：`hx-logistics-system.vercel.app`

### 静态托管（任何平台）

```bash
npm run build
# 上传 dist/ 目录到任意静态托管（Nginx / OSS / S3 等）
# 配置 SPA fallback：所有未知路径 → index.html
```

---

## 💾 数据层

### Mock 数据策略（M1）

- 所有 CRUD 走 `mockDB`（`src/mock/db.ts`），无后端依赖
- **持久化**：localStorage key `HX_LOGISTICS_MOCK_DB`
- **自动迁移**：`migrateDB()` 兼容老版本，新增字段自动补齐
  - 字段兜底（如 `voidedAt` / `yardIds` / `isCarpool` 等）
  - 公司名同步（按 companyId 重新解析）
  - 删除关联（删司机时清空车辆上的 defaultDriverId）

### 真实接口对接（M2+）

替换 `src/mock/db.ts` 中的 mock 实现为 Axios 调用即可，store 层无需改动。

### WebSocket

`src/services/ws.ts` 提供事件订阅桩：

```ts
import { on, off, emit, WS_EVENTS } from '@/services/ws'

// 订阅
const unsub = on(WS_EVENTS.DISPATCH_UPDATE, (payload) => {
  console.log('派车单更新', payload)
})

// 解绑
unsub()
// 或
off(WS_EVENTS.DISPATCH_UPDATE, callback)

// 触发（未来对接真实 ws.onmessage）
emit(WS_EVENTS.DISPATCH_UPDATE, { ... })
```

当前事件：
- `dispatch_update`：派车单更新
- `vehicle_location_update`：车辆位置更新

派车调度页已接入 `dispatch_update` 订阅（UI 不展示，沉默开关）。

---

## 🛠️ 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | React 18 + Vite 5 | 现代化 + HMR + 快 |
| 语言 | TypeScript 5 | 严格模式，0 类型错误 |
| UI | Ant Design 5 | 中文业务组件齐全 |
| 路由 | React Router 6 | Hash / Browser Router 自由切换 |
| 状态 | Zustand 5 | 轻量 + persist 中间件 |
| HTTP | Axios | 拦截器统一处理 |
| 时间 | Day.js | 轻量（< 2KB） |
| Excel | xlsx | 库存批量导入 |
| 部署 | Vercel | 静态托管 + 自动 CI |

---

## 📐 开发规范

### 命名约定

- **文件名**：组件 PascalCase，工具/服务 camelCase
- **目录名**：功能模块使用 kebab-case（中文目录仅用于 IDE 路径显示）
- **变量名**：camelCase
- **类型名**：PascalCase
- **常量名**：UPPER_SNAKE_CASE
- **枚举键**：snake_case（如 `pending_confirm` / `big_truck`）

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
refactor: 重构（不影响业务）
style: 样式调整
docs: 文档变更
chore: 构建/工具变更
test: 测试相关
```

### 模块开发流程

1. 确认 PRD 需求
2. 设计数据模型（TypeScript interface）
3. 添加 Mock 数据 + migrate 兜底
4. 实现列表页
5. 实现详情页（如需要）
6. 实现新建/编辑表单
7. 状态流转逻辑（如需要）
8. 边界场景处理
9. tsc + build 验证
10. commit + 更新 CHANGELOG

### 代码复用原则

- **重复 ≥ 3 次**的逻辑抽取到 `components/` 或 `hooks/`
- **共享 render 函数**放 `components/SharedRenderers.tsx`
- **状态 / 选项映射**放 `types/` 对应文件
- **fallback 常量**放 `mock/constants.ts`

---

## 🧭 版本规划

| 版本 | 模块 | 状态 |
|------|------|------|
| **M1** | 调车单 + 派车调度 + 档案 + 库存 + 客户 + 系统管理 | ✅ 已完成 |
| M2 | 门禁事件采集 + 钉钉工作通知 + 磅房 ±500KG + 实时轨迹 | 📅 计划中 |
| M3 | 成品库 + 品质追溯 + 消息中心 + 报表看板 | 📅 计划中 |

详见 [CHANGELOG.md](CHANGELOG.md)。

---

## ⚠️ 已知限制

- Mock 数据无并发安全（localStorage 单浏览器）
- 真实接口对接待 M2 推进
- 钉钉推送 / 门禁 WebHook 待联调
- 拼车货物同方向校验未实装
- 操作日志未实装

---

## 📞 关键约定

- **本项目独立**：与 `/Users/roro/Vibe_coding/hx-archive-system` 完全解耦
- **不影响其他项目**：尤其不能影响 `hx-archive-system`
- **端口隔离**：Web 5175 / H5 5176 / 档案 5173
- **代码组织**：feature 目录按业务划分，互不耦合

---

## 📚 相关文档

- [CHANGELOG.md](CHANGELOG.md) — 版本演进日志 + 待优化清单
- [vercel.json](vercel.json) — 部署配置

## 📝 License

Internal Use Only.