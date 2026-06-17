import type {
  Department,
  DepartmentTreeNode,
  MindMapNode,
  Position,
  Establishment,
  EstablishmentMatrixRow,
  EstablishmentHistory,
  DepartmentFormData,
  ApiResponse,
  ChangeRecord,
  ChangeRecordType,
  Rank,
  RankTrackType,
  RankLevelType,
} from '../types';
import {
  mockDepartments,
  mockPositions,
  mockEstablishments,
  mockEstablishmentHistories,
  mockRanks,
  buildDepartmentTree,
  buildMindMapData,
  calculateMindMapPositions,
  buildEstablishmentMatrix,
  getDepartmentAndDescendantIds,
  getEstablishmentOccupied,
  getDepartmentFullPath,
  getDepartmentIdByPath,
  getPositionName,
} from './mockData';
import { mockArchiveDetails } from '@/services/mockData';

// 重新导出工具函数
export {
  getDepartmentFullPath,
  getDepartmentName,
  getAllDepartments,
  getDepartmentPositionCount,
  getDepartmentAndDescendantIds,
  searchDepartments,
  calculatePositionCountsForTree,
  getDepartmentIdByPath,
  getPositionName,
} from './mockData';

//模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟数据副本（用于增删改操作）
let departments = [...mockDepartments];
let positions = [...mockPositions];
let establishments = [...mockEstablishments];
let establishmentHistories = [...mockEstablishmentHistories];

// ==================== 部门管理 API ====================

// 获取部门树（列表视图用）
export const getDepartmentTree = async (): Promise<ApiResponse<DepartmentTreeNode[]>> => {
  await delay(300);
  return {
    code: 0,
    data: buildDepartmentTree(departments),
  };
};

// 获取思维导图数据
export const getMindMapData = async (): Promise<ApiResponse<MindMapNode[]>> => {
  await delay(300);
  const data = buildMindMapData(departments);
  const positionedData = calculateMindMapPositions(data);
  return {
    code: 0,
    data: positionedData,
  };
};

// 新增部门
export const createDepartment = async (
  formData: DepartmentFormData
): Promise<ApiResponse<Department>> => {
  await delay(300);

  const parentId = formData.parentId;
  const parent = parentId ? departments.find((d) => d.id === parentId) : null;
  const level = parent ? parent.level + 1 : 0;

  // 生成编码
  const prefix = formData.name.substring(0, 2).toUpperCase();
  const code = prefix + Date.now().toString(36).toUpperCase();

  const newDepartment: Department = {
    id: `dept-${Date.now()}`,
    name: formData.name,
    code,
    parentId,
    level,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  departments.push(newDepartment);

  return {
    code: 0,
    data: newDepartment,
  };
};

// 编辑部门
export const updateDepartment = async (
  id: string,
  formData: DepartmentFormData
): Promise<ApiResponse<Department>> => {
  await delay(300);

  const index = departments.findIndex((d) => d.id === id);
  if (index === -1) {
    return {
      code: 40401,
      message: '部门不存在',
    };
  }

  departments[index] = {
    ...departments[index],
    name: formData.name,
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 0,
    data: departments[index],
  };
};

// 删除部门
export const deleteDepartment = async (id: string): Promise<ApiResponse<null>> => {
  await delay(300);

  const dept = departments.find((d) => d.id === id);
  if (!dept) {
    return {
      code: 40401,
      message: '部门不存在',
    };
  }

  // 根节点不允许删除
  if (dept.parentId === null) {
    return {
      code: 40001,
      message: '根节点不允许删除',
    };
  }

  // 检查是否有子部门
  const hasChildren = departments.some((d) => d.parentId === id);
  if (hasChildren) {
    return {
      code: 40002,
      message: '该部门下存在子部门，不允许删除',
    };
  }

  // 检查是否有职位
  const hasPositions = positions.some((p) => p.departmentId === id);
  if (hasPositions) {
    return {
      code: 40003,
      message: '该部门下存在职位，不允许删除',
    };
  }

  departments = departments.filter((d) => d.id !== id);

  return {
    code: 0,
    message: '删除成功',
  };
};

// 检查部门下是否有数据
export const checkDepartmentHasData = async (id: string): Promise<ApiResponse<{ hasChildren: boolean; hasPositions: boolean }>> => {
  await delay(100);

  const hasChildren = departments.some((d) => d.parentId === id);
  const hasPositions = positions.some((p) => p.departmentId === id);

  return {
    code: 0,
    data: { hasChildren, hasPositions },
  };
};

// 批量导入部门
export const importDepartments = async (
  data: { departmentName: string; parentDepartmentPath: string }[]
): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> => {
  await delay(300);

  const errors: { row: number; message: string }[] = [];
  let success = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // 跳过表头，行号从2开始

    try {
      // 查找上级部门
      let parentId: string | null = null;
      if (row.parentDepartmentPath) {
        const parentIdResult = getDepartmentIdByPath(row.parentDepartmentPath);
        if (!parentIdResult) {
          errors.push({ row: rowNum, message: `上级部门"${row.parentDepartmentPath}"不存在` });
          continue;
        }
        parentId = parentIdResult;
      }

      // 检查部门名称是否已存在
      const existingDept = departments.find(
        (d) => d.name === row.departmentName && d.parentId === parentId
      );
      if (existingDept) {
        errors.push({ row: rowNum, message: `部门"${row.departmentName}"已存在` });
        continue;
      }

      // 创建部门
      const parent = parentId ? departments.find((d) => d.id === parentId) : null;
      const level = parent ? parent.level + 1 : 0;
      const prefix = row.departmentName.substring(0, 2).toUpperCase();
      const code = prefix + Date.now().toString(36).toUpperCase() + i;

      const newDept: Department = {
        id: `dept-import-${Date.now()}-${i}`,
        name: row.departmentName,
        code,
        parentId,
        level,
        sort: 0,
        tenantId: 'tenant-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      departments.push(newDept);
      success++;
    } catch (error) {
      errors.push({ row: rowNum, message: '导入失败' });
    }
  }

  return { success, failed: data.length - success, errors };
};

// ==================== 职位管理 API ====================

//职位编码计数器
let positionCodeCounter = 100;

// 生成职位编码（POS-001格式）
const generatePositionCode = (): string => {
  positionCodeCounter += 1;
  return `POS-${positionCodeCounter.toString().padStart(3, '0')}`;
};

// 获取职位列表
export const getPositions = async (
  departmentId?: string
): Promise<ApiResponse<Position[]>> => {
  await delay(300);

  let filtered: Position[];
  if (departmentId) {
    filtered = positions.filter((p) => p.departmentId === departmentId);
  } else {
    // 返回数组副本，确保 React 能检测到状态变化
    filtered = [...positions];
  }

  return {
    code: 0,
    data: filtered,
  };
};

// 新增职位
export const createPosition = async (
  name: string,
  description?: string
): Promise<ApiResponse<Position>> => {
  await delay(300);

  const code = generatePositionCode();

  const newPosition: Position = {
    id: `pos-${Date.now()}`,
    name,
    code,
    description,
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  positions.push(newPosition);

  return {
    code: 0,
    data: newPosition,
  };
};

// 批量导入职位
export const importPositions = async (
  data: { positionName: string; description?: string }[]
): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> => {
  await delay(300);

  const errors: { row: number; message: string }[] = [];
  let success = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      // 检查职位名称是否已存在
      const existingPos = positions.find((p) => p.name === row.positionName);
      if (existingPos) {
        errors.push({ row: rowNum, message: `职位"${row.positionName}"已存在` });
        continue;
      }

      const code = generatePositionCode();
      const newPos: Position = {
        id: `pos-import-${Date.now()}-${i}`,
        name: row.positionName,
        code,
        description: row.description,
        tenantId: 'tenant-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      positions.push(newPos);
      success++;
    } catch (error) {
      errors.push({ row: rowNum, message: '导入失败' });
    }
  }

  return { success, failed: data.length - success, errors };
};

// 编辑职位
export const updatePosition = async (
  id: string,
  name: string,
  description?: string
): Promise<ApiResponse<Position>> => {
  await delay(300);

  const index = positions.findIndex((p) => p.id === id);
  if (index === -1) {
    return {
      code: 40401,
      message: '职位不存在',
    };
  }

  positions[index] = {
    ...positions[index],
    name,
    description,
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 0,
    data: positions[index],
  };
};

// 删除职位
export const deletePosition = async (id: string): Promise<ApiResponse<null>> => {
  await delay(300);

  // 检查是否是同步数据（原始mockPositions中的数据）
  const isSyncedData = mockPositions.some((p) => p.id === id);
  if (isSyncedData) {
    return {
      code: 40001,
      message: '该职位为同步数据，不允许删除',
    };
  }

  positions = positions.filter((p) => p.id !== id);

  return {
    code: 0,
    message: '删除成功',
  };
};

// ==================== 编制管理 API ====================

// 获取编制矩阵（可按部门筛选）
export const getEstablishmentMatrix = async (
  year: number,
  departmentId?: string
): Promise<ApiResponse<{ headers: string[]; rows: EstablishmentMatrixRow[] }>> => {
  await delay(300);

  // 过滤出已审批通过的编制
  // 一个编制只有在存在至少一条 approved 状态的历史记录时才显示
  const approvedEstablishmentIds = new Set(
    establishmentHistories
      .filter((h) => h.status === 'approved')
      .map((h) => h.establishmentId)
  );

  let filteredEstablishments = establishments.filter(
    (e) => approvedEstablishmentIds.has(e.id) && e.year === year
  );

  // 如果指定了部门ID，只显示该部门及其子部门的编制
  if (departmentId) {
    const deptIds = getDepartmentAndDescendantIds(departmentId);
    filteredEstablishments = filteredEstablishments.filter((e) => deptIds.includes(e.departmentId));
  }

  // 传入可变的数据副本，确保新增的职位/部门能被正确查找
  const data = buildEstablishmentMatrix(filteredEstablishments, year, positions, departments);

  return {
    code: 0,
    data,
  };
};

// 创建新编制
export const createEstablishment = async (
  departmentId: string,
  positionId: string,
  year: number,
  month: number,
  quota: number,
  reason?: 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other',
  remark?: string
): Promise<ApiResponse<EstablishmentHistory>> => {
  await delay(300);

  // 检查是否已存在
  const existing = establishments.find(
    (e) => e.departmentId === departmentId && e.positionId === positionId && e.year === year && e.month === month
  );
  if (existing) {
    return {
      code: 40001,
      message: '该部门/职位/时间已存在编制记录，请使用调整功能',
    };
  }

  // 创建新编制记录
  const newEstablishment = {
    id: `est-${Date.now()}`,
    departmentId,
    positionId,
    year,
    month,
    quota,
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  establishments.push(newEstablishment);

  // 创建历史记录
  const history: EstablishmentHistory = {
    id: `hist-${Date.now()}`,
    establishmentId: newEstablishment.id,
    oldQuota: 0,
    newQuota: quota,
    reason: reason || 'business_expansion',
    remark: remark || '新创建编制',
    applicantId: 'user-001',
    applicantName: '张三',
    status: 'pending',
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
  };

  establishmentHistories.push(history);

  return {
    code: 0,
    data: history,
  };
};

// 批量创建编制
export const batchCreateEstablishment = async (
  data: {
    departmentId: string;
    positionId: string;
    year: number;
    month: number;
    quota: number;
    reason?: 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other';
    remark?: string;
  }[]
): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> => {
  await delay(300);

  const errors: { row: number; message: string }[] = [];
  let success = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const rowNum = i + 2; // 跳过表头，行号从2开始

    try {
      // 检查是否已存在
      const existing = establishments.find(
        (e) =>
          e.departmentId === item.departmentId &&
          e.positionId === item.positionId &&
          e.year === item.year &&
          e.month === item.month
      );
      if (existing) {
        errors.push({ row: rowNum, message: `该部门/职位/时间已存在编制记录` });
        continue;
      }

      // 创建新编制记录
      const newEstablishment = {
        id: `est-${Date.now()}-${i}`,
        departmentId: item.departmentId,
        positionId: item.positionId,
        year: item.year,
        month: item.month,
        quota: item.quota,
        tenantId: 'tenant-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      establishments.push(newEstablishment);

      // 创建历史记录
      const history: EstablishmentHistory = {
        id: `hist-${Date.now()}-${i}`,
        establishmentId: newEstablishment.id,
        oldQuota: 0,
        newQuota: item.quota,
        reason: item.reason || 'business_expansion',
        remark: item.remark || '批量导入创建',
        applicantId: 'user-001',
        applicantName: '张三',
        status: 'pending',
        tenantId: 'tenant-001',
        createdAt: new Date().toISOString(),
      };
      establishmentHistories.push(history);
      success++;
    } catch (error) {
      errors.push({ row: rowNum, message: '创建失败' });
    }
  }

  return { success, failed: data.length - success, errors };
};

// 发起锁定申请
export const applyEstablishmentLock = async (
  establishmentId: string,
  lockReason: string,
  lockExpiredAt?: string
): Promise<ApiResponse<Establishment>> => {
  await delay(300);

  const establishment = establishments.find((e) => e.id === establishmentId);
  if (!establishment) {
    return {
      code: 40001,
      message: '编制记录不存在',
    };
  }

  // 更新锁定状态为锁定中
  establishment.lockStatus = 'locking';
  establishment.lockReason = lockReason;
  establishment.lockExpiredAt = lockExpiredAt;
  establishment.updatedAt = new Date().toISOString();

  // 创建锁定历史记录
  const history: EstablishmentHistory = {
    id: `hist-lock-${Date.now()}`,
    establishmentId: establishment.id,
    oldQuota: establishment.quota,
    newQuota: establishment.quota,
    reason: 'other',
    remark: `锁定申请：${lockReason}`,
    applicantId: 'user-001',
    applicantName: '张三',
    status: 'pending',
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
  };
  establishmentHistories.push(history);

  return {
    code: 0,
    data: establishment,
  };
};

// 发起解锁申请
export const applyEstablishmentUnlock = async (
  establishmentId: string,
  unlockReason: string,
  unlockExpiredAt?: string
): Promise<ApiResponse<Establishment>> => {
  await delay(300);

  const establishment = establishments.find((e) => e.id === establishmentId);
  if (!establishment) {
    return {
      code: 40001,
      message: '编制记录不存在',
    };
  }

  // 更新锁定状态（暂时解锁，仍保留锁定状态直到审批通过）
  establishment.unlockReason = unlockReason;
  establishment.unlockExpiredAt = unlockExpiredAt;
  establishment.updatedAt = new Date().toISOString();

  // 创建解锁历史记录
  const history: EstablishmentHistory = {
    id: `hist-unlock-${Date.now()}`,
    establishmentId: establishment.id,
    oldQuota: establishment.quota,
    newQuota: establishment.quota,
    reason: 'other',
    remark: `解锁申请：${unlockReason}`,
    applicantId: 'user-001',
    applicantName: '张三',
    status: 'pending',
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
  };
  establishmentHistories.push(history);

  return {
    code: 0,
    data: establishment,
  };
};

// 发起编制调整申请
export const applyEstablishmentChange = async (
  establishmentId: string,
  newQuota: number,
  reason: 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other',
  remark?: string
): Promise<ApiResponse<EstablishmentHistory>> => {
  await delay(300);

  // 如果没有 establishmentId，说明是创建模式（但实际上矩阵中的空单元格应该已经通过 createEstablishment 处理）
  if (!establishmentId) {
    return {
      code: 40001,
      message: '编制记录不存在，请使用新增编制功能',
    };
  }

  const est = establishments.find((e) => e.id === establishmentId);
  if (!est) {
    return {
      code: 40401,
      message: '编制记录不存在',
    };
  }

  const history: EstablishmentHistory = {
    id: `hist-${Date.now()}`,
    establishmentId,
    oldQuota: est.quota,
    newQuota,
    reason,
    remark,
    applicantId: 'user-001',
    applicantName: '张三',
    status: 'pending',
    tenantId: 'tenant-001',
    createdAt: new Date().toISOString(),
  };

  establishmentHistories.push(history);

  return {
    code: 0,
    data: history,
  };
};

// 获取调整历史
export const getEstablishmentHistory = async (
  establishmentId: string
): Promise<ApiResponse<EstablishmentHistory[]>> => {
  await delay(300);

  const histories = establishmentHistories.filter(
    (h) => h.establishmentId === establishmentId
  );

  return {
    code: 0,
    data: histories,
  };
};

// 获取所有待审批的编制调整记录
export const getPendingEstablishmentHistories = async (): Promise<ApiResponse<EstablishmentHistory[]>> => {
  await delay(200);

  const pending = establishmentHistories.filter((h) => h.status === 'pending');

  return {
    code: 0,
    data: pending,
  };
};

// 获取编制详情（用于审批详情展示）
export const getEstablishmentDetails = async (
  establishmentId: string
): Promise<ApiResponse<{ departmentId: string; positionId: string; departmentName: string; positionName: string; year: number; month: number }>> => {
  await delay(100);

  const est = establishments.find((e) => e.id === establishmentId);
  if (!est) {
    return {
      code: 40401,
      message: '编制记录不存在',
    };
  }

  return {
    code: 0,
    data: {
      departmentId: est.departmentId,
      positionId: est.positionId,
      departmentName: getDepartmentFullPath(est.departmentId),
      positionName: getPositionName(est.positionId),
      year: est.year,
      month: est.month,
    },
  };
};

// 审批编制调整
export const approveEstablishmentChange = async (
  historyId: string
): Promise<ApiResponse<EstablishmentHistory>> => {
  await delay(300);

  const index = establishmentHistories.findIndex((h) => h.id === historyId);
  if (index === -1) {
    return {
      code: 40401,
      message: '调整记录不存在',
    };
  }

  const history = establishmentHistories[index];

  // 更新状态
  establishmentHistories[index] = {
    ...history,
    status: 'approved',
    approverId: 'user-002',
    approverName: '李四',
    approvedAt: new Date().toISOString(),
  };

  // 更新编制名额
  const estIndex = establishments.findIndex((e) => e.id === history.establishmentId);
  if (estIndex !== -1) {
    establishments[estIndex] = {
      ...establishments[estIndex],
      quota: history.newQuota,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    code: 0,
    data: establishmentHistories[index],
  };
};

// 驳回编制调整
export const rejectEstablishmentChange = async (
  historyId: string
): Promise<ApiResponse<EstablishmentHistory>> => {
  await delay(300);

  const index = establishmentHistories.findIndex((h) => h.id === historyId);
  if (index === -1) {
    return {
      code: 40401,
      message: '调整记录不存在',
    };
  }

  establishmentHistories[index] = {
    ...establishmentHistories[index],
    status: 'rejected',
    approverId: 'user-002',
    approverName: '李四',
    approvedAt: new Date().toISOString(),
  };

  return {
    code: 0,
    data: establishmentHistories[index],
  };
};

// 获取各部门待审批数量
export const getPendingApprovalCounts = async (): Promise<ApiResponse<Record<string, number>>> => {
  await delay(100);

  // 统计 pending 状态的记录，按部门分组
  // 注意：每个待审批记录仅计入其直接所属部门，不累加到祖先部门
  const counts: Record<string, number> = {};

  establishmentHistories
    .filter((h) => h.status === 'pending')
    .forEach((h) => {
      // 找到对应的 establishment 记录获取 departmentId
      const est = establishments.find((e) => e.id === h.establishmentId);
      if (est) {
        // 仅计入直接所属部门，不累加到祖先部门
        counts[est.departmentId] = (counts[est.departmentId] || 0) + 1;
      }
    });

  return {
    code: 0,
    data: counts,
  };
};

// ==================== 部门档案 API ====================

// 获取部门变动记录（入职、转正、调岗、晋升、降职、离职）
export const getDepartmentChangeRecords = async (
  departmentIds: string[]
): Promise<ApiResponse<ChangeRecord[]>> => {
  await delay(300);

  const records: ChangeRecord[] = [];

  // 遍历所有档案详情，提取变动记录
  Object.values(mockArchiveDetails).forEach((detail) => {
    const emp = detail.employee;

    // 检查员工是否属于目标部门
    if (!departmentIds.includes(emp.departmentId)) return;

    // 入职记录
    records.push({
      id: `entry-${emp.id}`,
      changeType: '入职',
      employeeId: emp.id,
      employeeName: emp.name,
      employeeNo: emp.employeeNo,
      changeDate: emp.entryDate,
      changeBefore: {},
      changeAfter: {
        departmentName: emp.departmentName,
        positionName: emp.positionName,
        rankLevel: emp.rankLevel,
      },
      reason: '新员工入职',
    });

    // 转正记录
    if (detail.probation && detail.probation.status === 'passed') {
      records.push({
        id: `probation-${emp.id}`,
        changeType: '转正',
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNo: emp.employeeNo,
        changeDate: detail.probation.probationEndDate,
        changeBefore: {
          departmentName: emp.departmentName,
          positionName: emp.positionName,
          rankLevel: '试用期',
        },
        changeAfter: {
          departmentName: emp.departmentName,
          positionName: emp.positionName,
          rankLevel: emp.rankLevel,
        },
        reason: '试用期考核通过',
      });
    }

    // 调岗/晋升/降职记录
    detail.transfers.forEach((transfer) => {
      let changeType: ChangeRecordType = '调岗';
      if (transfer.transferType === '晋升') changeType = '晋升';
      else if (transfer.transferType === '降职') changeType = '降职';

      records.push({
        id: transfer.id,
        changeType,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNo: emp.employeeNo,
        changeDate: transfer.transferDate,
        changeBefore: {
          departmentName: transfer.fromDepartmentName,
          positionName: transfer.fromPositionName,
          rankLevel: transfer.fromRankLevel,
        },
        changeAfter: {
          departmentName: transfer.toDepartmentName,
          positionName: transfer.toPositionName,
          rankLevel: transfer.toRankLevel,
        },
        reason: transfer.reason,
      });
    });

    // 离职记录
    detail.resignations.forEach((resignation) => {
      records.push({
        id: resignation.id,
        changeType: '离职',
        employeeId: emp.id,
        employeeName: emp.name,
        employeeNo: emp.employeeNo,
        changeDate: resignation.resignationDate,
        changeBefore: {
          departmentName: emp.departmentName,
          positionName: emp.positionName,
        },
        changeAfter: {},
        reason: resignation.reason,
      });
    });
  });

  // 按日期倒序排列
  records.sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());

  return {
    code: 0,
    data: records,
  };
};

// 获取部门编制变更历史
export const getDepartmentEstablishmentHistories = async (
  departmentIds: string[]
): Promise<ApiResponse<EstablishmentHistory[]>> => {
  await delay(300);

  // 获取这些部门的编制记录
  const deptEstablishments = establishments.filter((e) => departmentIds.includes(e.departmentId));
  const establishmentIds = deptEstablishments.map((e) => e.id);

  // 获取这些编制的历史记录
  const histories = establishmentHistories.filter((h) => establishmentIds.includes(h.establishmentId));

  // 按日期倒序排列
  histories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    code: 0,
    data: histories,
  };
};

// 获取部门编制汇总（该部门及子部门的所有编制统计）
export const getDepartmentEstablishmentSummary = async (
  departmentIds: string[]
): Promise<ApiResponse<{ totalQuota: number; totalOccupied: number; totalRemaining: number }>> => {
  await delay(100);

  // 获取当前月份的数据
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 筛选这些部门的编制记录（当前月份）
  const deptEstablishments = establishments.filter(
    (e) => departmentIds.includes(e.departmentId) && e.year === currentYear && e.month === currentMonth
  );

  let totalQuota = 0;
  let totalOccupied = 0;

  deptEstablishments.forEach((est) => {
    totalQuota += est.quota;
    totalOccupied += getEstablishmentOccupied(est.id);
  });

  return {
    code: 0,
    data: {
      totalQuota,
      totalOccupied,
      totalRemaining: totalQuota - totalOccupied,
    },
  };
};

// ==================== 职级管理 API ====================

// 职级列表（支持按序列和职层筛选）
export const getRanks = async (
  trackFilter?: RankTrackType | 'all',
  levelFilter?: RankLevelType | 'all',
  searchKeyword?: string
): Promise<ApiResponse<Rank[]>> => {
  await delay(100);

  let filtered = [...mockRanks];

  // 关键字搜索（职级代码或职务名称模糊匹配）
  if (searchKeyword && searchKeyword.trim()) {
    const keyword = searchKeyword.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.code.toLowerCase().includes(keyword) ||
        r.name.toLowerCase().includes(keyword)
    );
  }

  if (trackFilter && trackFilter !== 'all') {
    filtered = filtered.filter((r) => r.track === trackFilter);
  }

  if (levelFilter && levelFilter !== 'all') {
    filtered = filtered.filter((r) => r.level === levelFilter);
  }

  // 按序列和职级排序
  filtered.sort((a, b) => {
    // 先按序列排序
    const trackOrder = { admin: 0, tech: 1, factory: 2 };
    const trackDiff = trackOrder[a.track] - trackOrder[b.track];
    if (trackDiff !== 0) return trackDiff;

    // 同序列内按职层排序（高层在前）
    const levelOrder = { high: 0, middle: 1, low: 2 };
    const levelDiff = levelOrder[a.level] - levelOrder[b.level];
    if (levelDiff !== 0) return levelDiff;

    // 同职层内按职级代码数字降序排列
    const numA = parseInt(a.code.slice(1), 10) || 0;
    const numB = parseInt(b.code.slice(1), 10) || 0;
    return numB - numA;
  });

  return { code: 0, data: filtered };
};

// 获取单个职级
export const getRank = async (id: string): Promise<ApiResponse<Rank | null>> => {
  await delay(50);
  const rank = mockRanks.find((r) => r.id === id);
  return { code: 0, data: rank || null };
};

// 创建职级
export const createRank = async (
  data: Omit<Rank, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Rank>> => {
  await delay(100);

  // 检查职级代码是否已存在
  if (mockRanks.some((r) => r.code === data.code)) {
    return { code: 1, message: '职级代码已存在' };
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const newRank: Rank = {
    ...data,
    id: `rank-${Date.now()}`,
    tenantId: 'tenant-001',
    createdAt: now,
    updatedAt: now,
  };

  mockRanks.push(newRank);
  return { code: 0, data: newRank };
};

// 更新职级
export const updateRank = async (
  id: string,
  data: Partial<Omit<Rank, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<Rank>> => {
  await delay(100);

  const index = mockRanks.findIndex((r) => r.id === id);
  if (index === -1) {
    return { code: 1, message: '职级不存在' };
  }

  // 如果更新代码，检查是否与其他职级冲突
  if (data.code && data.code !== mockRanks[index].code) {
    if (mockRanks.some((r) => r.code === data.code && r.id !== id)) {
      return { code: 1, message: '职级代码已存在' };
    }
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  mockRanks[index] = {
    ...mockRanks[index],
    ...data,
    updatedAt: now,
  };

  return { code: 0, data: mockRanks[index] };
};

// 删除职级
export const deleteRank = async (id: string): Promise<ApiResponse<void>> => {
  await delay(100);

  const index = mockRanks.findIndex((r) => r.id === id);
  if (index === -1) {
    return { code: 1, message: '职级不存在' };
  }

  mockRanks.splice(index, 1);
  return { code: 0 };
};

// 获取所有序列选项
export const getRankTrackOptions = async (): Promise<ApiResponse<{ value: RankTrackType | 'all'; label: string }[]>> => {
  return {
    code: 0,
    data: [
      { value: 'all', label: '全部序列' },
      { value: 'admin', label: '职能部门' },
      { value: 'tech', label: '技术部门' },
      { value: 'factory', label: '工厂' },
    ],
  };
};

// 获取所有职层选项
export const getRankLevelOptions = async (): Promise<ApiResponse<{ value: RankLevelType | 'all'; label: string }[]>> => {
  return {
    code: 0,
    data: [
      { value: 'all', label: '全部职层' },
      { value: 'high', label: '高层' },
      { value: 'middle', label: '中层' },
      { value: 'low', label: '基层' },
    ],
  };
};

// ==================== 审批记录 API ====================

import type { ApprovalRecord } from '../types';

// 模拟审批记录数据
const mockApprovalRecords: ApprovalRecord[] = [
  {
    id: 'ar-001',
    establishmentId: 'est-dept-qdz-pos-001-2026-7',
    applicantId: 'user-001',
    applicantName: '张三',
    departmentName: '华翔科技/研发部/前端组',
    positionName: '前端开发工程师',
    oldQuota: 10,
    newQuota: 15,
    changeReason: 'business_expansion',
    remark: 'Q3业务扩张，新增招聘',
    status: 'approved',
    approverName: '李四',
    approvedAt: '2026-06-01 10:00:00',
    tenantId: 'tenant-001',
    createdAt: '2026-05-25 09:00:00',
    updatedAt: '2026-06-01 10:00:00',
  },
  {
    id: 'ar-002',
    establishmentId: 'est-dept-bdz-pos-002-2026-7',
    applicantId: 'user-001',
    applicantName: '张三',
    departmentName: '华翔科技/研发部/后端组',
    positionName: '后端开发工程师',
    oldQuota: 8,
    newQuota: 12,
    changeReason: 'business_expansion',
    remark: '后端团队扩编',
    status: 'approved',
    approverName: '李四',
    approvedAt: '2026-06-05 11:00:00',
    tenantId: 'tenant-001',
    createdAt: '2026-06-01 09:00:00',
    updatedAt: '2026-06-05 11:00:00',
  },
  {
    id: 'ar-003',
    establishmentId: 'est-dept-xsb-pos-004-2026-8',
    applicantId: 'user-004',
    applicantName: '赵六',
    departmentName: '华翔科技/销售部',
    positionName: '销售经理',
    oldQuota: 8,
    newQuota: 15,
    changeReason: 'business_expansion',
    remark: '销售大幅扩张',
    status: 'rejected',
    approverName: '李四',
    approvedAt: '2026-06-12 15:00:00',
    rejectReason: '预算不足，暂不扩编',
    tenantId: 'tenant-001',
    createdAt: '2026-06-10 09:00:00',
    updatedAt: '2026-06-12 15:00:00',
  },
  {
    id: 'ar-004',
    establishmentId: 'est-dept-scb-pos-005-2026-8',
    applicantId: 'user-005',
    applicantName: '孙七',
    departmentName: '华翔制造/生产部',
    positionName: '生产主管',
    oldQuota: 25,
    newQuota: 30,
    changeReason: 'business_expansion',
    remark: '市场预算增加',
    status: 'pending',
    tenantId: 'tenant-001',
    createdAt: '2026-06-13 09:00:00',
    updatedAt: '2026-06-13 09:00:00',
  },
];

// 获取审批记录列表
export const getApprovalRecords = async (): Promise<ApiResponse<ApprovalRecord[]>> => {
  await delay(100);
  return { code: 0, data: mockApprovalRecords };
};