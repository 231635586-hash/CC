import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Pagination, Button, Input, Select } from '@/components/ui';
import { useReportWorkStore } from '../store';
import { fetchReportList } from '../services/api';
import type { ReportRecord, ReportStatus } from '@/types';
import { SearchIcon, DownloadIcon } from 'lucide-react';

export function ReportWorkListPage() {
  const navigate = useNavigate();
  const {
    reportList,
    reportLoading,
    reportFilters,
    reportPagination,
    setReportList,
    setReportLoading,
    setReportFilters,
    setReportPagination,
  } = useReportWorkStore();

  const loadData = async () => {
    setReportLoading(true);
    try {
      const result = await fetchReportList({
        page: reportPagination.page,
        pageSize: reportPagination.pageSize,
        filters: reportFilters,
      });
      setReportList(result.list);
      setReportPagination({ total: result.total });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportPagination.page, reportFilters]);

  const handleRowClick = (record: ReportRecord) => {
    navigate(`/report-work/${record.id}`);
  };

  const handlePageChange = (page: number) => {
    setReportPagination({ page });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case '已完成':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-success-light text-success">已完成</span>;
      case '未完成':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-danger-light text-danger">未完成</span>;
      case '已补报':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-info-light text-info">已补报</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-light text-gray">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'date',
      title: '日期',
      width: 120,
      render: (row: ReportRecord) => (
        <span className="font-medium">{row.date}</span>
      ),
    },
    {
      key: 'employeeName',
      title: '姓名',
      width: 100,
      render: (row: ReportRecord) => (
        <span className="text-brand cursor-pointer hover:underline">
          {row.employeeName}
        </span>
      ),
    },
    {
      key: 'departmentName',
      title: '部门/班组',
      width: 120,
    },
    {
      key: 'shiftType',
      title: '班次',
      width: 100,
    },
    {
      key: 'reportPoint',
      title: '报工点',
      width: 120,
    },
    {
      key: 'reportTime',
      title: '报工时间',
      width: 160,
      render: (row: ReportRecord) => row.reportTime || '-',
    },
    {
      key: 'reportMethod',
      title: '报工方式',
      width: 100,
      render: (row: ReportRecord) => (
        <span className={row.reportMethod === '补报' ? 'text-warning' : 'text-text-secondary'}>
          {row.reportMethod}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (row: ReportRecord) => getStatusBadge(row.status),
    },
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: '已完成', label: '已完成' },
    { value: '未完成', label: '未完成' },
    { value: '已补报', label: '已补报' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">报工记录</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
            导出
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 p-4 bg-surface-card rounded-lg shadow-card">
        <Input
          placeholder="搜索姓名/部门"
          prefixIcon={<SearchIcon className="w-4 h-4" />}
          value={reportFilters.searchText || ''}
          onChange={(e) => setReportFilters({ searchText: e.target.value })}
          className="w-64"
        />
        <Select
          options={statusOptions}
          value={reportFilters.status || ''}
          onChange={(e) => setReportFilters({ status: e.target.value as ReportStatus | '' })}
          className="w-32"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReportFilters({})}
        >
          重置
        </Button>
      </div>

      {/* 数据表格 */}
      <div className="bg-surface-card rounded-lg shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={reportList}
          rowKey="id"
          onRowClick={handleRowClick}
          loading={reportLoading}
        />
        <div className="px-4 py-3 border-t border-border">
          <Pagination
            current={reportPagination.page}
            pageSize={reportPagination.pageSize}
            total={reportPagination.total}
            onChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}