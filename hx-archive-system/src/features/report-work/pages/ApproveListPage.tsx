import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Table, Pagination, Button } from '@/components/ui';
import { useReportWorkStore } from '../store';
import { fetchSupplementList } from '../services/api';
import type { SupplementApplication, SupplementStatus } from '@/types';
import { EyeIcon, CheckIcon } from 'lucide-react';

export function ApproveListPage() {
  const navigate = useNavigate();
  const {
    supplementList,
    supplementLoading,
    supplementPagination,
    setSupplementList,
    setSupplementLoading,
    setSupplementPagination,
  } = useReportWorkStore();

  const [activeTab, setActiveTab] = useState<SupplementStatus | ''>('待审批');

  const loadData = async () => {
    setSupplementLoading(true);
    try {
      const result = await fetchSupplementList({
        page: supplementPagination.page,
        pageSize: supplementPagination.pageSize,
        filters: { status: activeTab },
      });
      setSupplementList(result.list);
      setSupplementPagination({ total: result.total });
    } finally {
      setSupplementLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, supplementPagination.page]);

  const handleTabChange = (tab: SupplementStatus | '') => {
    setActiveTab(tab);
    setSupplementPagination({ page: 1 });
  };

  const handlePageChange = (page: number) => {
    setSupplementPagination({ page });
  };

  const getStatusBadge = (status: SupplementStatus) => {
    switch (status) {
      case '待审批':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-warning-light text-warning">待审批</span>;
      case '已通过':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-success-light text-success">已通过</span>;
      case '已驳回':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-danger-light text-danger">已驳回</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-light text-gray">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'employeeName',
      title: '申请人',
      width: 120,
      render: (row: SupplementApplication) => (
        <div>
          <div className="font-medium">{row.employeeName}</div>
          <div className="text-xs text-text-secondary">{row.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'supplementDate',
      title: '补报日期',
      width: 120,
    },
    {
      key: 'shiftType',
      title: '申请班次',
      width: 100,
    },
    {
      key: 'reportPoint',
      title: '报工点',
      width: 120,
    },
    {
      key: 'approverName',
      title: '审批班长',
      width: 120,
    },
    {
      key: 'applyTime',
      title: '申请时间',
      width: 160,
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (row: SupplementApplication) => getStatusBadge(row.status),
    },
    {
      key: 'actions',
      title: '操作',
      width: 180,
      render: (row: SupplementApplication) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<EyeIcon className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/report-work/approve/${row.id}?view=true`);
            }}
          >
            查看
          </Button>
          {row.status === '待审批' && (
            <Button
              size="sm"
              icon={<CheckIcon className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/report-work/approve/${row.id}`);
              }}
            >
              审批
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tabs = [
    { key: '待审批', label: '待审批', count: 3 },
    { key: '已通过', label: '已通过', count: 1 },
    { key: '已驳回', label: '已驳回', count: 1 },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">审批管理</h1>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 p-1 bg-surface-card rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => handleTabChange(tab.key as SupplementStatus)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-border'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 列表卡片 */}
      <Card>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={supplementList}
            rowKey="id"
            onRowClick={(row) => navigate(`/report-work/approve/${row.id}`)}
            loading={supplementLoading}
            emptyText="暂无待审批申请"
          />
          <div className="px-4 py-3 border-t border-border">
            <Pagination
              current={supplementPagination.page}
              pageSize={supplementPagination.pageSize}
              total={supplementPagination.total}
              onChange={handlePageChange}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}