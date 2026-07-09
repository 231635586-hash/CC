# Mock 数据维护规范

> 本文档定义 mock 数据的分层、命名、字段、演示剧本。
> 适用：`src/mock/` 全目录。
> 不适用：types（类型定义）、stores（store 实现）、components（UI 组件）。

---

## 1. 分层模型

mock 数据按"种子 → CRUD → store"三层流动：

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 种子数据（seed）                              │
│    src/mock/seed.ts    src/mock/inventory.ts           │
│    src/mock/customer.ts                                │
│    → 写死的"原始数据"，无任何派生逻辑                    │
├─────────────────────────────────────────────────────────┤
│  Layer 2: CRUD + 迁移（db）                            │
│    src/mock/db.ts                                       │
│    → localStorage 读写                                  │
│    → migrateDB：兜底字段 / 修历史 bug（**不下线老迁移**）│
├─────────────────────────────────────────────────────────┤
│  Layer 3: Store 注入                                    │
│    src/stores/*.ts                                      │
│    → loadList 时注入派生字段（yarname / 距离）          │
│    → 兜底回填（salesPersonName）                        │
└─────────────────────────────────────────────────────────┘
```

**铁律**：
- Layer 1 **绝不写派生字段**（如 yarname）
- Layer 2 **绝不写业务逻辑**（仅数据修复）
- Layer 3 **绝不重新读 mockXxx 之外的种子**

---

## 2. ID 命名规范

| 实体 | 格式 | 示例 |
|---|---|---|
| 园区 | `mock-yard-NNN` | `mock-yard-001` |
| 物流公司 | `mock-company-NNN` | `mock-company-001` |
| 车辆 | `mock-vehicle-NNN` | `mock-vehicle-001` |
| 司机 | `mock-driver-NNN` | `mock-driver-001` |
| 用户 | `mock-user-NNN` | `mock-user-001` |
| 角色 | `mock-role-NNN` | `mock-role-001` |
| 钉钉机器人 | `mock-bot-NNN` | `mock-bot-001` |
| 车辆位置 | `mock-loc-NNN` | `mock-loc-001` |
| 调车单 | `mock-dispatch-NNN` | `mock-dispatch-001` |
| 客户 | `CUS-YYYY-NNN`（业务号） | `CUS-2026-001` |
| 库存 | `INV-YYYYMMDD-NNNN`（业务号） | `INV-20260620-0001` |
| 调车单号 | `DCYYYYMMDDNNN`（业务号） | `DC20260622001` |

**规则**：
- `mock-xxx-NNN` 前缀是**种子数据 ID**，永远不变
- `CUS-YYYY-NNN` / `INV-YYYYMMDD-NNNN` 是**业务号**（生产环境真业务也会用）
- **新增数据时递增编号**，不要复用旧编号

---

## 3. 字段冗余规则

### 3.1 ❌ 禁止：seed 写派生字段

```ts
// ❌ 错误：seed 里冗余写 yarname
{ yardId: 'mock-yard-001', yarname: '秦壁' }
```

### 3.2 ✅ 正确：seed 只写 ID，name 由 Layer 3 注入

```ts
// ✅ 正确：seed 只写 yardId
{ yardId: 'mock-yard-001' }

// Layer 3 stores/dispatch.ts 在 loadList 时注入：
yardName: yardMap.get(d.yardId)
```

### 3.3 例外

**钉钉消息模板 variables 里的 `${yardName}` 是模板占位符**，不是冗余字段，**必须保留**：

```ts
// ✅ 正确：模板字符串里出现的字段名是占位符
{
  template: '车辆入园通知',
  content: '车辆 ${plateNo} 已到 ${yardName}',
  variables: ['plateNo', 'yardName'],   // ← 必须列出
}
```

---

## 4. 时间字段约定

| 场景 | 格式 | 示例 |
|---|---|---|
| seed 静态时间 | `YYYY-MM-DD HH:mm:ss` | `'2026-06-22 14:30:00'` |
| ISO 时间戳（前端存） | `new Date().toISOString()` | `'2026-06-22T06:30:00.000Z'` |
| importDate（业务字段） | ISO | `'2026-06-22T06:30:00.000Z'` |

**统一规则**：
- seed 用 `YYYY-MM-DD HH:mm:ss`（**人类可读**）
- store / 业务字段用 ISO（**程序可比较**）
- 展示时统一用 `formatDateTime()` 工具

---

## 5. 演示剧本覆盖要求

mock 数据**必须覆盖业务全状态**，否则演示时遇到"没数据"的状态会被客户问"这个功能怎么没数据"。

### 5.1 调车单（`mockDispatches`）

| 状态 | 演示场景 | 数量 |
|---|---|---|
| `pending_confirm` | 营销员收到调车单 | ≥1 |
| `confirmed` | 已确认待派车 | ≥1 |
| `dispatching` | 派车中（正在选车/选司机） | ≥1 |
| `dispatched` | 已派车待出发 | ≥1 |
| `entering` | 车辆 GPS 入园中 | ≥1 |
| `loading` | 库房员装货中（M3 中间态） | ≥1 |
| `leaving` | 装完等待 GPS 离厂 | ≥1 |
| `completed` | 订单已完成 | ≥1 |
| `cancelled` | 已作废 | ≥1 |

**当前覆盖**（2026-06-27）：9/9 状态全覆盖。

### 5.2 库存（`mockInventory`）

| 状态 | 演示场景 | 数量 |
|---|---|---|
| `in_stock` | 已入库（在库） | ≥10 |
| `locked` | 已锁定（被调车单引用） | ≥5 |
| `shipped` | 已发货（装货完成已离场） | ≥5 |
| `voided` | 已作废 | ≥2 |

**订单类型**：`rough_self_use` / `normal` / `sample` / `return` 都至少有 1 条
**包装类型**：`ton_bag` / `zhongji_ub108` / `wooden_box` 都至少有 1 条

### 5.3 车辆位置（`mockVehicleLocations`）

**演示场景**（按距离园区分类）：
| 场景 | 距园区距离 | 演示用途 |
|---|---|---|
| 园区门口 | < 300m | GPS 入园判定演示 |
| 附近 | 1-10km | "X 分钟后到"演示 |
| 高速 | 20-50km | 长途运输中演示 |
| 跨城 | 100-300km | 多园区调度演示 |

每个场景至少 1 条。

---

## 6. 不允许的反模式

| ❌ 反模式 | ✅ 正确做法 |
|---|---|
| 组件直接 import seed 数据 | 走 store → mockDB → seed |
| seed 写 yarname / companyName 等派生字段 | seed 只写 ID，name 由 Layer 3 注入 |
| seed 写硬编码日期 `new Date()` | 用 `'2026-06-22 14:30:00'` 字符串 |
| store 里 import seed 数据后直接用 | 走 loadList 注入派生字段 |
| db.ts 写业务逻辑 | db.ts 只做 CRUD + migrate |
| migrate 段不带"过期检查" | 每次重构都要确认哪些段已下线 |

---

## 7. 演示真实感提升（高级）

### 7.1 距离字段（VehicleLocation）

`distanceToQinbiKm` / `distanceToGantingKm` 是**演示字段**：

- seed 静态值（提供初始数据）
- `mockDB.listVehicleLocations` 实时 Haversine 计算（GPS 流 tick 时自动更新）

**好处**：客户演示时能直接说"这车距园区 X 公里，Y 分钟到"，**不再被问"这车现在在哪"**。

### 7.2 时间梯度

调车单 mock 数据按**时间梯度**分布：

```
2026-06-22 → 早期单（completed）
2026-06-25 → 中期单（loading / leaving / completed）
2026-06-27 → 最新单（dispatching / loading / cancelled）
```

**好处**：演示不同时间维度的筛选（按日 / 按周 / 按月）。

---

## 8. 变更记录

| 日期 | 变更 | 影响 |
|---|---|---|
| 2026-07-08 | yarname 由 seed 抽离到 store 注入 | seed.ts -15 行，inventory.ts -31 行 |
| 2026-07-08 | migrateDB 删 #2 #4 #5 #6 死迁移 | db.ts -70 行 |
| 2026-07-08 | vehicleLocation 加距离字段 | types/archives.ts +6 行，seed 5 条重写 |
| 2026-07-08 | inventory.ts 分段注释 | +20 行（导航提速） |
| 2026-07-08 | dispatch 演示剧本补 3 条 | seed.ts +130 行（dispatching/loading/cancelled） |

---

## 9. 相关文档

- [docs/PRD/](../PRD/)：业务需求
- [docs/plans/](../plans/)：技术方案（含状态机演进）
- [docs/API/](../API/)：未来真实 API 契约