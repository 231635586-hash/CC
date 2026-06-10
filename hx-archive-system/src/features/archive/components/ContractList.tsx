import { Button, Table, Badge } from '@/components/ui';
import type { ContractDetail, ContractStatus, SignStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { EyeIcon } from 'lucide-react';
import { useArchiveStore } from '@/store';

const contractStatusMap: Record<ContractStatus, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_sign: { label: '待签署', variant: 'warning' },
  active: { label: '执行中', variant: 'success' },
  expiring_soon: { label: '即将到期', variant: 'warning' },
  terminated: { label: '已终止', variant: 'danger' },
  renewing: { label: '续签中', variant: 'info' },
};

const signStatusMap: Record<SignStatus, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  unsigned: { label: '未签章', variant: 'neutral' },
  employer_signed: { label: '甲方已签', variant: 'warning' },
  both_signed: { label: '双方已签', variant: 'success' },
};

interface ContractListProps {
  contracts: ContractDetail[];
  loading?: boolean;
}

export function ContractList({ contracts, loading }: ContractListProps) {
  const { setCurrentContractDetail, setContractDrawerVisible } = useArchiveStore();

  const handleViewDetail = (contractDetail: ContractDetail) => {
    setCurrentContractDetail(contractDetail);
    setContractDrawerVisible(true);
  };

  const columns = [
    {
      key: 'contractNo',
      title: '合同编号',
      width: 140,
      render: (row: ContractDetail) => (
        <span className="font-medium">{row.contract.contractNo}</span>
      ),
    },
    {
      key: 'contractType',
      title: '合同类型',
      width: 100,
      render: (row: ContractDetail) => row.contract.contractType,
    },
    {
      key: 'signDate',
      title: '签订日期',
      width: 100,
      render: (row: ContractDetail) => formatDate(row.contract.signDate),
    },
    {
      key: 'contractPeriod',
      title: '合同期限',
      width: 200,
      render: (row: ContractDetail) => (
        <span className="text-sm">
          {formatDate(row.contract.startDate)} ~ {formatDate(row.contract.endDate)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '合同状态',
      width: 100,
      render: (row: ContractDetail) => {
        const status = contractStatusMap[row.contract.status];
        return <Badge variant={status.variant} size="sm">{status.label}</Badge>;
      },
    },
    {
      key: 'signStatus',
      title: '签章状态',
      width: 100,
      render: (row: ContractDetail) => {
        if (!row.attachment) return '-';
        const status = signStatusMap[row.attachment.signStatus];
        return <Badge variant={status.variant} size="sm">{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: 80,
      render: (row: ContractDetail) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<EyeIcon className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(row);
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 合同列表 */}
      <Table
        columns={columns}
        data={contracts}
        rowKey={(row) => row.contract.id}
        onRowClick={handleViewDetail}
        loading={loading}
        emptyText="暂无合同记录"
      />
    </div>
  );
}