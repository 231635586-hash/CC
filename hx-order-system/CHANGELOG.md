# 华翔物流管理系统 - 开发文档

> 本文档记录每次代码版本和功能版本的更新内容，便于追溯项目演进。

---

## 📋 项目信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 华翔物流管理系统 (HX-LOGISTICS-SYSTEM) |
| 端口（Web） | 5175（区分 hx-archive-system 的 5173） |
| 端口（Mobile H5） | 5181 |
| 技术栈（Web） | Vite 5 + React 18 + TypeScript + Ant Design 5 + Zustand + Socket.IO |
| 技术栈（H5） | uni-app + Vue 3 + Pinia |
| 启动命令（Web） | `npm run dev` |
| 启动命令（H5） | `cd mobile-h5 && npx serve -l 5181` |
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
| **M2** | **调度时效分析** | **P1** | ✅ **已完成（v0.8.0-M2.7）** |
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
- **端口隔离**：Web 5175 / H5 5181 / 档案 5173
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

---

### v0.3.1 - 司机端 H5 端口迁移（2026-07-10）

#### 🔧 端口冲突修复

**背景**：`hx-order-system/mobile-h5`（司机端 H5，uni-app + Vue 3）原本配置 5174 端口，与"移动端原型静态服务"（`npx serve -l5174`）撞车，同时与 5173 档案系统、5176 物流系统、5177 订单 Web、5178 扫码报工的端口矩阵也容易混淆。

**变更**：
- 司机端 H5 端口 **5174 → 5181**
- `mobile-h5/vite.config.ts` 加 `strictPort: true`（端口被占时启动失败，与 HX 矩阵其他项目对齐）
- 同步更新：`h5BaseUrl.ts` 默认值、`signToken.ts` 注释、`docs/standards/mobile-h5-design.md` 标题/版本记录

**端口矩阵**（HX 产品矩阵更新）：

| 项目 | 端口 | 类型 |
|------|:---:|------|
| hx-archive-system（档案管理） | 5173 | Web |
| 移动端原型静态服务 | 5174 | 静态 HTML |
| hx-logistics-system（物流管理） | 5176 | Web |
| hx-order-system（订单系统） | 5177 | Web |
| mes-workorder（扫码报工） | 5178 | Web |
| **司机端 H5（mobile-h5）** | **5181** | **uni-app H5** |

**注意事项**：
- PC 端打开订单详情页 → "生成签收链接"按钮拼接的 URL 自动用 5181 端口
- 司机端 H5 启动命令不变：`cd mobile-h5 && npm run dev:h5`
- 5174 端口正式让位给"移动端原型静态服务"（如 `npx serve -l5174 scan-report-prototype.html`）

---

### v0.4.0-M2 - 到货处理 v0.2.0-M2 完整闭环（2026-07-13）

#### 🎉 阶段交付：到货处理全流程 + 多角色 H5 + 状态机重写 + 调度时效增强

**✅ 业务范围**：派车 → 入园 → 装货 → 离场 → 司机端确认 → 客户签收 → 完成（多园区循环），覆盖 5 步状态流转 + 多角色 H5 入口。

#### 📦 8 个业务里程碑

##### 1. 数据层 + YardTimeline 类型扩展

**交付范围**：支撑到货处理全流程所需的数据结构。

**关键文件**：
- [src/types/dispatch.ts](src/types/dispatch.ts) — YardTimeline 类型扩展
- [src/types/order.ts](src/types/order.ts) — 订单统一类型
- [src/types/customer.ts](src/types/customer.ts) — 客户类型
- [src/mock/seed.ts](src/mock/seed.ts) — mock 数据集扩展
- [mobile-h5/src/types/driver.ts](mobile-h5/src/types/driver.ts) — H5 司机端类型

**已知 TODO**：无

---

##### 2. PC 端到货处理 UI

**交付范围**：库房人员全套工作台 + 订单统一详情。

**关键文件**：
- [src/features/warehouse/WarehouseQueuePage.tsx](src/features/warehouse/WarehouseQueuePage.tsx) — 排队管理 + 状态驱动操作
- [src/features/warehouse/WarehouseLoadingPage.tsx](src/features/warehouse/WarehouseLoadingPage.tsx) — 装货进度跟踪
- [src/features/warehouse/WarehouseDispatchDetailPage.tsx](src/features/warehouse/WarehouseDispatchDetailPage.tsx) — 单据详情 + 多园区时间线
- [src/features/warehouse/components/YardTimelineView.tsx](src/features/warehouse/components/YardTimelineView.tsx) — antd Steps 垂直时间线
- [src/features/warehouse/components/NotifyLoadingModal.tsx](src/features/warehouse/components/NotifyLoadingModal.tsx) — 装货通知 Modal
- [src/features/order/OrderBoardPage.tsx](src/features/order/OrderBoardPage.tsx) — 订单工作台
- [src/features/order/OrderDetailPage.tsx](src/features/order/OrderDetailPage.tsx) — 订单统一详情 + 签收链接生成

**已知 TODO**：跨天场景禁行时段计算（M3 处理）

---

##### 3. 司机端 H5 重构（5 Tab 单页架构）

**交付范围**：司机角色独立入口，5 Tab 单页架构。

**关键文件**：
- [mobile-h5/src/pages/driver/orders/index.vue](mobile-h5/src/pages/driver/orders/index.vue) — 5 Tab 容器
- [mobile-h5/src/pages/driver/orders/tabs/WorkbenchTab.vue](mobile-h5/src/pages/driver/orders/tabs/WorkbenchTab.vue) — 工作台 Tab
- [mobile-h5/src/pages/driver/order-detail/index.vue](mobile-h5/src/pages/driver/order-detail/index.vue) — 订单详情
- [mobile-h5/src/stores/driver.ts](mobile-h5/src/stores/driver.ts) — 司机 store
- [mobile-h5/vite.config.ts](mobile-h5/vite.config.ts) — strictPort: true

**端口矩阵更新**：

| 项目 | 端口 | 类型 |
|------|:---:|------|
| hx-archive-system（档案管理） | 5173 | Web |
| 移动端原型静态服务 | 5174 | 静态 HTML |
| hx-logistics-system（物流管理） | 5176 | Web |
| hx-order-system（订单系统） | 5177 | Web |
| mes-workorder（扫码报工） | 5178 | Web |
| **司机端 H5（mobile-h5）** | **5181** | **uni-app H5** |

**已知 TODO**：H5 真机扫码需 HTTPS 部署 + 相机权限

---

##### 4. 客户签收 H5

**交付范围**：客户通过 token + base64 snapshot 进入签收页。

**关键文件**：
- [mobile-h5/src/pages/customer/sign/index.vue](mobile-h5/src/pages/customer/sign/index.vue) — 签收页

**注意**：用户 2026-07-13 反馈"实际客户不会进行该操作"。代码保留作为可复用脚手架，但不在产品路线图内。后续可能转 chore 删除。

**已知 TODO**：客户登录（当前 mock 阶段跳过）

---

##### 5. 销售端 + 公司端 H5

**交付范围**：销售 / 公司两个新角色入口。

**关键文件**：
- [mobile-h5/src/pages/role-select/index.vue](mobile-h5/src/pages/role-select/index.vue) — 三角色入口首页
- [mobile-h5/src/pages/salesperson/](mobile-h5/src/pages/salesperson/) — 销售端（创建调车单 + 我的派车单 Tab）
- [mobile-h5/src/pages/company/](mobile-h5/src/pages/company/) — 公司端（待确认 / 待派车 / 我的 Tab）
- [mobile-h5/src/stores/role.ts](mobile-h5/src/stores/role.ts) — 角色 Pinia store
- [mobile-h5/src/stores/ui.ts](mobile-h5/src/stores/ui.ts) — UI 状态 store

**已知 TODO**：销售/公司登录流程（M3）

---

##### 6. 状态机 v0.2.0-M2.2 重写

**交付范围**：5 步状态流转 + entering 守卫 + 多 action。

**业务流程**：`dispatched → entering → loading → leaving → completed`

**关键约束**：
- **entering 优先级 > loading**（避免脏数据自动跳到 loading）
- 唯一写入点：[src/stores/dispatch.ts:99-100](src/stores/dispatch.ts#L99-L100)（deriveStatus tick 聚合）
- 库房员必须主动点「通知装货」才能进入 loading
- notifyDepart 仅写时间戳，不再链式触发状态切换
- markYardEntered / markLoadingCompleted / markYardLeft action 守卫

**新增 action**：
- `markYardEntered` / `markYardLeft`
- `markLoadingCompleted`
- `markLoadingNotified`
- `signByCustomer` / `generateSignUrl`

**关键文件**：
- [src/stores/dispatch.ts](src/stores/dispatch.ts) — 状态机 single source of truth

**回退指引**：紧急回退路径可 git reset --hard `v0.3.1-pre-squash` tag

**已知 TODO**：跨天禁行时段扣减（M3）

---

##### 7. 调度时效分析增强

**交付范围**：5 指标 + 5 筛选 + 4 Tab + Excel 导出。

**关键文件**：
- [src/features/logistics/efficiency/EfficiencyAnalysisPage.tsx](src/features/logistics/efficiency/EfficiencyAnalysisPage.tsx) — 主页面
- [src/features/logistics/efficiency/EfficiencyAnalysisDetailPage.tsx](src/features/logistics/efficiency/EfficiencyAnalysisDetailPage.tsx) — 详情页
- [src/utils/efficiencyAnalysis.ts](src/utils/efficiencyAnalysis.ts) — 核心计算逻辑
- [src/utils/excelExport.ts](src/utils/excelExport.ts) — xlsx 导出工具

**已知 TODO**：禁行时间配置化（Yard.restrictedHours 字段）/ 超时归因规则引擎

---

##### 8. 共享基础设施

**交付范围**：跨模块复用的工具 + 组件 + 服务。

**关键文件**：
- [src/components/dispatch/dispatchStatusMap.ts](src/components/dispatch/dispatchStatusMap.ts) — 状态映射统一
- [src/utils/clipboard.ts](src/utils/clipboard.ts) — 跨平台复制兜底
- [src/utils/signToken.ts](src/utils/signToken.ts) — 签收 token 工具
- [src/utils/h5BaseUrl.ts](src/utils/h5BaseUrl.ts) — H5 base URL 常量
- [src/services/crossOrigin.ts](src/services/crossOrigin.ts) — 跨 origin 通信桥接（M3 已废弃 YARD_ENTER/YARD_LEFT，仅保留 silent drop）
- [src/services/dingtalk.ts](src/services/dingtalk.ts) — pushByTemplate 公共实现

**已知 TODO**：真实钉钉推送（待后端联调）

---

#### 🔄 11 commit 整理为 9 个意图 commit（squash 整理）

feat/arrival-processing 分支历史 11 个 commit（含 4 个状态机横跳）已重写为：
1. `feat(data)` 数据层
2. `refactor(infra)` 共享基础设施
3. `feat(pc-ui)` PC 端 UI + 调度时效增强
4. `feat(state-machine)` 状态机重写
5. `feat(driver-h5)` 司机端 H5 + 端口迁移
6. `feat(customer-h5)` 客户签收 H5
7. `feat(salesperson+company)` 销售/公司端 H5
8. `ui(mobile-h5)` 统一 UI 规范
9. `fix(docs)` mobile-h5 设计标准修正
10. `docs(changelog)` 本章节同步

符合 CLAUDE.md 单意图 commit 规范。

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
| 调度时效分析 5 指标 + Excel 导出 | `/logistics/efficiency` 4 Tab | ✅ |
| 调度时效详情 + 单园区 YardMetricsCard | `/logistics/efficiency/:id` | ✅ |
| token 单次使用防重放 | markYardEntered 清空 token | ✅ |
| 进入守卫（entering > loading） | 脏数据测试 | ✅ |

#### ⚠️ 已知 TODO

- [ ] H5 真机扫码（需 HTTPS 部署 + 相机权限）
- [ ] 真实钉钉推送（待后端联调）
- [ ] 跨天场景禁行时段计算
- [ ] 禁行时间配置化（Yard.restrictedHours）
- [ ] 超时归因规则引擎
- [ ] 客户/销售/公司登录流程（M3）

---

### v0.5.0-M2.2 - 库房排队状态机 v2 + 移除客户签收(2026-07-13)

#### 🎉 阶段交付:M2.2 v2 状态机重构 — 移除客户签收 + 新增 queued + Mock 道闸放行

**✅ 业务范围**:派车 → GPS/扫码统一入场 → Mock 道闸放行 → 入园 → 装货 → 离场 → 司机自助确认完成,覆盖 8 级状态流转 + 全链路无客户签收。

#### 📦 5 个 commit 单意图交付

| Commit | 文件数 | 主题 |
|--------|--------|------|
| `f1b3dc7` | 2 | refactor(types): queued 状态 + 删 customer_signed/arrived_by_gps |
| `f601334` | 3 | feat(state-machine): 4 个新 API + deriveStatus 重写 8 级 |
| `679503b` | 2 | feat(warehouse): queued 看板 + 通知入场 Mock 道闸放行 |
| `1f42b9f` | 7 | feat(h5): 司机扫码排队按钮 + 演示控制台状态机快捷 |
| `4c9f373` | 13 | refactor: 移除客户签收全链路(4角色→3角色 + 删除 H5) |

#### 🎯 新增功能

##### 状态机 v2
- ✅ `queued` 状态(扫码排队 / GPS 检测统一)
- ✅ Mock 道闸放行 API(3 秒自动开闸,M3 接真实 API)
- ✅ `markYardQueuedByScan` 司机扫码排队
- ✅ `markYardQueuedByGps` GPS 检测
- ✅ `triggerGateOpen` 库房员通知入场 + 道闸开闸
- ✅ `completeByDriverConfirm` 司机确认完成链式 completed

##### 库房员 UI
- ✅ 新增「🚧 排队中(等待道闸放行)」独立 Card 看板
- ✅ 「通知入场(Mock 道闸)」按钮 + 3 秒 toast 动画
- ✅ 状态徽章更新:「等入场」/「待放行」/「待通知装货」

##### 司机 H5
- ✅ DispatchCard 新增【📱 扫码排队】按钮
- ✅ queued 状态显示【🚧 排队中 · 等待库房员开闸】提示
- ✅ 演示控制台新增【⏩ 状态机演示】section
  - 【🚪 模拟道闸放行(queued → entering)】
  - 【✅ 模拟完成(driver_confirmed → completed)】

#### ❌ 删除功能

- ❌ 客户签收 H5 页面(mobile-h5/.../customer/sign)
- ❌ 4 角色 → **3 角色**(删除 customer 角色,DemoControlPanel / role-select 同步)
- ❌ DispatchStore `signByCustomer` / `generateSignUrl`
- ❌ YardTimeline `signedAt` / `signaturePhotos` / `signatureNote`
- ❌ DispatchStatus `customer_signed` / `arrived_by_gps`
- ❌ `src/utils/signToken.ts` / `src/utils/h5BaseUrl.ts` / `mobile-h5/utils/signToken.ts`
- ❌ 订单详情页「签收照片 Card」+「客户签收链接 Modal」(含二维码)
- ❌ 司机订单详情「到达状态横幅(arrived_by_gps / customer_signed)」+「签收链接展示卡」+「签收链接复制/分享」

#### 🔄 修改

- 🔄 `markYardEnteredByGps` → `markYardQueuedByGps`(不再直接 entering,先 queued)
- 🔄 `confirmArrivalByDriver` 链式触发 completed
- 🔄 `deriveStatus()` 优先级:11 级 → 8 级(无中间态细分)

#### 📝 文档同步

- 新增 PRD:[docs/PRD/M2-PRD-库房排队v2.md](docs/PRD/M2-PRD-库房排队v2.md)
- 设计决策与权衡记录在 PRD §1.1 / §5 / §6
- E2E 场景截图清单记录在 PRD §5.3

#### ⚠️ 已知 TODO(本增量未处理)

- [ ] **效率分析模块清理**:`src/features/logistics/efficiency/EfficiencyAnalysisPage.tsx` 仍读 `y.signedAt`(运行时 undefined,无害)。M2.3 增量处理。
- [ ] **Excel 导出「签收时间」列**:同样读 `y.signedAt`,改为展示「完成时间」(`completedAt`)。
- [ ] **dispatchStatusMap.ts**:`src/components/dispatch/dispatchStatusMap.ts` 第 14 行报错'DispatchStatus not exported'(预存在,与本增量无关)。
- [ ] **DevActions dashed prop 报错**:antd 4 → 5 类型不兼容(预存在)。
- [ ] **seed.ts materialCode / medium_truck**:预存在测试数据。
- [ ] **dingtalk.ts `pushSignNotify`**:无 caller,变 orphan,后续单独清理。
- [ ] **types/dispatch.ts `DispatchEfficiency.signedAt` 字段**:同上,M2.3 处理。
- [ ] 客户签收 H5 走产品路线决策（用户已反馈"实际客户不会进行该操作"）

---

### v0.6.0-M2.4 - 调度时效 5 漏斗计数 + 园区对比柱状图(2026-07-14)

#### 🎉 阶段交付:M2.4 调度时效可视化升级 — 绝对数漏斗 + 园区对比

**✅ 业务范围**:在 v0.5.0-M2.2(3 比率卡)基础上,新增 5 个绝对数漏斗计数卡(车辆总数) + 1 套按园区拆分的 ECharts 对比柱状图 + Excel 导出加 2 个 Sheet。

#### 📦 6 个 commit 单意图交付

| Commit | 文件数 | 主题 |
|--------|--------|------|
| `2e8a5cc` | 2 | refactor(efficiency): 删超时/签收/平均装货列(表格/分组/Excel 联动) |
| `848c925` | 2 | chore(deps): 新增 echarts + echarts-for-react 依赖 + 同步完整 deps |
| `4b7c68c` | 1 | feat(utils): 5 漏斗计数函数 + 园区对比聚合(含 dayjs 修复) |
| `a525df4` | 2 | feat(efficiency): 第 2 行新增 5 漏斗计数卡 |
| `6550a36` | 1 | feat(efficiency): 园区时效对比柱状图(拆分图 + 轴标题) |
| `e6b7bcb` | 2 | feat(efficiency): Excel 导出新增「漏斗计数」「园区对比」2 个 Sheet |

#### 🎯 新增功能

##### 5 漏斗计数卡(车辆总数)
- ✅ **需求到场**:`dispatch.expectedLoadTime ∈ 筛选范围` 的车辆总数
- ✅ **实际到场**:任一 `YardTimeline.queuedAt ∈ 筛选范围` 的车辆总数
- ✅ **已装完**:任一 `YardTimeline.loadingCompletedAt ∈ 筛选范围` 的车辆总数
- ✅ **已出场**:任一 `YardTimeline.leftAt ∈ 筛选范围` 的车辆总数
- ✅ **已到货**:任一 `YardTimeline.driverConfirmedAt ∈ 筛选范围` 的车辆总数
- 配色梯度:紫(需求)→蓝(实际)→青(装完)→绿(出场)→橙(到货)
- 公式文案按用户原话保留(非语义重写)

##### 园区时效对比柱状图(ECharts 5)
- ✅ **拆分图设计**:1 园区 1 独立 Chart(横排并排)
- ✅ **4 指标 X 轴**:需求到场 / 按时到场 / 及时装货完成 / 按时到货
- ✅ **柱顶 label 默认显示**:`数量\n(占比%)`,0 值不显示
- ✅ **占比分母按各 metric 语义**:
  - 需求到场 = 100%(自身即分母)
  - 按时到场 / 及时装货完成 / 按时到货 = `该值 / 该 yard 的 expected`
- ✅ **轴标题**:X 轴「业务指标」/ Y 轴「车辆数(辆)」(12px 灰字)
- ✅ **配色**:秦壁蓝 `#1677ff` / 甘亭紫 `#722ed1`
- ✅ **空数据回退**:`<Empty>` 占位,无脏图表

##### Excel 导出扩展(4 Sheet → 6 Sheet)
- ✅ **Sheet 5「漏斗计数」**:5 行 × 4 列(排名/指标/当前计数/公式)
- ✅ **Sheet 6「园区对比」**:N 行 × 5 列(园区/需求到场数/按时到场数/及时装货完成数/按时到货数)
- 文件名不变:`调度时效分析_YYYYMMDD_HHmm.xlsx`

#### 🔧 技术决策

- **新增依赖**:echarts@^5.6.0 + echarts-for-react@^3.0.6
- **tree-shaken import**:`BarChart + GridComponent + TooltipComponent + LegendComponent + TitleComponent + CanvasRenderer`,体积约 ~200KB gzipped(vs 全量 ~900KB)
- **Safari 兼容**:`.replace(' ', 'T')` + `dayjs/plugin/isBetween` 显式 extend
- **utils 复用**:5 个独立 calc 函数 + `calcFunnelCounts` 合并 helper + `buildYardComparisonRows` 聚合函数
- **TS 验证**:每 commit 后 `tsc --noEmit` EXIT 0

#### 📝 文档同步

- 新增 PRD:[docs/PRD/M2-PRD-调度时效指标改造.md §6](docs/PRD/M2-PRD-调度时效指标改造.md)
- 设计决策:漏斗卡片语义 / 图表轴向选择 / Sheet 5/6 设计

#### ⚠️ 已知限制

- **Mock 数据稀疏**:`driverConfirmedAt` 仅 3/18 条 mock 有,「已到货」柱常显示低值或 0 — 演示数据限制,真实数据无此问题
- **多园区调车单 per-yard 计数**:1 张 dispatch 含多园区时,会按园区重复计入(图表「需求到场」柱可能 > 唯一车辆数),Tooltip 已标注
- **echarts 200KB 体积**:tree-shake 后约 200KB gzipped;若需进一步控制可改用 `React.lazy` 延迟加载(本增量未做)

#### 🐛 修复

- `efficiencyAnalysis.ts` 缺 `import dayjs` + `dayjs.extend(isBetween)`(M2 utils 用 `dayjs().isBetween()`,原文件用 `new Date()` 不需要 dayjs)— squash 进 M2 commit 不占独立 slot
- package.json amend(原文件未入 git,首次提交触发完整 deps 同步)— amend M1 不占独立 slot

#### ✅ 用户验收

- 2026-07-14 用户验收通过(`6550a36` v3 拆分图 + 轴标题后),交付完成

---

### v0.7.0-M2.5 - 按园区 Tab 月度透视表(2026-07-14)

#### 🎉 阶段交付:M2.5 园区×月度透视表 — Tab 默认位 + 全期汇总保留

**✅ 业务范围**:在 M2.4 基础上,「按园区」Tab 新增「按月度」透视表(放首位作为默认视图),保留原「全期汇总」表格(下移)。

**业务动机**:当前「按园区」Tab 只有全期汇总,无法回答"2026 年 6 月秦壁园区的 4 小时装货达成率是多少"。月度透视表补齐时间维度,支持「按月下钻园区表现」。

#### 📦 3 个 commit 单意图交付

| Commit | 主题 |
|--------|------|
| `c1cce40` | feat(utils): 新增 `buildYardMonthlyRows` 按园区×月度聚合 |
| `3ce7a0d` | feat(efficiency): 新增 `YardMonthlyPivot` 透视表组件 |
| `252f1e1` | feat(efficiency): 按园区 Tab 新增月度透视表(默认位) + 全期汇总保留 |

#### 🎯 新增功能

##### YardMonthlyPivot 透视表组件

- ✅ **7 列**:园区(合并) / 月份 / 调车需求(辆) / 未按时到场(辆) / 及时到场率 / 未达成4小时装货(辆) / 4小时装货达成率
- ✅ **园区合并**:`rowSpan` 实现(同园区多月份合并园区名)
- ✅ **排序**:yardName 字典序 → monthLabel 倒序(最新月在上)
- ✅ **比率列 Tag 着色**:`>= 80` 绿 / `< 80` 红(对齐 M2.4 图表配色)
- ✅ **demand=0 防空**:`-` 显示替代 `#DIV/0!`
- ✅ **月份 Tooltip**:`monthStart.format('YYYY-MM-DD')` 展示完整日期
- ✅ **数据源**:`utils/efficiencyAnalysis.ts` → `buildYardMonthlyRows`

##### 按园区 Tab 默认位调整

- ✅ **顺序变更**:月度透视表移到 Tab 上半(默认显示),全期汇总下移并加 `Typography.Title level=5` "全期汇总" 标题区分
- ✅ **复用 Page**:Tab 内容改为 `<Space direction="vertical">` 包裹两层(月度透视 + 全期汇总)
- ✅ **不变**:5 筛选条件 + 3 比率卡 + 5 漏斗卡 + 园区对比柱状图(全部保持)

#### 🔧 技术决策

- **新 utils 函数**:`buildYardMonthlyRows({ dispatches, analyses, yards })` — 按 `yardId × monthStart` 二维聚合
- **monthLabel 生成**:`dayjs.monthStart.format('YYYY-MM')` 简洁展示
- **rowSpan 实现**:组件内 `useMemo` 提前计算(见 `displayRows` 逻辑)
- **TS 验证**:每 commit 后 `tsc --noEmit` EXIT 0

#### ⚠️ 已知限制

- **Mock 数据稀疏**:mock 仅覆盖 2026-06~07 月份,演示时月度数据有限 — 真实数据无此问题

---

### v0.8.0-M2.6 - 按公司 Tab 透视表 + 移除按方向 Tab(2026-07-14)

#### 🎉 阶段交付:M2.6 公司×方向透视表 — Tab 合并 + 字段语义重构

**✅ 业务范围**:在 M2.5 基础上,「按公司」Tab 由聚合表改造为透视表(8 列),并把原「按运输方向」Tab 吸收合并,Tab 总数从 4 减为 3。

**业务动机**:原 Tab 是「公司聚合」或「方向聚合」两个独立视角,业务方需要交叉维度(某公司在某方向的达成情况)只能人工 join。新透视表直接按 (公司, 方向) 二维聚合,一次性看穿两个维度。

#### 📦 3 个 commit 单意图交付

| Commit | 主题 |
|--------|------|
| `c45adb7` | feat(utils): 新增 `buildCompanyDirectionRows` 按公司×方向聚合 |
| `6fb3d49` | feat(efficiency): 新增 `CompanyDirectionPivot` 透视表组件 |
| `9312d4f` | feat(efficiency): 按公司 Tab 改造为透视表 + 移除按方向 Tab |

#### 🎯 新增功能

##### CompanyDirectionPivot 透视表组件

- ✅ **8 列**:物流公司 / 路线 / 时效要求 / 应到数量 / 需求到场车辆 / 按时到场车辆 / 及时装货完成车辆 / 按时到货车辆
- ✅ **公司行合并**:`rowSpan` 实现(同公司多方向合并公司名)
- ✅ **排序**:companyName 字典序 → direction 字典序
- ✅ **绝对数语义**:8 列全部为车辆总数(无数值比率)— 与用户截图样式一致
- ✅ **0 值不显示 Tooltip**:避免噪声
- ✅ **数据源**:`utils/efficiencyAnalysis.ts` → `buildCompanyDirectionRows({ dispatches, analyses, companies })`

##### 「按公司」Tab 改造

- ✅ **字段语义对齐**:
  - `assigned`(应到数量) = 被派车辆(`status >= dispatched`)
  - `planned`(需求到场车辆) = `expectedLoadTime ∈ 筛选时间范围`
  - `onTimeArrival`(按时到场车辆) = `isOnTimeArrival === true`(30 分钟内)
  - `onTimeLoading`(及时装货完成车辆) = `per YardTimeline, effectiveLoadMin ≤ 4h`
  - `onTimeDelivery`(按时到货车辆) = `isOnTimeDelivery === true`(≤ SLA)
- ✅ **Tab 标签**:`按公司（${companyDirectionRows.length}）`(动态计数)

##### 「按运输方向」Tab 移除

- ✅ **原因**:透视表已涵盖 (公司 × 方向) 二维信息,独立的「按方向」Tab 信息密度低
- ✅ **副作用**:Page 移除 `groupedByDirection` useMemo(后续 M2.7 Excel 同步删除)

#### 🔧 技术决策

- **新 utils 函数**:`buildCompanyDirectionRows({ dispatches, analyses, companies })` — 按 `companyId × direction` 二维聚合
- **关键 import 修复**:`Company` 类型从 `@/types/dispatch` 导入,`dayjs/plugin/isBetween` 显式 extend
- **Page 简化**:移除 `groupedByDirection` useMemo + Tab items 删 1 项(3 → 2 Tab)
- **TS 验证**:每 commit 后 `tsc --noEmit` EXIT 0

---

### v0.8.0-M2.7 - Excel 6 Sheet 与 UI Tab 完全对齐(2026-07-14)

#### 🎉 阶段交付:M2.7 Excel 导出重构 — Sheet 与 UI Tab 一一对应

**✅ 业务范围**:在 M2.6 基础上,Excel 导出从 6 Sheet 改造为 6 Sheet(数量不变,内容与 UI Tab 1:1 对齐),并删除已废弃的「按运输方向」Sheet。

**业务动机**:原 Sheet 2「按公司」、Sheet 4「按运输方向」是旧聚合形态,UI 已改造为透视表后导出仍是旧结构,出现「UI 看透视表、Excel 看聚合表」的割裂。本增量让 Excel 与 UI 完全同步,业务方打开 xlsx 看到的内容就是 UI 上 Tab 的内容。

#### 📦 2 个 commit 单意图交付

| Commit | 主题 |
|--------|------|
| `0e22404` | refactor(efficiency): Excel 6 Sheet 与 UI Tab 完全对齐(含 2 个 fixup) |
| `6b18aad` | refactor(efficiency): handleExport 参数调整 + 移除 groupedByCompany/Direction |

#### 🎯 Excel 6 Sheet 新结构

| # | Sheet | 列数 | 数据源 | 对应 UI Tab |
|:-:|------|:-:|------|------|
| 1 | 调车单明细 | 12 | `analyses` | 调车单明细 Tab |
| **2** | **按公司×方向透视** | **8** | `companyDirectionRows` ← 新 | 按公司 Tab |
| **3** | **按装货园区月度透视** | **7** | `yardMonthlyRows` ← 新 | 按装货园区 Tab 上半 |
| **4** | **按装货园区全期汇总** | 5 | `groupedByYard` | 按装货园区 Tab 下半 |
| 5 | 漏斗计数 | 4 | `funnelCounts` | 顶部 5 漏斗卡 |
| 6 | 园区对比 | 5 | `yardChartRows` | 柱状图 |

**删除**:旧 Sheet「按运输方向」(Tab 已废弃)

#### 🔧 技术决策

- **`ExportParams` 字段调整**:
  - ➕ `companyDirectionRows: CompanyDirectionRow[]`(Sheet 2)
  - ➕ `yardMonthlyRows: YardMonthlyRow[]`(Sheet 3)
  - ➖ 移除 `groupedByCompany`(已废弃)
  - ➖ 移除 `groupedByDirection`(已废弃)
  - 保留 `groupedByYard`(Sheet 4 + Tab 全期汇总)
- **`Page.handleExport` 调整**:传入新字段 + 删除旧字段
- **`Page` useMemo 清理**:删除 `groupedByCompany` + `groupedByDirection`
- **TS 验证**:每 commit 后 `tsc --noEmit` EXIT 0

#### 🐛 修复(本里程碑内 fixup)

| Commit | 现象 | 根因 | 修复 |
|--------|------|------|------|
| `0e22404` fixup | `Syntax error "\u{5c0f}"` dev server 500 | esbuild 严格遵循 ES2015:`{ 4小时装货达成率: 1 }` 中 "4" 不是 ID_Start 字符 | 加引号改为字符串 key `{ '4小时装货达成率': 1 }` |
| `0e22404` fixup | `ReferenceError: Can't find variable: DIRECTION_DELIVERY_SLA_HOURS` | `excelExport.ts` 顶部 import 区只 `import type`,无运行时常量 import;re-export 不会让本文件内部引用 | 顶部 `import { DIRECTION_DELIVERY_SLA_HOURS, ON_TIME_DELIVERY_DEFAULT_HOURS } from '@/types/dispatch'` |

**Why 这 2 个 fixup 不占独立 slot**:都属 M2.7 单一交付意图的子修复,且 M2.7 验收前已通过 git fixup + autosquash 合并回主 commit。

#### 📝 文档同步

- 新增 PRD §10 「Excel 6 Sheet 与 UI Tab 对齐」

#### ✅ 用户验收

- 2026-07-14 用户验收通过(刷新页面 + 导出 xlsx 后 6 Sheet 标签栏全部可见 + 列名匹配),交付完成

---

### v0.9.0 - 代码层优化清单 Phase 1(2026-07-14)

#### 🎉 阶段交付:在不改变业务逻辑的前提下,完成 12 个单意图 commit 的代码层优化

**✅ 业务范围**:代码/设计/功能三维优化清单的「代码」+「设计」维度,**不含核心业务逻辑变更**;零行为变更,纯结构性优化。

**业务动机**:M1/M2 高速迭代过程中沉淀了多处内联 JSX/CSS/工具函数重复,集中在「紧急/拼车 Tag」「KPI 4 卡片 Row」「Safari 时间戳 hack」「派车 Modal」「底部 TabBar」5 处。本次 Phase 1 仅抽 5 个公共组件 + 1 个 utils 函数,作为后续 Phase 2(N)替换的铺垫。

#### 📦 12 个 commit 单意图交付

| # | Commit | 类别 | 主题 |
|:-:|--------|:---:|------|
| 1 | `6f00a40` | fix | H5 dispatched 文案「待出发」→「已派车」对齐 Web 端 |
| 2 | `7cfa9da` | fix | 库房员「通知入场」按钮加 Popconfirm 二次确认(2 处) |
| 3 | `2ea2268` | refactor | OrderDetailPage 顶部流程栏改用 `<DispatchFlowHeader>`(消除 30 行重复 JSX) |
| 4 | `c38e79e` | refactor | 抽 `localDateMs()` 替换 12 处 `new Date(x.replace(' ', 'T')).getTime()` Safari 兼容 hack |
| 5 | `a317406` | feat | 新增 `<DispatchVehicleModal>` 派车 Modal 公共组件(自管 Form + 回调 values) |
| 6 | `d7af20c` | refactor | OrderDetailPage 派车 Modal 改用 `<DispatchVehicleModal>`(消除 38 行内联 JSX) |
| 7 | `a33f919` | feat | 新增 `<MobileTabBar>` H5 公共底部 TabBar 组件(items + activeKey + change 事件) |
| 8 | `cd52927` | refactor | H5 driver/orders/index.vue 底部 TabBar 改用 `<MobileTabBar>`(消除 50 行 CSS + 14 行 template) |
| 9 | `9ea030a` | feat | 新增 `<KpiRow>` 公共 KPI 统计行组件(items + colSpan + tooltip + color) |
| 10 | `ea3aff0` | refactor | WarehouseQueuePage 顶部 4 列 KPI 改用 `<KpiRow>`(消除 22 行 Row/Col/Statistic 模板) |
| 11 | `a3b8752` | feat | 新增 `<BoolTags>` 调车单布尔标签组件(紧急/拼车 颜色集中维护) |
| 12 | `e15199c` | refactor | 4 处页面内联紧急/拼车 Tag 替换为 `<BoolTags>`(消除 8 行重复) |

#### 🎯 5 个公共组件 + 1 个 utils 函数

| 组件 / 函数 | 路径 | 替换范围 | 状态 |
|------------|------|----------|------|
| `<DispatchFlowHeader>` | `src/components/dispatch/DispatchFlowHeader.tsx` | OrderDetailPage / DispatchDetailPage | ✅ Phase 1 已用(原 M1 已有,本次仅替换 1 处) |
| `<DispatchVehicleModal>` | `src/components/dispatch/DispatchVehicleModal.tsx` | OrderDetailPage(已用) + DispatchSchedulePage(Phase 2) | 🔵 Phase 1 建 + 1 处用 |
| `<MobileTabBar>` | `mobile-h5/src/components/MobileTabBar.vue` | driver(已用) + salesperson + company(Phase 2,需主题色 token 化) | 🔵 Phase 1 建 + 1 处用 |
| `<KpiRow>` | `src/components/KpiRow.tsx` | WarehouseQueuePage(已用) + 4 处其他页面(Phase 2) | 🔵 Phase 1 建 + 1 处用 |
| `<BoolTags>` | `src/components/BoolTags.tsx` | 4 处页面全部替换(已用) | ✅ Phase 1 全量替换 |
| `localDateMs()` | `src/utils/index.ts` | 12 处 `efficiencyAnalysis.ts` | ✅ Phase 1 全量替换 |

#### 🔧 关键技术决策

- **「先建后改」拆分模式**:每个组件**拆 2 commit**(feat 建组件 + refactor 替换),避免 1 个 commit 混搭「新增」与「重构」两类意图(违反 CLAUDE.md 单意图规范)
- **`localDateMs()` 抽 12 处**:原代码 12 次重复 `new Date(x.replace(' ', 'T')).getTime()` Safari 兼容模式,集中在 `efficiencyAnalysis.ts` 5 个计算函数块;抽函数后语义自解释 + 改一处生效全部
- **`<DispatchFlowHeader>`** 复用 M1 既有组件:**只替换 1 处**(OrderDetailPage),不强制全量替换(降低本次 PR 风险面)
- **`Tag` import 不清理**:4 处替换页面的 `Tag` 仍被其他渲染使用(状态 Tag / 发运方式 Tag),只替换紧急/拼车 2 行 JSX,保持 diff 最小化

#### 🚧 Phase 2(N) 预留工作(本期未做)

| # | 任务 | 阻塞原因 |
|:-:|------|----------|
| P2-1 | `<DispatchVehicleModal>` 替换 DispatchSchedulePage 顶部 chip 摘要区 | chip 区需先决策(摘要 vs 完整 Modal 入口) |
| P2-2 | `<MobileTabBar>` 替换 salesperson + company 页 TabBar | 主题色 `#13c2c2` / `#fa8c16` 与现有 `--color-brand` token 冲突,需「主题色 token 化」专项 |
| P2-3 | `<KpiRow>` 替换 InventoryListPage / LocationListPage / DispatchSchedulePage / EfficiencyAnalysisPage | 4 处 KPI 视觉差异(3 卡 / 5 卡 / 含 Tooltip)需逐页校准,本期排期外 |
| P2-4 | 「主题色 token 化」专项 | 当前各页硬编码 `#1677ff` / `#13c2c2` / `#fa8c16` / `#722ed1` 等色,建议统一到 `src/theme.ts` |

#### 📝 文档同步

- 新增 PRD `M2-PRD-代码层优化清单.md`(§1 范围 / §2 5 组件规格 / §3 12 commit 复盘 / §4 Phase 2 路线图 / §5 验证门控结果)

#### 🐛 修复(本里程碑内)

无。本批次纯结构性优化,**零业务行为变更**,无 fixup。

#### ✅ 验证门控

| 项 | 结果 |
|----|------|
| `tsc --noEmit` 每 commit 后 | ✅ EXIT 0(12/12) |
| `vue-tsc --noEmit` H5 改动后 | ✅ 无新增错误(2/2:cd52927 / 此前步骤) |
| `npm run dev` 启动 | ✅ 200 OK |
| **CLAUDE.md「验证门控」截图验收** | ⚠️ **未补** — F-04 Popconfirm 涉及 UI 行为,按规则应补 1 张截图 |

#### 📌 用户验收

- 待补 F-04 通知入场 Popconfirm 真实运行截图(按 CLAUDE.md「验证门控规则」)
