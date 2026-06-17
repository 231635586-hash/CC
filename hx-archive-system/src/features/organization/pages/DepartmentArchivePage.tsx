import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw, Users, Briefcase, Building2, ClipboardList, CheckCircle, Clock, XCircle, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { DepartmentTree, EstablishmentHistoryModal } from '../components';
import {
  getDepartmentTree,
  getDepartmentAndDescendantIds,
  getDepartmentFullPath,
  getDepartmentPositionCount,
  getDepartmentChangeRecords,
  getDepartmentEstablishmentHistories,
  getDepartmentEstablishmentSummary,
} from '../services/api';
import { fetchArchiveList } from '@/services/api';
import type {
  DepartmentTreeNode,
  EmployeeRosterItem,
  EmployeeRosterStatus,
  ChangeRecord,
  ChangeRecordType,
  EstablishmentHistory,
} from '../types';

// 根据搜索关键词获取所有匹配的节点ID及其祖先节点ID
const getHighlightedNodeIds = (
  nodes: DepartmentTreeNode[],
  keyword: string,
  ancestorIds: Set<string> = new Set()
): Set<string> => {
  if (!keyword.trim()) return new Set();

  const lowerKeyword = keyword.toLowerCase();
  const highlightedIds = new Set<string>();
  const ancestorSet = new Set(ancestorIds);

  const traverse = (nodes: DepartmentTreeNode[]) => {
    nodes.forEach((node) => {
      const isMatch = node.name.toLowerCase().includes(lowerKeyword);
      if (isMatch) {
        highlightedIds.add(node.id);
        // 标记所有祖先节点
        let current = node;
        while (current.parentId) {
          ancestorSet.add(current.parentId);
          // 找到父节点
          const findParent = (list: DepartmentTreeNode[]): DepartmentTreeNode | null => {
            for (const n of list) {
              if (n.id === current.parentId) return n;
              if (n.children) {
                const found = findParent(n.children);
                if (found) return found;
              }
            }
            return null;
          };
          const parent = findParent(nodes);
          if (parent) {
            current = parent;
          } else {
            break;
          }
        }
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  // 合并祖先节点ID
  ancestorSet.forEach((id) => highlightedIds.add(id));
  return highlightedIds;
};

const PAGE_SIZE = 10;

export const DepartmentArchivePage = () => {
  const navigate = useNavigate();
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>();
  const [autoExpandAll] = useState(true);

  // 部门树搜索
  const [treeSearchKeyword, setTreeSearchKeyword] = useState('');

  // 根据搜索关键词计算需要高亮的节点ID
  const highlightNodeIds = useMemo(() => {
    return getHighlightedNodeIds(departmentTree, treeSearchKeyword);
  }, [departmentTree, treeSearchKeyword]);

  // Tab状态
  const [activeTab, setActiveTab] = useState<'info' | 'roster' | 'changes' | 'history'>('info');

  // 花名册状态
  const [rosterStatus, setRosterStatus] = useState<EmployeeRosterStatus>('all');
  const [rosterSearchText, setRosterSearchText] = useState('');
  const [rosterList, setRosterList] = useState<EmployeeRosterItem[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterTotal, setRosterTotal] = useState(0);
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);

  // 变动记录状态
  const [changeTypeFilter, setChangeTypeFilter] = useState<ChangeRecordType | 'all'>('all');
  const [changeRecords, setChangeRecords] = useState<ChangeRecord[]>([]);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changePage, setChangePage] = useState(1);
  const CHANGE_PAGE_SIZE = 10;

  // 变更记录状态
  const [establishmentHistories, setEstablishmentHistories] = useState<EstablishmentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 编制汇总状态
  const [establishmentSummary, setEstablishmentSummary] = useState({
    totalQuota: 0,
    totalOccupied: 0,
    totalRemaining: 0,
  });

  // 变更记录弹窗状态
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalData, setHistoryModalData] = useState<{
    establishmentId: string;
    departmentName: string;
    positionName: string;
  } | null>(null);

  // 加载部门树
  useEffect(() => {
    const loadTree = async () => {
      const res = await getDepartmentTree();
      if (res.code === 0 && res.data && res.data.length > 0) {
        setDepartmentTree(res.data);
        setSelectedDepartmentId(res.data[0].id);
      }
    };
    loadTree();
  }, []);

  // 获取选中部门的完整路径
  const hierarchyPath = useMemo(() => {
    if (!selectedDepartmentId) return '';
    return getDepartmentFullPath(selectedDepartmentId);
  }, [selectedDepartmentId]);

  // 获取选中部门的所有子部门ID
  const allDepartmentIds = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return getDepartmentAndDescendantIds(selectedDepartmentId);
  }, [selectedDepartmentId]);

  // 加载花名册数据
  const loadRosterData = useCallback(async () => {
    if (!selectedDepartmentId) return;
    setRosterLoading(true);

    try {
      let status = rosterStatus === 'all' ? undefined : rosterStatus;
      if (rosterStatus === 'probation') {
        status = 'active';
      }

      const res = await fetchArchiveList({
        departmentId: selectedDepartmentId,
        status,
        searchText: rosterSearchText.trim() || undefined,
        page: rosterPage,
        pageSize: PAGE_SIZE,
      });

      if (res.list) {
        setRosterList(
          res.list.map((e) => ({
            id: e.id,
            employeeNo: e.employeeNo,
            name: e.name,
            positionName: e.positionName,
            entryDate: e.entryDate,
            status: e.status,
            phone: e.phone,
            departmentName: e.departmentName,
          }))
        );
        setRosterTotal(res.total);
      }
    } catch (error) {
      console.error('加载花名册失败', error);
    } finally {
      setRosterLoading(false);
    }
  }, [selectedDepartmentId, allDepartmentIds, rosterStatus, rosterSearchText, rosterPage]);

  // 加载总员工数（用于组织信息Tab）
  const loadTotalEmployeeCount = useCallback(async () => {
    if (!allDepartmentIds.length) return;
    try {
      const res = await fetchArchiveList({
        departmentId: selectedDepartmentId,
        page: 1,
        pageSize: 1,
      });
      setTotalEmployeeCount(res.total);
    } catch (error) {
      console.error('加载员工总数失败', error);
    }
  }, [allDepartmentIds]);

  // 加载变动记录
  const loadChangeRecords = useCallback(async () => {
    if (!allDepartmentIds.length) return;
    setChangeLoading(true);
    try {
      const res = await getDepartmentChangeRecords(allDepartmentIds);
      if (res.code === 0 && res.data) {
        setChangeRecords(res.data);
      }
    } catch (error) {
      console.error('加载变动记录失败', error);
    } finally {
      setChangeLoading(false);
    }
  }, [allDepartmentIds]);

  // 加载编制变更记录
  const loadEstablishmentHistories = useCallback(async () => {
    if (!allDepartmentIds.length) return;
    setHistoryLoading(true);
    try {
      const res = await getDepartmentEstablishmentHistories(allDepartmentIds);
      if (res.code === 0 && res.data) {
        setEstablishmentHistories(res.data);
      }
    } catch (error) {
      console.error('加载变更记录失败', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [allDepartmentIds]);

  // 加载编制汇总
  const loadEstablishmentSummary = useCallback(async () => {
    if (!allDepartmentIds.length) return;
    try {
      const res = await getDepartmentEstablishmentSummary(allDepartmentIds);
      if (res.code === 0 && res.data) {
        setEstablishmentSummary(res.data);
      }
    } catch (error) {
      console.error('加载编制汇总失败', error);
    }
  }, [allDepartmentIds]);

  // 部门变化时加载数据
  useEffect(() => {
    if (selectedDepartmentId) {
      loadTotalEmployeeCount();
      loadEstablishmentSummary();
      if (activeTab === 'roster') {
        loadRosterData();
      } else if (activeTab === 'changes') {
        loadChangeRecords();
      } else if (activeTab === 'history') {
        loadEstablishmentHistories();
      }
    }
  }, [selectedDepartmentId]);

  // Tab切换时加载数据
  useEffect(() => {
    if (activeTab === 'roster' && selectedDepartmentId) {
      loadRosterData();
    } else if (activeTab === 'changes' && selectedDepartmentId) {
      loadChangeRecords();
    } else if (activeTab === 'history' && selectedDepartmentId) {
      loadEstablishmentHistories();
    }
  }, [activeTab, selectedDepartmentId]);

  // 搜索条件变化时重新加载
  useEffect(() => {
    if (activeTab === 'roster' && selectedDepartmentId) {
      loadRosterData();
    }
  }, [rosterSearchText, activeTab, selectedDepartmentId]);

  // 获取选中部门信息
  const selectedDepartment = useMemo(() => {
    if (!departmentTree.length || !selectedDepartmentId) return null;

    const findNode = (nodes: DepartmentTreeNode[], id: string): DepartmentTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(departmentTree, selectedDepartmentId);
  }, [departmentTree, selectedDepartmentId]);

  // 根据 ID 查找部门节点（用于查找父部门）
  const findDepartmentById = useCallback((id: string): DepartmentTreeNode | null => {
    if (!id) return null;
    const findNode = (nodes: DepartmentTreeNode[]): DepartmentTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(departmentTree);
  }, [departmentTree]);

  // 点击变更记录查看详情
  const handleViewHistoryDetail = useCallback((history: EstablishmentHistory) => {
    setHistoryModalData({
      establishmentId: history.establishmentId,
      departmentName: selectedDepartment?.name || '',
      positionName: '',
    });
    setHistoryModalVisible(true);
  }, [selectedDepartment]);

  // 获取父部门名称
  const parentDepartmentName = useMemo(() => {
    if (!selectedDepartment?.parentId) return null;
    const parent = findDepartmentById(selectedDepartment.parentId);
    return parent?.name || null;
  }, [selectedDepartment?.parentId, findDepartmentById]);

  // 计算子部门数量
  const childDepartmentCount = useMemo(() => {
    if (!selectedDepartment?.children?.length) return 0;
    const countChildren = (nodes: DepartmentTreeNode[]): number => {
      let count = nodes.length;
      nodes.forEach((n) => {
        if (n.children) count += countChildren(n.children);
      });
      return count;
    };
    return countChildren(selectedDepartment.children);
  }, [selectedDepartment]);

  // 获取职位数量
  const positionCount = useMemo(() => {
    if (!selectedDepartmentId) return 0;
    return getDepartmentPositionCount(selectedDepartmentId);
  }, [selectedDepartmentId]);

  // 过滤后的变动记录
  const filteredChangeRecords = useMemo(() => {
    if (changeTypeFilter === 'all') return changeRecords;
    return changeRecords.filter((r) => r.changeType === changeTypeFilter);
  }, [changeRecords, changeTypeFilter]);

  // 分页后的变动记录
  const paginatedChangeRecords = useMemo(() => {
    const start = (changePage - 1) * CHANGE_PAGE_SIZE;
    return filteredChangeRecords.slice(start, start + CHANGE_PAGE_SIZE);
  }, [filteredChangeRecords, changePage]);

  // 变动记录总数变化时重置页码
  useEffect(() => {
    if (changePage > Math.ceil(filteredChangeRecords.length / CHANGE_PAGE_SIZE)) {
      setChangePage(1);
    }
  }, [filteredChangeRecords.length, changePage]);

  // 花名册状态筛选
  const rosterStatusOptions: { key: EmployeeRosterStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '在职' },
    { key: 'probation', label: '试用期' },
    { key: 'archived', label: '已离职' },
  ];

  // 变动记录类型
  const changeTypeOptions: { key: ChangeRecordType | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: '入职', label: '入职' },
    { key: '转正', label: '转正' },
    { key: '调岗', label: '调岗' },
    { key: '晋升', label: '晋升' },
    { key: '降职', label: '降职' },
    { key: '离职', label: '离职' },
  ];

  // Tab配置
  const tabs = [
    { key: 'info', label: '组织信息' },
    { key: 'roster', label: '花名册' },
    { key: 'changes', label: '变动记录' },
    { key: 'history', label: '变更记录' },
  ];

  // 跳转到人员详情
  const handleRowClick = (id: string) => {
    navigate(`/archive/${id}`);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadTotalEmployeeCount();
    loadEstablishmentSummary();
    if (activeTab === 'roster') {
      loadRosterData();
    } else if (activeTab === 'changes') {
      loadChangeRecords();
    } else if (activeTab === 'history') {
      loadEstablishmentHistories();
    }
  };

  // 花名册搜索
  const handleRosterSearch = (value: string) => {
    setRosterSearchText(value);
    setRosterPage(1);
  };

  // 导出花名册
  const handleExportRoster = () => {
    if (rosterList.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    // 构建CSV内容
    const headers = ['姓名', '工号', '职位', '入职日期', '状态', '联系方式', '部门'];
    const rows = rosterList.map((emp) => [
      emp.name,
      emp.employeeNo,
      emp.positionName,
      emp.entryDate,
      emp.status === 'active' ? '在职' : '已离职',
      emp.phone,
      emp.departmentName,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // 创建下载
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `花名册_${selectedDepartment?.name || '全部'}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 上级部门点击跳转
  const handleParentClick = () => {
    if (selectedDepartment?.parentId) {
      setSelectedDepartmentId(selectedDepartment.parentId);
      // 重置Tab到组织信息，避免数据不匹配
      setActiveTab('info');
    }
  };

  // 渲染状态图标
  const renderStatusIcon = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  // 渲染变动类型标签
  const renderChangeTypeBadge = (type: ChangeRecordType) => {
    const colors: Record<ChangeRecordType, string> = {
      '入职': 'bg-green-100 text-green-700',
      '转正': 'bg-blue-100 text-blue-700',
      '调岗': 'bg-orange-100 text-orange-700',
      '晋升': 'bg-purple-100 text-purple-700',
      '降职': 'bg-red-100 text-red-700',
      '离职': 'bg-gray-100 text-gray-700',
    };
    return (
      <Badge variant="neutral" className={colors[type]}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">部门档案</h1>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button variant="secondary" onClick={handleExportRoster}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧部门树 */}
        <div className="w-[280px] border-r border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden flex flex-col">
          {/* 搜索框 */}
          <div className="px-3 py-2 border-b border-[var(--color-border)]">
            <Input
              placeholder="搜索部门..."
              prefixIcon={<SearchIcon className="w-4 h-4" />}
              value={treeSearchKeyword}
              onChange={(e) => setTreeSearchKeyword(e.target.value)}
              className="!h-8 text-sm"
            />
          </div>
          <div className="flex-1 overflow-auto">
            <DepartmentTree
              data={departmentTree}
              selectedId={selectedDepartmentId}
              showActions={false}
              showPositionCount={false}
              autoExpandAll={autoExpandAll}
              searchKeyword={treeSearchKeyword}
              highlightNodeIds={highlightNodeIds}
              onSelect={(node) => setSelectedDepartmentId(node.id)}
            />
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab头部 */}
          <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-bg)]">
            <div className="flex gap-2 p-1 bg-[var(--color-surface-card)] rounded-lg w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                    activeTab === tab.key
                      ? 'bg-[var(--color-brand)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-[var(--color-brand)] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab内容 - 固定高度防止页面抖动 */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="h-full flex flex-col">
            {/* 组织信息 Tab */}
            {activeTab === 'info' && selectedDepartment && (
              <Card>
                <CardBody className="p-6">
                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">基本信息</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <span className="w-24 text-sm text-[var(--color-text-secondary)]">部门名称</span>
                          <span className="text-sm text-[var(--color-text-primary)] font-medium">
                            {selectedDepartment.name}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 text-sm text-[var(--color-text-secondary)]">部门编码</span>
                          <span className="text-sm text-[var(--color-text-primary)]">{selectedDepartment.code}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 text-sm text-[var(--color-text-secondary)]">上级部门</span>
                          <span
                            className="text-sm text-[var(--color-brand)] cursor-pointer hover:underline"
                            onClick={handleParentClick}
                          >
                            {parentDepartmentName || '无'}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-24 text-sm text-[var(--color-text-secondary)]">层级路径</span>
                          <span className="text-sm text-[var(--color-text-primary)]">{hierarchyPath}</span>
                        </div>
                      </div>
                    </div>

                    {/* 统计卡片 */}
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">数据汇总</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg border border-[var(--color-border)]">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">子部门</span>
                          </div>
                          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                            {childDepartmentCount}
                          </div>
                        </div>
                        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg border border-[var(--color-border)]">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">职位数量</span>
                          </div>
                          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">{positionCount}</div>
                        </div>
                        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg border border-[var(--color-border)]">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">在职员工</span>
                          </div>
                          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                            {totalEmployeeCount}
                          </div>
                        </div>
                        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg border border-[var(--color-border)]">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">编制汇总</span>
                          </div>
                          <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                            {establishmentSummary.totalRemaining}
                            <span className="text-sm font-normal text-[var(--color-text-secondary)]"> / {establishmentSummary.totalQuota}</span>
                          </div>
                          <div className="text-xs text-[var(--color-text-disabled)] mt-1">
                            在职 {establishmentSummary.totalOccupied} / 剩余 {establishmentSummary.totalRemaining}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 时间信息 */}
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">时间信息</h3>
                      <div className="flex items-start">
                        <span className="w-24 text-sm text-[var(--color-text-secondary)]">创建时间</span>
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {selectedDepartment.createdAt
                            ? new Date(selectedDepartment.createdAt).toLocaleDateString('zh-CN')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* 花名册 Tab */}
            {activeTab === 'roster' && (
              <div className="space-y-4">
                {/* 筛选栏 */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-2">
                    {rosterStatusOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setRosterStatus(opt.key);
                          setRosterPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          rosterStatus === opt.key
                            ? 'bg-[var(--color-brand)] text-white'
                            : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <Input
                      placeholder="搜索姓名/工号/手机号"
                      prefixIcon={<SearchIcon className="w-4 h-4" />}
                      value={rosterSearchText}
                      onChange={(e) => handleRosterSearch(e.target.value)}
                      className="w-[200px]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)] shrink-0">共 {rosterTotal} 人</span>
                  </div>
                </div>

                {/* 表格 */}
                <Card>
                  <CardBody className="p-0">
                    {rosterLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--color-text-secondary)]">加载中...</div>
                      </div>
                    ) : rosterList.length === 0 ? (
                      <Empty title="暂无花名册数据" description="该部门暂无在职员工" />
                    ) : (
                      <div className="overflow-auto">
                        <table className="w-full">
                          <thead className="bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                姓名
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                工号
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                职位
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                入职日期
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                状态
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                                联系方式
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rosterList.map((emp) => (
                              <tr
                                key={emp.id}
                                onClick={() => handleRowClick(emp.id)}
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-bg)] cursor-pointer"
                              >
                                <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">{emp.name}</td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{emp.employeeNo}</td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                  {emp.positionName}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                  {emp.entryDate}
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge status={emp.status} />
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{emp.phone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* 分页 */}
                {rosterTotal > 0 && (
                  <div className="flex justify-end">
                    <Pagination
                      current={rosterPage}
                      pageSize={PAGE_SIZE}
                      total={rosterTotal}
                      onChange={setRosterPage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 变动记录 Tab */}
            {activeTab === 'changes' && (
              <div className="space-y-4">
                {/* 筛选栏 */}
                <div className="flex items-center gap-2">
                  {changeTypeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setChangeTypeFilter(opt.key)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        changeTypeFilter === opt.key
                          ? 'bg-[var(--color-brand)] text-white'
                          : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* 变动记录列表 */}
                <Card>
                  <CardBody className="p-0">
                    {changeLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--color-text-secondary)]">加载中...</div>
                      </div>
                    ) : paginatedChangeRecords.length === 0 ? (
                      <Empty title="暂无变动记录" description="该部门暂无人员变动记录" />
                    ) : (
                      <div className="divide-y divide-[var(--color-border)]">
                        {paginatedChangeRecords.map((record) => (
                          <div key={record.id} className="px-4 py-4 hover:bg-[var(--color-surface-bg)]">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {renderChangeTypeBadge(record.changeType)}
                                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                    {record.employeeName}
                                  </span>
                                  <span className="text-sm text-[var(--color-text-secondary)]">
                                    {record.employeeNo}
                                  </span>
                                  <span className="text-sm text-[var(--color-text-disabled)]">
                                    {record.changeDate}
                                  </span>
                                </div>
                                <div className="text-sm text-[var(--color-text-secondary)]">
                                  {record.changeType === '入职' && (
                                    <span>入职 {record.changeAfter.departmentName} - {record.changeAfter.positionName}</span>
                                  )}
                                  {record.changeType === '转正' && (
                                    <span>
                                      {record.changeBefore.rankLevel} → {record.changeAfter.rankLevel}
                                      {record.reason && `（${record.reason}）`}
                                    </span>
                                  )}
                                  {(record.changeType === '调岗' || record.changeType === '晋升' || record.changeType === '降职') && (
                                    <span>
                                      {record.changeBefore.departmentName} {record.changeBefore.positionName}
                                      {record.changeBefore.rankLevel && ` (${record.changeBefore.rankLevel})`}
                                      {' → '}
                                      {record.changeAfter.departmentName} {record.changeAfter.positionName}
                                      {record.changeAfter.rankLevel && ` (${record.changeAfter.rankLevel})`}
                                      {record.reason && `（${record.reason}）`}
                                    </span>
                                  )}
                                  {record.changeType === '离职' && (
                                    <span>
                                      离职 {record.reason && `（${record.reason}）`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* 变动记录分页 */}
                {filteredChangeRecords.length > CHANGE_PAGE_SIZE && (
                  <div className="flex justify-end mt-4">
                    <Pagination
                      current={changePage}
                      pageSize={CHANGE_PAGE_SIZE}
                      total={filteredChangeRecords.length}
                      onChange={setChangePage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 变更记录 Tab */}
            {activeTab === 'history' && (
              <Card>
                <CardBody className="p-0">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-[var(--color-text-secondary)]">加载中...</div>
                    </div>
                  ) : establishmentHistories.length === 0 ? (
                    <Empty title="暂无变更记录" description="该部门暂无编制变更记录" />
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                              申请时间
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                              申请人
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                              调整原因
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                              原名额 → 新名额
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--color-text-secondary)]">
                              状态
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {establishmentHistories.map((history) => (
                            <tr
                              key={history.id}
                              className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-bg)] cursor-pointer"
                              onClick={() => handleViewHistoryDetail(history)}
                            >
                              <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                {new Date(history.createdAt).toLocaleDateString('zh-CN')}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--color-text-primary)]">
                                {history.applicantName}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                {history.reason === 'business_expansion' && '业务扩张'}
                                {history.reason === 'business_contraction' && '业务收缩'}
                                {history.reason === 'natural_turnover' && '自然流动'}
                                {history.reason === 'other' && '其他'}
                                {history.remark && `（${history.remark}）`}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                                {history.oldQuota} → {history.newQuota}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {renderStatusIcon(history.status)}
                                  <span className="text-sm">
                                    {history.status === 'pending' && '待审批'}
                                    {history.status === 'approved' && '已通过'}
                                    {history.status === 'rejected' && '已驳回'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* 变更记录详情弹窗 */}
            <EstablishmentHistoryModal
              open={historyModalVisible}
              onClose={() => setHistoryModalVisible(false)}
              establishmentId={historyModalData?.establishmentId}
              departmentName={historyModalData?.departmentName}
              positionName={historyModalData?.positionName}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
