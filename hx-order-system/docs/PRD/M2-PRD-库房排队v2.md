# 华翔物流管理系统 M2 增量 PRD · 库房排队状态机 v2

> **版本**:v1.0.9-M2.2
> **编写日期**:2026-07-13
> **基于**:M1 PRD v0.1.0 + M2 调度时效分析 + M2 导出功能
> **本章范围**:移除客户签收环节 + 新增 queued 状态 + GPS / 扫码统一入场 + Mock 道闸放行
> **本章工时**:~6 小时(实际拆分为 5 个 commit)
> **当前实现**:✅ M2 增量 2 完成(已合并到 feat/arrival-processing)

---

## 修订记录

| 版本 | 日期 | 变更摘要 |
|:---:|:---:|------|
| v1.0.9-M2.2 | 2026-07-13 | 移除客户签收;新增 queued 状态;GPS/扫码统一;Mock 道闸 3 秒自动开闸 |

---

## 1. 背景与目标

### 1.1 现状问题(M2 阶段)

M2 阶段的客户签收机制存在三大问题:

1. **客户不配合**:实际业务中,绝大多数客户不主动扫码签收。司机催促成本高,容易引发投诉。
2. **操作门槛高**:链接 + 二维码模式需要客户切换微信/短信/H5 三方操作,流程断裂率高。
3. **伪需求**:根据业务复盘,客户签收数据未能反哺任何决策,意义有限。

此外,M2 状态机有两个深层问题:
- **GPS / 扫码两条入场路径割裂**:GPS 自动入园走 `entering`,司机扫码登记走另一流程,库房员难以理解
- **「通知装货」语义混淆**:`entering` 状态已经在园里,但按钮叫「通知装货」,对库房员来说"装货还没开始"

### 1.2 目标

| # | 目标 | 衡量 |
|---|------|------|
| **G1** | 移除客户签收环节 | 状态机不再有 `customer_signed` / `arrived_by_gps` |
| **G2** | 统一入场流程 | GPS 和扫码都走 `queued` 状态,库房员只需看一个看板 |
| **G3** | Mock 道闸放行 | 库房员通知入场后,3 秒后自动开闸(模拟真实道闸 API 延迟) |
| **G4** | 司机自助确认完成 | 司机 H5 点【确认到达客户】 → 订单自动 `completed`,不再有客户环节 |

### 1.3 非目标

- ❌ 不实现真实道闸 API 集成(M3+ 工作)
- ❌ 不移除 H5 角色中的 customer(m2 增量 3 才做 4 → 3 角色)
- ❌ 不重构 M2 效率分析模块(本次保持不变)

---

## 2. 状态机最终版(v2)

```
派车 → dispatched
        ↓
   【GPS 检测】 / 【司机扫码】
        ↓
      queued ← 排队中,等待库房员开闸(Mock 道闸)
        ↓ (库房员点【通知入场】)
   entering  ← 入园中,等待库房员通知装货
        ↓ (库房员点【通知装货】)
    loading  ← 装货中
        ↓ (库房员点【装货完成】)
    leaving  ← 装货完成,等 GPS 离厂
        ↓ (GPS 自动检测离厂)
   in_transit ← 在途中(GPS 离厂后自动)
        ↓ (司机 H5 点【确认到达客户】)
 driver_confirmed
        ↓ (系统自动链式)
   completed   ← 完成
```

### 2.1 关键设计点

- **GPS 和扫码统一入口**:两种触发方式都写入 `YardTimeline.queuedAt`,状态都变 `queued`
- **库房员为关闸人**:只有库房员能推进 queued → entering(`triggerGateOpen` 带状态守卫)
- **3 秒延迟**:`message.loading(...) + setTimeout 3000` 后才真正开闸
- **司机自助**:司机在 H5 点【确认到达客户】即触发 `completeByDriverConfirm`,无需客户

---

## 3. YardTimeline 字段变化

### 3.1 新增字段

| 字段 | 类型 | 用途 |
|------|------|------|
| `notifyDepartAt` | `Timestamp?` | 库房"通知出发"时间(复用) |

> 注:`triggerGateOpen` 复用 `notifyDepartAt`(语义最接近"库房员通知")
> 如未来需要真正的 `gateOpenAt` 字段,可单独提交类型层加字段

### 3.2 删除字段

| 字段 | 原用途 | 删除原因 |
|------|--------|----------|
| `signedAt` | 客户签收时间 | 客户签收全链路下线 |
| `signaturePhotos` | 客户签收照片 | 同上 |
| `signatureNote` | 客户签收备注 | 同上 |

### 3.3 保留字段(语义降级)

| 字段 | 原用途 | 新用途 |
|------|--------|--------|
| `arrivedByGpsAt` | GPS 入客户园区 → 驱动 arrived_by_gps | 仅作时间记录,不再驱动状态机 |

---

## 4. 删除 / 新增 / 调整清单

### 4.1 新增(4 个 Store API)

- `markYardQueuedByScan` — 司机扫码排队(无 GPS 场景)
- `markYardQueuedByGps` — GPS 检测入场(替代原 `markYardEnteredByGps`)
- `triggerGateOpen` — 库房员通知入场 + 道闸开闸(带状态守卫)
- `completeByDriverConfirm` — 司机确认完成(链式 completed)

### 4.2 删除(2 个 Store API + 多文件)

| 单元 | 处理 |
|------|------|
| `signByCustomer` store API | 删除 |
| `generateSignUrl` store API | 删除 |
| H5 `/customer/sign` 整个目录 | 删除 |
| `mobile-h5/utils/signToken.ts` | 删除 |
| `src/utils/signToken.ts` | 删除 |
| `src/utils/h5BaseUrl.ts` | 删除(原本仅用于生成签收链接) |
| `pushSignNotify` 钉钉通知 | 保留(无 caller,后续单独清理) |

### 4.3 调整

| 单元 | 旧 | 新 |
|------|---|----|
| `markYardEnteredByGps` → | 直接设置 entering | 重命名为 `markYardQueuedByGps`,设置 queued + arrivedByGpsAt |
| `confirmArrivalByDriver` | 写 driverConfirmedAt 即结束 | 链式触发 `completeByDriverConfirm` → completed |
| `deriveStatus()` | 11 级优先级(含 arrived_by_gps / customer_signed 单独 case) | 8 级优先级(无中间态细分) |
| 角色模型 H5 | 4 角色(driver/salesperson/company/customer) | 不变(本次) |
| `WarehouseQueuePage` 看板 | 无独立 queued 看板 | 新增「🚧 排队中(等待道闸放行)」独立 Card |
| `DispatchCard` | 仅「导航前往园区」 | 新增「📱 扫码排队」并列按钮 |
| `DemoControlPanel` | 4 角色网格 | 3 角色网格(本 PRD 暂不动,Task 5 实施) |

---

## 5. E2E 验证场景

### 5.1 场景 A — GPS 车辆(优先)

```
1. 营销员创建调车单(方向:杭州)
2. 物流公司派车时,选择带 GPS 设备的车辆
3. 等待 GPS 流 mock 推送到「入园半径(300m)」触发的 ping
4. 库房员页面 → 主表格【演示:GPS 入库】或真实 GPS 流触发 → queued
5. 库房员进入库房排队页(warehouse),看到 🚧 排队中看板列出该单
6. 库房员点【通知入场(Mock 道闸)】
   → toast: 「已发送放行指令到道闸系统,3 秒后自动开闸...」
   → 3 秒后: 「🚪 道闸已开闸,车辆进入」+ queued 看板该单消失 + 主表格变为 entering
7. 库房员点【通知装货】→ 弹 NotifyLoadingModal 二次确认 → loading
8. 库房员点【装货完成】→ leaving
9. GPS 自动离厂 → in_transit(注意:本场景需真实 GPS 才能完成,演示场景用 DevActions 「车辆出厂」按钮)
10. 司机 H5 端:在订单详情页底栏点【确认到达客户】→ driver_confirmed → 自动 completed
11. 全链路完成
```

### 5.2 场景 B — 无 GPS 车辆(扫码)

```
1-2. 同场景 A
3. 物流公司派车时,选择无 GPS 设备的车辆
4. 司机在 H5 端打开派车单 Tab → 找到 dispatched 卡片
5. 司机点【📱 扫码排队】→ toast「扫码成功,排队中」+ 状态 queued
6-11. 同场景 A 从第 5 步开始
```

### 5.3 关键截图清单(Task 7 验收依据)

- [ ] 库房员页面:🚧 排队中看板 + 主表格的 queued 状态
- [ ] 库房员点通知入场 → toast 提示
- [ ] 3 秒后进入 entering(看板该单消失,主表格出现)
- [ ] 进入 entering → 通知装货 Modal
- [ ] 司机 H5:dispatched 状态显示扫码按钮
- [ ] 司机 H5:点击扫码按钮后,按钮区变为「🚧 排队中」
- [ ] 司机 H5:在订单详情页底栏显示「确认到达客户」按钮
- [ ] 演示控制台:3 个角色按钮 + 状态机快捷按钮

---

## 6. 与现有模块的关系

### 6.1 调度时效分析(`efficiencyAnalysis.ts`)

- 现有逻辑会读取 `y.signedAt` 计算「及时到货率」
- 该字段已删除 → 分母自然归零,「及时到货率」将显示 0% 或 N/A
- **本 PRD 不修复**:M2 效率分析的重做是 M2.3 工作(后续增量)

### 6.2 Excel 导出(`excelExport.ts`)

- 「签收时间」列会显示空白(因 signedAt 已删)
- 不报错(可选字段读取返回 undefined)
- **本 PRD 不修复**:M2.3 工作

### 6.3 钉钉通知(`dingtalk.ts`)

- `pushSignNotify` 无 caller 后变 orphan
- **保留 1 个版本**,后续单独清理

---

## 7. 验收检查清单

- [x] Task 1 完成:类型层重构(`f1b3dc7`)
- [x] Task 2 完成:状态机 Store 重写(`f601334`)
- [x] Task 3 完成:库房员 UI(`679503b`)
- [x] Task 4 完成:司机 H5 + 演示控制台(`1f42b9f`)
- [x] Task 5 完成:移除客户签收全链路(`4c9f373`)
- [ ] Task 6 完成:PRD + CHANGELOG 同步(当前任务)
- [ ] Task 7 完成:E2E 双场景全链路截图

---

## 8. 与 PRD 文档基线的关系

- **基线**:M2 PRD v0.2.0-M2(2026-07-13 同步至 v0.4.0)
- **本章增量**:v1.0.9-M2.2
- **下次整体同步**:M2.3 增量(预计移除 M2 调度时效分析中的签收相关字段)

---

*计划创建日期:2026-07-13*
*预计实施日期:同日完成*
