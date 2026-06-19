# 华翔人员档案管理系统 - 开发文档

## 项目信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 华翔人员档案管理系统 |
| 项目路径 | /Users/roro/Vibe coding/hx-archive-system |
| 开发框架 | React + TypeScript + Vite |
| UI库 | Tailwind CSS (CSS变量方案) |
| 状态管理 | Zustand |
| 路由 | React Router v6 |

---

## 菜单结构

| 一级菜单 | 二级菜单 | 路由 | 状态 |
|----------|----------|------|------|
| **组织管理** | 部门管理 | /organization/department | 已开发 |
|  | 职位管理 | /organization/position | 已开发 |
|  | 职级管理 | /organization/rank | 已开发 |
|  | 编制管理 | /organization/headcount | 已开发 |
|  | 部门档案 | /organization/department-archive | 已开发 |
| **员工档案** | 人员档案 | /archive | 已开发 |
|  | 薪资档案 | /salary | 建设中 |
|  | 薪资模版 | /salary-template | 建设中 |
| **报工管理** | 报工记录 | /report-work | 已开发 |
|  | 报工审批 | /report-work/approve | 已开发 |
| **系统管理** | 权限配置 | /settings/permission | 建设中 |

---

## 版本记录

### v1.0.6 - 编制详情 Drawer + 临时编制续约

**日期**: 2026-06-19

**更新内容**:

1. **编制详情 Drawer（V1.4 重大新增）**
   - 点击职位行 → 右侧滑出 520px Drawer（参照 DepartmentDetailPanel 风格）
   - **块 A 全年汇总**：编制总数 / 已占用 / 剩余 / 占用率 4 个指标卡 + 正式/临时编制分项
   - **块 B 临时编制明细**：每条卡片展示状态徽标（待生效/生效中/即将到期/已失效）、起止日期、人数、剩余天数、所在月份
   - **块 C 变更历史摘要**：近 5 条记录 +「查看全部」按钮跳转扩展版 EstablishmentHistoryModal（按职位维度）
   - 切换部门自动关闭 Drawer，ESC 关闭，body 锁滚动
   - 客户端自聚合 12 个月 cell，零额外请求

2. **临时编制数据补充（mockData）**
   - 覆盖 5 个核心部门（前端/后端/产品/销售/质量）
   - 覆盖 4 种状态：active / expiring / pending / expired
   - 后端组（dept-bdz/pos-002）新增 9 月 expiring 临时编制（剩 13 天）
   - 质量部（dept-zlb/pos-006）新增 9 月 expiring 临时编制（剩 6 天）
   - 前端组（dept-qdz/pos-001）新增 10 月 active 临时编制（剩 73 天）
   - 产品部（dept-cpb/pos-003）新增 9 月 pending 临时编制
   - 销售部（dept-xsb/pos-004）新增 9 月 pending 临时编制
   - 配套 5 条 approved 历史记录，保证矩阵可见

3. **临时编制续约功能（V1.4 新增核心交互）**
   - 仅【即将到期】（≤14天）的临时编制卡片显示【续约】按钮（amber 边框提示）
   - 点击按钮 → 居中 Modal 弹窗，含当前信息 + 新 endDate（DatePicker）+ 续约原因 + 备注
   - 新 endDate 默认 = 当前 endDate + 90 天，可自由调整
   - 实时显示「原日期 → 新日期（续约 N 天）」对比
   - **走审批流**：仅生成 pending 历史（`changeType: 'temp_extend'`），endDate 不立即变更
   - 校验：新 endDate 必须 > 当前 endDate + 续约原因必填
   - 提交后 Toast「续约申请已提交，待审批」+ Drawer 块 C 出现新 pending 记录

4. **service 层扩展**
   - 新增 `getEstablishmentHistoryByPosition(deptId, posId, year)`：按职位维度聚合历史
   - 新增 `applyTempExtend(establishmentId, newEndDate, reason, remark?)`：仅生成 pending，不改数据
   - 现有 `extendTempEstablishment` 保留作为 admin 直接生效接口

5. **EstablishmentHistoryModal 扩展**
   - props 新增 `mode?: 'byCell' | 'byPosition'`
   - 按 mode 走不同 service、标题显示年份徽标、CSV 文件名区分
   - 老调用点零修改（mode 默认 'byCell'）

**涉及文件**:
- `package.json` - 版本号 1.0.5 → 1.0.6
- `src/features/organization/services/api.ts` - 新增 2 个 service
- `src/features/organization/services/mockData.ts` - 补充 5 条 temp establishment + 5 条 history
- `src/features/organization/components/EstablishmentDetailDrawer.tsx` - **新建**
- `src/features/organization/components/EstablishmentExtendModal.tsx` - **新建**
- `src/features/organization/components/EstablishmentHistoryModal.tsx` - 扩展 mode
- `src/features/organization/components/index.ts` - 导出 2 个新组件
- `src/features/organization/pages/EstablishmentPage.hooks.ts` - state + 4 个回调
- `src/features/organization/pages/EstablishmentPage.tsx` - 挂载 2 个新组件

---

### v1.0.5 - 报工管理模块 UI 优化 + 薪资档案调整

**日期**: 2026-06-17

**更新内容**:

1. **报工记录页面优化**
   - 调用 impeccable-skill 进行 UI 优化
   - 页面仅允许查看，移除补报操作入口
   - 日期筛选调整至状态筛选之后

2. **报工审批列表页优化**
   - 调用 impeccable-skill 进行 UI 优化
   - 移除批量勾选功能
   - 操作栏新增通过/驳回按钮，点击弹窗审批
   - 按钮样式统一（variant="secondary"）

3. **报工审批详情页优化**
   - 删除编辑按钮
   - 内容全宽展示，符合 Web 端用户习惯
   - 审批按钮调整为较小尺寸（size="sm"）

4. **报工记录详情页优化**
   - 删除编辑按钮

5. **薪资档案模块调整**
   - 薪资档案列表页/详情页调整为「正在开发中」页面

**涉及文件**:
- src/features/report-work/pages/ReportWorkListPage.tsx - 日期筛选调整
- src/features/report-work/pages/ReportWorkDetailPage.tsx - 删除编辑按钮
- src/features/report-work/pages/ApproveListPage.tsx - 审批按钮+弹窗
- src/features/report-work/pages/ApproveDetailPage.tsx - 全宽布局+删除编辑
- src/App.tsx - 薪资档案路由调整

---

### v1.0.4 - 编制管理模块优化 + 细节完善

**日期**: 2026-06-17

**更新内容**:

1. **职级管理页面优化**
   - 搜索框 placeholder 修改为「搜索职级」
   - 搜索框外层容器统一（w-[280px] 包裹）
   - 列表列顺序调整：职层/职务划分互换
   - 职务序列提示词修改为「职务划分」

2. **编制管理页面优化**
   - 矩阵内添加职位搜索框
   - 添加汇总统计栏（总编制/已占用/剩余/占用率）
   - 空状态优化：未选部门时显示「请选择部门」
   - 图例改为可折叠面板，简化显示
   - 矩阵月份表头固定（横向滚动时保持可见）
   - 按钮文字防止换行（Button 组件添加 whitespace-nowrap）
   - 批量调整模式：锁定状态单元格不可编辑，显示锁定图标
   - 批量操作禁用「批量调整」入口
   - 按钮更名：「批量操作」→「批量锁定/解锁」
   - 批量选择模式新增「全选」按钮
   - 「审批记录」→「审批流程」，并添加 History 图标

**涉及文件**:
- src/features/organization/pages/RankPage.tsx - 搜索框和列顺序调整
- src/features/organization/components/RankList.tsx - 列表列顺序
- src/features/organization/pages/EstablishmentPage.tsx - 全面优化
- src/features/organization/pages/EstablishmentPage.hooks.ts - 全选功能
- src/features/organization/components/EstablishmentMatrix.tsx - 表头固定、锁定不可编辑
- src/components/ui/Button.tsx - whitespace-nowrap

---

### v1.0.3 - 组织管理模块完善 + UI优化

**日期**: 2026-06-17

**更新内容**:

1. **部门档案模块完善**
   - 花名册/变动记录/变更记录 Tab 添加分页功能
   - 分页组件样式标准化（匹配职级管理）
   - 修复变动记录数据为空的问题（departmentId 映射修正）
   - 列表页滚动与分页显示正常

2. **菜单结构调整**
   - 职级管理菜单移至职位管理下方
   - 组织管理子菜单顺序：部门管理 > 职位管理 > 职级管理 > 编制管理 > 部门档案

3. **架构图选中样式优化**
   - 采用浅品牌背景（var(--color-brand-light)）替代深色背景
   - 增加选中阴影效果，提升层次感
   - 文字与边框使用品牌蓝色，形成清晰视觉反馈

**涉及文件**:
- src/components/layout/AppSider.tsx - 菜单顺序调整
- src/features/organization/pages/DepartmentArchivePage.tsx - 分页功能
- src/features/organization/components/DepartmentMindMap.tsx - 选中样式
- src/components/ui/Pagination.tsx - 分页组件标准化
- src/services/mockData.ts - departmentId 映射修正

---

### v1.0.2 - 菜单选中bug + 报工审批编辑功能

**日期**: 2026-06-10

**更新内容**:

1. **菜单选中bug修复**
   - 子菜单使用精确匹配（===）替代startsWith
   - 解决选中【报工审批】时【报工记录】也被选中的问题

2. **报工审批详情页编辑功能**
   - 新增编辑按钮，仅待审批和已驳回状态显示
   - 可编辑字段：申请班次、报工点、审批班长
   - 新增updateSupplementApplication API

**涉及文件**:
- src/components/layout/AppSider.tsx - 修复菜单选中逻辑
- src/features/report-work/pages/ApproveDetailPage.tsx - 新增编辑功能
- src/features/report-work/services/api.ts - 新增updateSupplementApplication API

---

### v1.0.1 - 报工管理模块 + 菜单结构优化

**日期**: 2026-06-10

**更新内容**:

1. **菜单结构调整**
   - 新增组织管理（一级）+ 部门管理/职位管理/编制管理（二级）
   - 员工档案调整为二级菜单：人员档案/薪资档案/薪资模版
   - 所有未开发页面显示"建设中"通用组件

2. **报工管理模块开发**
   - 报工记录列表页（/report-work）
   - 报工详情页（/report-work/:id）
   - 发起补报页（/report-work/supplement/:date）
   - 报工审批列表页（/report-work/approve）
   - 审批详情页（/report-work/approve/:id）
   - 报工点下拉选择（从系统后台数据获取）
   - 审批班长下拉选择
   - 通过/驳回操作功能

3. **路由调整**
   - 人员档案：/archive（原）
   - 薪资档案：/salary（原）
   - 薪资模版：/salary-template（新增）

4. **Bug修复**
   - 修复菜单选中状态问题（薪资模版误选中薪资档案）

**涉及文件**:
- src/App.tsx - 路由配置
- src/components/layout/AppSider.tsx - 菜单结构
- src/components/layout/UnderConstructionPage.tsx - 建设中页面组件
- src/features/report-work/ - 报工管理模块（全部文件）

---

### v1.0.0 - 项目初始化

**日期**: 2026-06-08

**更新内容**:

1. **项目结构初始化**
   - React + TypeScript + Vite
   - Tailwind CSS 变量方案
   - Zustand 状态管理
   - React Router v6 路由

2. **员工档案模块开发**
   - 人员档案列表页（/archive）
   - 人员档案详情页（/archive/:id）
   - 薪资档案列表页（/salary）
   - 薪资档案详情页（/salary/:id）

3. **基础组件开发**
   - AppLayout - 页面布局
   - AppSider - 左侧菜单
   - AppHeader - 顶部导航
   - UI组件库：Button, Card, Table, Pagination, Input, Select, Badge, Tab

---

## 项目结构

```
hx-archive-system/
├── src/
│   ├── components/
│   │   ├── layout/          # 布局组件
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppSider.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   └── UnderConstructionPage.tsx
│   │   └── ui/              # UI组件
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Table.tsx
│   │       ├── Pagination.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       ├── Tab.tsx
│   │       └── Empty.tsx
│   ├── features/
│   │   ├── archive/        # 人员档案
│   │   │   ├── pages/
│   │   │   │   ├── ArchiveListPage.tsx
│   │   │   │   └── ArchiveDetailPage.tsx
│   │   │   └── components/
│   │   ├── salary/         # 薪资档案
│   │   │   ├── pages/
│   │   │   │   ├── SalaryListPage.tsx
│   │   │   │   └── SalaryDetailPage.tsx
│   │   │   └── components/
│   │   └── report-work/    # 报工管理
│   │       ├── pages/
│   │       │   ├── ReportWorkListPage.tsx
│   │       │   ├── ReportWorkDetailPage.tsx
│   │       │   ├── SupplementApplyPage.tsx
│   │       │   ├── ApproveListPage.tsx
│   │       │   └── ApproveDetailPage.tsx
│   │       ├── services/
│   │       │   ├── api.ts
│   │       │   └── mockData.ts
│   │       └── store/
│   │           └── reportWorkStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── mockData.ts
│   ├── store/
│   │   ├── archiveStore.ts
│   │   ├── salaryStore.ts
│   │   └── authStore.ts
│   ├── types/
│   │   ├── archive.ts
│   │   ├── salary.ts
│   │   └── report-work.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── CHANGELOG.md
```

---

## 开发指南

### 添加新页面

1. 在 `src/features/` 下创建功能模块
2. 在 `App.tsx` 添加路由
3. 在 `AppSider.tsx` 添加菜单项

### 添加未开发页面

```tsx
import { UnderConstructionPage } from '@/components/layout';

<Route path="/path" element={<UnderConstructionPage title="页面名称" />} />
```

---

## 待开发功能

- [ ] 组织管理 - 部门管理
- [ ] 组织管理 - 职位管理
- [ ] 组织管理 - 编制管理
- [ ] 员工档案 - 薪资模版
- [ ] 系统管理 - 权限配置

---

## 注意事项

1. 路由路径使用精确匹配，避免误匹配
2. 未开发页面统一使用 `UnderConstructionPage` 组件
3. 每次更新后同步记录到此文档