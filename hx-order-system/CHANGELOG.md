# 华翔物流管理系统 - 开发文档

> 本文档记录每次代码版本和功能版本的更新内容，便于追溯项目演进。

---

## 📋 项目信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 华翔物流管理系统 (HX-LOGISTICS-SYSTEM) |
| 端口（Web） | 5175（区分 hx-archive-system 的 5173） |
| 端口（Mobile H5） | 5176 |
| 技术栈（Web） | Vite 5 + React 18 + TypeScript + Ant Design 5 + Zustand + Socket.IO |
| 技术栈（H5） | uni-app + Vue 3 + Pinia |
| 启动命令（Web） | `npm run dev` |
| 启动命令（H5） | `cd mobile-h5 && npx serve -l 5174` |
| 关联项目 | hx-archive-system（独立项目，互不影响） |

---

## 📦 版本号规范

- **代码版本（Code Version）**：记录代码层面的迭代（v0.1.0、v0.2.0...）
- **功能版本（Feature Version）**：记录产品功能的演进（M1、M2、M3）
- 遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范

```
v0.1.0-M1    主版本.次版本.修订号-功能版本
             |     |      |       |
             |     |      |       └─ M1=基础版 / M2=增强版 / M3=完整版
             |     |      └─ 修订号（bugfix/小调整）
             |     └─ 次版本（新功能/模块新增）
             └─ 主版本（架构级变更/破坏性变更）
```

---

## 🚧 当前开发进度

| 阶段 | 模块 | 优先级 | 状态 |
|------|------|--------|------|
| M1 | 调车单管理 | P0 | ✅ 已完成（含拼车/紧急/多园区/调度规则） |
| M1 | 派车调度 | P0 | ✅ 已完成 |
| M1 | 物流公司档案 | P0 | ✅ 已完成（含 TruckSize 统一） |
| M1 | 车辆档案 | P0 | ✅ 已完成 |
| M1 | 司机档案 | P0 | ✅ 已完成 |
| M1 | 园区档案 | P0 | ✅ 已完成 |
| M1 | 库存管理 | P0 | ✅ 已完成（含业务员/必填红星/Excel 导入） |
| M1 | 客户档案 | P0 | ✅ 已完成（含添加人/必填红星/软删/操作列固定） |
| M1 | 用户管理/角色权限 | P0 | ✅ 已完成 |
| M1 | 钉钉配置 | P0 | ✅ 已完成 |
| M1 | 门禁配置 | P0 | ✅ 已完成 |
| M1 | 调车员管理 | P1 | ✅ 已完成 |
| M1 | 车辆位置 | P1 | ✅ 已完成 |
| **M2** | **库房管理 + 司机扫码流程** | **P0** | ✅ **已完成（v0.2.0-M2）** |
| **M2** | **调度时效分析** | **P1** | ✅ **已完成（v0.3.0-M2）** |
| - | 代码层优化 | - | ✅ 23 项已完成（详见下文 v0.1.x 增量版本） |

---

## 📝 版本历史

### v0.1.0-M1 - 初始版本（2026-06-22）

#### 🎉 阶段交付：M1 全部 P0 + P1 模块初始版本

**✅ 项目可启动**：TypeScript 0 错误，Vite 构建成功（1.89s），55 个源文件

#### ✨ 完整功能模块（11 个）

##### P0 核心模块（9 个）

1. **【调车单管理】** - `features/marketing/dispatch/`
   - `DispatchListPage.tsx` - 列表（搜索/筛选/分页/确认/取消/编辑/删除）
   - `DispatchFormDrawer.tsx` - 新建/编辑（拼车+多园区支持）
   - `DispatchDetailPage.tsx` - 详情（基本信息+货物清单+状态时间轴）

2. **【派车调度】** - `features/logistics/dispatch/DispatchSchedulePage.tsx`
   - 待派车看板（按方向+时间聚类，相同维度自动拼车）
   - 派车操作（选车辆+选司机+调车员备注）
   - 运输中列表（实时状态）
   - 4 个统计卡片（待派车/运输中/已完成/可派车辆）

3. **【物流公司档案】** - `features/logistics/company/CompanyListPage.tsx`
   - 增删改查 + 启停用切换
   - 关键词/状态筛选

4. **【车辆档案】** - `features/logistics/vehicle/VehicleListPage.tsx`
   - 关联物流公司 + 车型（重/中/轻）+ 载重 + 车长
   - 启停用切换

5. **【司机档案】** - `features/logistics/driver/DriverListPage.tsx`
   - 关联物流公司 + 默认车辆
   - 身份证/驾驶证/手机号

6. **【园区档案】** - `features/logistics/yard/YardListPage.tsx`
   - 门禁设备对接标识
   - 园区与门禁配置关联校验

7. **【用户管理】** - `features/system/user/UserListPage.tsx`
   - 角色分配 + 物流公司账号隔离
   - 启停用

8. **【角色管理】** - `features/system/role/RoleListPage.tsx`
   - 权限点分组配置（调车单/档案/系统）
   - 预置 4 个角色：系统管理员/营销/物流/物流公司

9. **【钉钉配置】** - `features/system/dingtalk/DingtalkConfigPage.tsx`
   - 群机器人管理（物流群/工厂群/管理群）
   - 消息模板（变量占位符 `${varName}`）
   - 测试推送

10. **【门禁配置】** - `features/gate/GateConfigPage.tsx`
    - 多园区独立门禁配置
    - 事件类型订阅（入园/离园/拍照/道闸）
    - API 地址 + 密钥

##### P1 模块（2 个）

11. **【调车员管理】** - `features/logistics/dispatcher/DispatcherListPage.tsx`
    - 内部/外部调车员
    - 外部调车员关联物流公司

12. **【车辆位置】** - `features/logistics/location/LocationListPage.tsx`
    - 定位点列表（不接地图，按 PRD 简化）
    - 4 个统计 + 新鲜度检测 + 高德跳转

#### 🏗️ 基础设施

- ✅ **类型系统** (`types/`)：4 个文件，11 张表对应的 TS interface
- ✅ **Mock 数据** (`mock/`)：localStorage 持久化，3 物流公司/5 车辆/4 司机/2 园区/4 调车员/4 调车单 等
- ✅ **状态管理** (`stores/`)：Zustand + persist
  - `auth.ts` - 鉴权
  - `dispatch.ts` - 调车单
  - `dict.ts` - 全局字典
- ✅ **共享组件** (`components/`)
  - `PageContainer.tsx` - 页面容器
  - `SearchForm.tsx` - 通用筛选
  - `Empty.tsx` - 空状态
  - `AuthGuard.tsx` - 鉴权守卫
  - `UnderConstruction.tsx` - M2/M3 占位
- ✅ **登录页** (`features/auth/LoginPage.tsx`)
  - 4 个演示账号一键填充
  - 渐变背景 + 卡片式布局
- ✅ **主布局** (`layouts/MainLayout.tsx`)
  - 6 泳道菜单 + 系统管理
  - 用户下拉（个人/退出）
  - 消息中心入口（M2 占位）
- ✅ **HTTP 客户端** (`services/http.ts`) + **WebSocket** (`services/ws.ts`)

#### 📋 业务验证清单

| 业务场景 | 验证方式 | 状态 |
|---------|---------|------|
| 创建调车单（含拼车多货物） | Drawer 表单 | ✅ |
| 调车单确认/取消 | 列表行操作 | ✅ |
| 调车单详情查看 | 路由 `/marketing/dispatch/:id` | ✅ |
| 派车时自动按方向+时间聚类 | 调度看板 | ✅ |
| 派车时只能选本公司的车辆/司机 | 下拉过滤 | ✅ |
| 启停用档案 | 列表行操作 | ✅ |
| 物流公司账号关联 | User 表单 shouldUpdate | ✅ |
| 钉钉模板变量自动提取 | 正则解析 | ✅ |
| 角色权限点分组 | Checkbox.Group | ✅ |
| 多园区门禁独立配置 | 门禁配置页 | ✅ |

#### 🔧 技术亮点

- **完整 Mock 数据层**：所有 CRUD 操作基于 localStorage，刷新不丢失
- **聚合类型导出**：`types/index.ts` 统一入口，子文件按业务拆分
- **状态集中管理**：Zustand + persist，避免 prop drilling
- **组件复用**：所有列表页使用统一的 `PageContainer + SearchForm + Table` 三段式
- **TS 严格模式**：通过 `tsc -b --noEmit` 校验 0 错误

#### ⚠️ 已知 TODO

- [ ] 接口对接（待后端提供）
- [ ] 钉钉实际推送（待联调）
- [ ] 门禁 WebHook 接收（待联调）
- [ ] 复杂业务校验（拼车货物同方向校验）
- [ ] 批量导入/导出
- [ ] 操作日志
- [ ] 数据权限（公司维度隔离）

#### ✨ 新增功能

- ✅ 项目基础架构：Vite + React 18 + TypeScript + Ant Design 5
- ✅ 主布局：6 泳道菜单（营销/物流/门禁/磅房/成品库/品质）
- ✅ 路由体系：M1 模块路由 + M2/M3 占位页
- ✅ HTTP 请求封装：基于 Axios
- ✅ WebSocket 客户端：基于 Socket.IO
- ✅ Mock 数据层：基础种子数据
- ✅ 全局状态：Zustand
- ✅ 登录页：账号密码 + Mock 鉴权
- ✅ **调车单管理**：
  - 调车单列表（筛选/搜索/分页/导出）
  - 新建/编辑调车单（拼车+多园区支持）
  - 调车单详情（基本信息+货物列表+状态时间轴）
  - 调车单状态流转（待确认→已确认→已派车→已入园→已出场）
- ✅ **派车调度**：
  - 待派车列表（按方向+时间排序）
  - 派车操作（选车辆+选司机+备注）
  - 调度看板（实时车辆状态）
- ✅ **档案管理**：
  - 物流公司档案（增删改查+启停用）
  - 车辆档案（关联物流公司+司机）
  - 司机档案（关联物流公司+车辆）
  - 园区档案（增删改查+门禁配置关联）
- ✅ **调车员管理**：增删改查+启用/停用
- ✅ **用户管理**：用户列表+角色分配+启停用
- ✅ **角色管理**：角色列表+权限配置
- ✅ **钉钉配置**：群机器人 Webhook 配置+消息模板管理
- ✅ **门禁配置**：门禁系统接入参数+事件类型
- ✅ **车辆位置**：定位点列表（简化版，不含地图）

#### 🏗️ 架构设计

```
src/
├── components/            # 共享组件
│   ├── PageContainer      页面容器（标题+操作区）
│   ├── SearchForm         通用筛选表单
│   ├── DataTable          通用数据表格
│   ├── FormDrawer         抽屉表单
│   └── ...
├── layouts/
│   └── MainLayout         主布局（侧边栏+头部+内容区）
├── features/              # 业务功能模块
│   ├── auth/              登录/鉴权
│   ├── marketing/         营销管理
│   │   └── dispatch       调车单管理
│   ├── logistics/         物流管理
│   │   ├── dispatch       派车调度
│   │   ├── driver         司机档案
│   │   ├── vehicle        车辆档案
│   │   ├── company        物流公司
│   │   ├── dispatcher     调车员
│   │   ├── yard           园区
│   │   └── location       车辆位置
│   ├── gate/              门禁管理（M1 占位）
│   ├── weight/            磅房管理（M2 占位）
│   ├── warehouse/         成品库（M2 占位）
│   ├── quality/           品质（M3 占位）
│   └── system/            系统管理
│       ├── user           用户管理
│       ├── role           角色管理
│       ├── dingtalk       钉钉配置
│       └── gate           门禁配置
├── stores/                # Zustand 状态
├── services/              # 服务层（http/ws）
├── mock/                  # Mock 数据
├── router/                # 路由
├── types/                 # 类型定义
├── utils/                 # 工具
├── App.tsx
└── main.tsx
```

#### 🎯 业务范围

**M1 范围**：
- 营销创建调车单（含拼车 + 多园区）
- 物流公司派车（含车辆+司机分配）
- 调车单状态流转
- 基础档案管理（公司/车辆/司机/园区/调车员）
- 用户/角色/权限
- 钉钉群机器人推送（配置层）
- 门禁系统接入（配置层）
- 车辆位置（定位点列表）

**M1 不包含**：
- 门禁入场/出场时间采集
- 门禁拍照存档
- 钉钉工作通知
- 成品库人员管理
- ±500KG 过磅预警
- GPS 完整监控+轨迹回放
- 道闸系统对接
- 消息中心
- 报表看板
- 司机 H5 详细页面

#### 🔧 技术决策

- **UI 库**：Ant Design 5（中文友好、组件丰富）
- **状态管理**：Zustand（轻量、TS 友好）
- **路由**：React Router 6
- **HTTP**：Axios
- **WebSocket**：Socket.IO Client
- **样式**：Tailwind CSS（utility-first）+ Antd 主题
- **Mock 数据**：内置 mock 模块（不依赖 mock.js，便于定制）
- **类型**：TypeScript strict 模式

#### 📝 待优化项

- [ ] 真实接口对接（待后端提供）
- [ ] 钉钉实际推送（待后端联调）
- [ ] 门禁 WebHook 接收（待后端联调）
- [ ] 车辆位置定时刷新
- [ ] 复杂业务校验（如拼车货物同方向校验）
- [ ] 批量导入/导出
- [ ] 操作日志
- [ ] 数据权限（公司维度隔离）

#### 🛠️ 代码层待优化（2026-06-25 自查清单）

| 编号 | 类别 | 项 | 优先级 | 说明 |
|------|------|-----|--------|------|
| C2 | 持久化 | 库存 / 客户数据持久化策略统一 | P1 | 当前库存 / 客户走 zustand 内存，刷新丢失新建/编辑数据；建议统一走 localStorage persist 或 mockDB |
| C4 | 类型严格度 | 开启 `noUnusedLocals` + `noUnusedParameters` | P2 | 当前 tsconfig 关掉了，未来 dead code 不会被报；建议配 `_` 前缀豁免 |
| C5 | 鉴权 | 增加密码校验（修复鉴权错觉） | P2 | mock 阶段非 admin 用户不校验密码，建议至少校验非空 + 注释说明 |
| C6 | 类型 | 用 `Timestamp` 统一时间字段 | P2 | Inventory / Customer 部分字段仍用 string 隐式代替 `Timestamp`，建议全部显式标注 |
| B5 | UI 复用 | `StatusTag` 组件接入到所有列表页 | P2 | 组件已抽到 `components/StatusTag.tsx`，约 20 处 `<Tag color={map[v].color}>` 待替换 |
| D1 | 派车调度 | PRD 文档待补充：实时刷新设计 | P1 | 当前 WS 事件订阅代码已保留为"沉默开关"，但 5s 定时刷新 / 刷新状态 / 手动刷新按钮均未在 UI 展示。**PRD 飞书文档待补充**：M2 是否启用？何时启用？触发条件是什么？详见 [discussion-2026-06-25] |

---

## 🛠️ 开发规范

### 命名规范

- **文件名**：组件 PascalCase，工具/服务 camelCase
- **目录名**：功能模块使用 kebab-case
- **变量名**：camelCase
- **类型名**：PascalCase
- **常量名**：UPPER_SNAKE_CASE

### Git 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档变更
style: 样式调整（不影响逻辑）
refactor: 重构
test: 测试
chore: 构建/工具变更
```

### 模块开发流程

1. 确认 PRD 需求
2. 设计数据模型（TypeScript interface）
3. 添加 Mock 数据
4. 实现列表页
5. 实现详情页
6. 实现新建/编辑表单
7. 状态流转逻辑
8. 边界场景处理
9. 提交代码 + 更新 CHANGELOG

---

### v0.2.0-M2 - 库房管理 + 司机扫码流程（2026-06-26）

#### 🎉 阶段交付：M2 库房管理 + 司机端 H5 多园区扫码流程

**✅ 业务范围**：司机到达 → 排队登记 → 库房通知入场 → 扫码入场 → 装货完成 → 扫码离场（多园区循环）

#### ✨ 新增功能

**1. 类型层（M2 核心数据结构）**
- `YardTimeline` 接口：每园区独立时间戳（queuedAt/notifiedAt/enteredAt/loadingCompletedAt/leftAt/enterToken/exitToken/enteredVia/leftVia）
- `Dispatch.yardTimelines: YardTimeline[]` 取代旧 enterYardAt/leaveYardAt 单一字段
- `PushLog` 接口（钉钉推送日志）
- `utils/dispatchTimeline.ts`：getEnterYardAt / getLeaveYardAt / getTotalQueueMs / getActiveYardIndex / formatDuration 派生工具

**2. 库房管理 Web 端（3 个页面 + 3 个组件）**
- `WarehouseQueuePage`（/warehouse/queue）：实时排队管理，4 统计 + 状态驱动操作按钮
- `WarehouseLoadingPage`（/warehouse/loading）：装货进度跟踪
- `WarehouseDispatchDetailPage`（/warehouse/dispatch/:id）：单据详情 + 多园区时间线
- `YardTimelineView`：antd Steps 垂直时间线组件
- `NotifyEnterModal` / `NotifyExitModal`：生成动态二维码（qrcode.react）

**3. 司机端 H5（mobile-h5/，uni-app + Vue 3）**
- 4 个新页面：queue-register / scan-in / scan-out / multi-yard-prompt
- Pinia store：driver.ts（currentDriver + queueHistory + uni.setStorageSync 持久化）
- `utils/url.ts`：base64 snapshot 解析
- `utils/postmessage.ts`：notifyWebAndClose / notifyWeb
- 端口 5176 → 5177（避免与 Web 端冲突）

**4. 服务层**
- `services/dingtalk.ts`：resolveFactoryBot + pushQueueRegistration（mock 阶段 console + pushLogs）
- `services/crossOrigin.ts`：postMessage 监听（ALLOWED_ORIGINS 白名单）
- `utils/h5BaseUrl.ts`：H5 base URL 常量

**5. Store 层**
- `useDispatchStore` 新增 5 个 action：notifyYardEnter / notifyYardExit / markYardEntered / markYardLeft / markLoadingCompleted
- `deriveStatus(d)`：根据 yardTimelines 推导 status（自动从 dispatched → entering → leaving → completed）
- `withDerived(d)`：写入时补齐 enterYardAt / leaveYardAt

**6. mock 数据迁移（M2 兼容）**
- migrateDB 段 11：yardTimelines 兜底（老数据无字段时按 yardIds 合成）
- migrateDB 段 12：pushLogs 兜底
- 新增 QUEUE_REGISTER 钉钉模板（8 个变量：dispatchNo/plateNo/driverName/driverPhone/yardName/registerTime/queuePosition/scanUrl）
- 4 条 mock dispatches 都补 yardTimelines 字段

#### 🔗 数据流时序

```
司机到达 → 进入 /pages/driver/queue-register
  ↓ 输入调车编号 + 司机姓名
  ↓ 写入 driver store + pushLog
  ↓
库房人员 /warehouse/queue 看到 → 点【通知入场】
  ↓ 生成 enterToken（UUID）+ base64 snapshot + H5 URL
  ↓ 渲染 qrcode.react QR Code
  ↓
司机扫码 → /pages/driver/scan-in?token=xxx&snapshot=xxx
  ↓ 点【确认入场】
  ↓ window.opener.postMessage(YARD_ENTER, 'http://localhost:5175')
  ↓ setTimeout(300) → window.close()
  ↓
Web 端 crossOrigin.ts 监听 → markYardEntered(token, yardId, enteredAt)
  ↓ 校验 token → 写入 enteredAt → 清空 token（防重放）
  ↓ dispatch.status = 'entering'
  ↓
库房人员点【装货完成】→ markLoadingCompleted(d, yardId, now)
  ↓ status = 'leaving'
  ↓
库房人员点【通知离场】→ NotifyExitModal → 类似入场流程
  ↓
司机扫码 → /pages/driver/scan-out → postMessage(YARD_LEFT)
  ↓ markYardLeft → 写入 leftAt
  ↓
若还有未离场园区：跳 /pages/driver/multi-yard-prompt
  ↓ 循环 4-10
  ↓
最后园区离场 → deriveStatus → 'completed'
  ↓ leaveYardAt = 最后 leftAt
  ↓ totalQueueMs = 各园区 (enteredAt - queuedAt) 累加
  ↓
进入 M3：车辆定位监管 + 客户到达扫码
```

#### 📋 业务验证清单

| 业务场景 | 验证方式 | 状态 |
|---------|---------|------|
| 库房人员查看实时排队 | `/warehouse/queue` 表格 | ✅ |
| 库房人员通知入场（生成 QR） | 点【通知入场】→ Modal 渲染 | ✅ |
| 司机扫码入场（开发期点击链接） | H5 点【确认入场】→ 自动关闭 | ✅ |
| 库房人员勾选装货完成 | 点【装货完成】→ 状态 leaving | ✅ |
| 库房人员通知离场（生成 QR） | 点【通知离场】→ Modal 渲染 | ✅ |
| 司机扫码离场 | H5 点【确认离场】→ 自动关闭 | ✅ |
| 多园区循环 | 离场后跳 multi-yard-prompt | ✅ |
| 全部园区离场 → 状态 completed | 派生字段自动计算 | ✅ |
| 总等待时长统计 | YardTimelineView 显示 | ✅ |
| 多园区时间线可视化 | Detail 页 YardTimelineView | ✅ |
| 推送"新排队登记"到 factory 群 | mockDB pushLogs 记录 | ✅ |
| token 单次使用防重放 | markYardEntered 清空 token | ✅ |

#### ⚠️ 已知 TODO

- [ ] driver H5 真机扫码（需 HTTPS 部署 + 相机权限）
- [ ] 真实钉钉推送（待后端联调）
- [ ] 真实后端 API 替换 mockDB（待 M3）
- [ ] 多园区调度看板联动（库房 → 调度看板）
- [ ] 司机登录（当前 mock 阶段跳过）
- [ ] "我的派车单"列表（当前是 stub）
- [ ] 客户到达扫码（M3）

---

## 📞 关键约定

- **本项目独立**：`/Users/roro/Vibe_coding/hx-logistics-system`
- **不影响其他项目**：尤其不能影响 `hx-archive-system`
- **端口隔离**：Web 5175 / H5 5176 / 档案 5173
- **代码组织**：feature 目录按业务划分，互不耦合

---

### v0.3.0-M2 - 调度时效分析（2026-06-26）

#### 🎉 阶段交付：调度时效分析模块（独立菜单项）

**✅ 业务范围**：基于已完成的调车单时间戳自动计算 7 个核心指标，识别超时单并归因

#### ✨ 新增功能

**1. 业务规则（M2 mock 阶段固化）**

| # | 规则 | 计算逻辑 |
|---|------|----------|
| 1 | 排队与要求差异 | `queuedAt - expectedLoadTime`（多园区仅算 primaryYardId） |
| 2 | 装车耗时（原始） | `loadingCompletedAt - enteredAt`（含禁行时段） |
| 3 | 装货用时（有效工作） | 装车耗时 - 禁行时段扣减 |
| 4 | 是否超时 | `effectiveLoadMin > 240min`（4h 标准） |
| 5 | 超时原因 | 静态预设（路况/天气/客户延迟/装货慢/设备故障/司机未到/园区拥堵） |
| 6 | 超时责任部门 | 静态预设（成品库/司机/客户/物流公司/系统） |
| 7 | 出厂时间 fallback | `leftAt → loadingCompletedAt + 2h` |
| 8 | 最终出厂时间 | 多园区取最后园区 `leftAt` |

**2. 类型层**
- `YardEfficiency` 接口：单园区 7 个指标 + isFirstYard 标记
- `DispatchEfficiency` 接口：调车单汇总（总用时/总超时/最终出厂时间）
- `OVERTIME_REASON_LABEL` + `OVERTIME_REASON_OPTIONS`（超时原因预设）
- `OVERTIME_DEPARTMENT_LABEL` + `OVERTIME_DEPARTMENT_OPTIONS`（责任部门预设）

**3. 工具层**
- `utils/restrictedHours.ts`：禁行时段配置（4 个时间段：00-01/06-08/11:30-13:30/17:30-20:00）+ `calcRestrictedMinutes` 计算函数 + `STANDARD_LOAD_MIN = 240`
- `utils/efficiencyAnalysis.ts`：核心计算逻辑
  - `analyzeYardEfficiency(dispatch, idx, yard)`：单园区分析
  - `analyzeDispatchEfficiency(dispatch)`：整张单汇总
  - `inferOvertimeReasons` / `inferOvertimeDepartment`：M2 mock 静态推断
  - `formatMinutesAsHour(min)`：`Xh Ym` 格式化

**4. 页面层**
- `EfficiencyAnalysisPage`（/logistics/efficiency）：4 统计 + 表格列表
- `EfficiencyAnalysisDetailPage`（/logistics/efficiency/:id）：基本信息 + 每园区 YardMetricsCard
- `components/YardMetricsCard.tsx`：单园区指标卡（4 统计 + Descriptions + 超时归因）

**5. 路由 + 菜单**
- `/logistics/efficiency` + `/logistics/efficiency/:id`
- 物流管理菜单新增【调度时效分析】

#### 🔗 业务流

```
库房人员完成所有园区流程 → dispatch.status = 'completed'
  ↓
库房管理 / 调车单管理 / 调度看板任意入口
  ↓
菜单 → 物流管理 → 调度时效分析
  ↓
列表页：所有已完成单的总装货用时 / 总超时 / 最终出厂时间
  ↓
点击【详情】→ 详情页
  ↓
基本信息 + 每园区 YardMetricsCard（4 统计 + 7 字段）
  ↓
可跳转原调车单详情核对时间戳
```

#### 📋 业务验证清单

| 场景 | 预期 | 状态 |
|------|------|------|
| 禁行时段扣减（00-01） | 00:30 入场 → 装车耗时 30 min 时扣减 30 min | ✅ |
| 禁行时段扣减（06-08） | 07:30 入场 → 该时段末前时间计入扣减 | ✅ |
| 多园区最后一园区 leftAt | 用作最终出厂时间 | ✅ |
| 跨天计算 | M3 处理（M2 简化：start/end 同一天） | ⚠️ |
| 超时判定 | effectiveLoadMin > 240 → isOvertime=true | ✅ |
| 超时归因（mock） | 静态推断规则 | ✅ |
| 出厂 fallback | leftAt 缺失时用 loadingCompletedAt + 2h | ✅ |

#### ⚠️ 已知 TODO

- [ ] 禁行时间配置化（Yard.restrictedHours 字段）
- [ ] 超时归因规则引擎（基于规则可配置）
- [ ] 跨天场景禁行时段计算
- [ ] Excel 导出
- [ ] 按公司 / 时间段的分组聚合报表
