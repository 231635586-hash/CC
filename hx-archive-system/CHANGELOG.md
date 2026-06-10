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
| **组织管理** | 部门管理 | /organization/department | 建设中 |
|  | 职位管理 | /organization/position | 建设中 |
|  | 编制管理 | /organization/headcount | 建设中 |
| **员工档案** | 人员档案 | /archive | 已开发 |
|  | 薪资档案 | /salary | 已开发 |
|  | 薪资模版 | /salary-template | 建设中 |
| **报工管理** | 报工记录 | /report-work | 已开发 |
|  | 报工审批 | /report-work/approve | 已开发 |
| **系统管理** | 权限配置 | /settings/permission | 建设中 |

---

## 版本记录

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