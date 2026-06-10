import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Pagination, StatusBadge, Button, Input, Select } from '@/components/ui';
import { useArchiveStore } from '@/store';
import { fetchArchiveList } from '@/services/api';
import { mockDepartments } from '@/services/mockData';
import type { Employee } from '@/types';
import { SearchIcon, DownloadIcon, PlusIcon } from 'lucide-react';

export function ArchiveListPage() {
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
  } = useArchiveStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchArchiveList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        departmentId: filters.departmentId,
        status: filters.status,
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
  }, [pagination.page, filters.departmentId, filters.status]);

  const handleRowClick = (employee: Employee) => {
    navigate(`/archive/${employee.id}`);
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
  };

  const columns = [
    {
      key: 'employeeNo',
      title: '工号',
      width: 100,
      render: (row: Employee) => (
        <span className="font-medium">{row.employeeNo}</span>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      width: 100,
      render: (row: Employee) => (
        <span className="text-brand cursor-pointer hover:underline">
          {row.name}
        </span>
      ),
    },
    {
      key: 'gender',
      title: '性别',
      width: 60,
    },
    {
      key: 'departmentName',
      title: '部门',
      width: 120,
    },
    {
      key: 'positionName',
      title: '岗位',
      width: 140,
    },
    {
      key: 'entryDate',
      title: '入职日期',
      width: 120,
    },
    {
      key: 'status',
      title: '状态',
      width: 80,
      render: (row: Employee) =><StatusBadge status={row.status} size="sm" />,
    },
  ];

  const departmentOptions = [
    { value: '', label: '全部部门' },
    ...mockDepartments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '在职' },
    { value: 'archived', label: '已封存' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">人员档案</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
            导出
          </Button>
          <Button size="sm" icon={<PlusIcon className="w-4 h-4" />}>
            新建档案
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 p-4 bg-surface-card rounded-lg shadow-card">
        <Input
          placeholder="搜索姓名/工号/手机号"
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
          value={filters.status || 'all'}
          onChange={(e) => setFilters({ status: e.target.value as 'all' | 'active' | 'archived' })}
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