import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Pagination, StatusBadge, Button, Input, Select } from '@/components/ui';
import { useSalaryStore } from '@/store';
import { fetchSalaryList } from '@/services/api';
import { mockDepartments } from '@/services/mockData';
import type { PayrollRecord } from '@/types';
import { SearchIcon, DownloadIcon, PlusIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function SalaryListPage() {
  const navigate = useNavigate();
  const {
    list,
    loading,
    filters,
    pagination,
    setList,
    setLoading,
    setFilters,
    setPagination,
  } = useSalaryStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchSalaryList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        departmentId: filters.departmentId,
        issueMonth: filters.issueMonth,
        issueStatus: filters.issueStatus,
        searchText: filters.searchText,
      });
      setList(result.list);
      setPagination({ total: result.total });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination.page, filters.departmentId, filters.issueMonth, filters.issueStatus]);

  const handleRowClick = (record: PayrollRecord) => {
    navigate(`/salary/${record.id}`);
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
  };

  const columns = [
    {
      key: 'id',
      title: '工资条编号',
      width: 160,
      render: (row: PayrollRecord) => (
        <span className="font-medium text-xs">YGZ-{row.issueMonth.replace('-', '')}-{row.id.slice(-4)}</span>
      ),
    },
    {
      key: 'employeeName',
      title: '员工姓名',
      width: 100,
      render: (row: PayrollRecord) => (
        <span className="text-brand cursor-pointer hover:underline">
          {row.employeeName}
        </span>
      ),
    },
    {
      key: 'departmentName',
      title: '部门',
      width: 120,
    },
    {
      key: 'issueMonth',
      title: '发放月份',
      width: 100,
    },
    {
      key: 'grossSalary',
      title: '应发合计',
      width: 120,
      render: (row: PayrollRecord) => (
        <span className="text-status-success">{formatCurrency(row.grossSalary)}</span>
      ),
    },
    {
      key: 'totalDeductions',
      title: '扣款合计',
      width: 120,
      render: (row: PayrollRecord) => (
        <span className="text-status-danger">{formatCurrency(row.totalDeductions)}</span>
      ),
    },
    {
      key: 'netSalary',
      title: '实发工资',
      width: 120,
      render: (row: PayrollRecord) => (
        <span className="font-semibold text-text-primary">{formatCurrency(row.netSalary)}</span>
      ),
    },
    {
      key: 'issueStatus',
      title: '状态',
      width: 80,
      render: (row: PayrollRecord) => <StatusBadge status={row.issueStatus} size="sm" />,
    },
  ];

  const departmentOptions = [
    { value: '', label: '全部部门' },
    ...mockDepartments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'paid', label: '已发放' },
    { value: 'unpaid', label: '未发放' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">薪资档案</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
            导出
          </Button>
          <Button size="sm" icon={<PlusIcon className="w-4 h-4" />}>
            生成工资条
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 p-4 bg-surface-card rounded-lg shadow-card">
        <Input
          placeholder="搜索员工姓名"
          prefixIcon={<SearchIcon className="w-4 h-4" />}
          value={filters.searchText || ''}
          onChange={(e) => setFilters({ searchText: e.target.value })}
          className="w-64"
        />
        <Select
          options={departmentOptions}
          value={filters.departmentId || ''}
          onChange={(e) => setFilters({ departmentId: e.target.value || undefined })}
          className="w-40"
        />
        <Select
          options={statusOptions}
          value={filters.issueStatus || 'all'}
          onChange={(e) => setFilters({ issueStatus: e.target.value as 'all' | 'paid' | 'unpaid' })}
          className="w-32"
        />
      </div>

      {/* 数据表格 */}
      <div className="bg-surface-card rounded-lg shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={list}
          rowKey="id"
          onRowClick={handleRowClick}
          loading={loading}
        />
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}