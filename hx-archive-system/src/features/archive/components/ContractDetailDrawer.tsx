import { Card, CardHeader, CardTitle, CardBody, Button, Badge } from '@/components/ui';
import { InfoGrid } from '@/components/data';
import { ImagePreview } from '@/components/ui/ImagePreview';
import { useArchiveStore } from '@/store';
import { formatDate } from '@/lib/utils';
import { XIcon, FileTextIcon, DownloadIcon, PrinterIcon } from 'lucide-react';
import type { ContractStatus, ChangeType, SignStatus } from '@/types';

const contractStatusMap: Record<ContractStatus, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_sign: { label: '待签署', variant: 'warning' },
  active: { label: '执行中', variant: 'success' },
  expiring_soon: { label: '即将到期', variant: 'warning' },
  terminated: { label: '已终止', variant: 'danger' },
  renewing: { label: '续签中', variant: 'info' },
};

const changeTypeMap: Record<ChangeType, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: '新签', variant: 'success' },
  renew: { label: '续签', variant: 'info' },
  change: { label: '变更', variant: 'warning' },
  terminate: { label: '终止', variant: 'danger' },
};

const signStatusMap: Record<SignStatus, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  unsigned: { label: '未签章', variant: 'neutral' },
  employer_signed: { label: '甲方已签', variant: 'warning' },
  both_signed: { label: '双方已签', variant: 'success' },
};

export function ContractDetailDrawer() {
  const { currentContractDetail, contractDrawerVisible, setContractDrawerVisible, setCurrentContractDetail } = useArchiveStore();

  const handleClose = () => {
    setContractDrawerVisible(false);
    setCurrentContractDetail(null);
  };

  if (!contractDrawerVisible || !currentContractDetail) {
    return null;
  }

  const { contract, changes, attachment } = currentContractDetail;
  const status = contractStatusMap[contract.status];

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* 抽屉 */}
      <div className="fixed right-0 top-0 h-full w-[700px] bg-white shadow-xl z-50 overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileTextIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <h2 className="text-lg font-semibold">合同详情</h2>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={<PrinterIcon className="w-4 h-4" />}>
              打印
            </Button>
            <Button variant="ghost" size="sm" icon={<DownloadIcon className="w-4 h-4" />}>
              导出
            </Button>
            <Button variant="ghost" size="sm" icon={<XIcon className="w-5 h-5" />} onClick={handleClose} />
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 合同信息 */}
          <Card>
            <CardHeader>
              <CardTitle>合同信息</CardTitle>
            </CardHeader>
            <CardBody>
              <InfoGrid
                items={[
                  { label: '合同编号', value: contract.contractNo },
                  { label: '合同类型', value: contract.contractType },
                  { label: '甲方（公司）', value: contract.employerCompany },
                  { label: '乙方（员工）', value: contract.employeeName },
                  { label: '签订日期', value: formatDate(contract.signDate) },
                  { label: '合同期限', value: `${formatDate(contract.startDate)} ~ ${formatDate(contract.endDate)}` },
                  { label: '续签次数', value: contract.renewalCount ? `第${contract.renewalCount}次` : '首次签订' },
                  { label: '关联异动', value: contract.relatedTransferId || '-' },
                  { label: '备注', value: contract.remarks || '-', span: 3 },
                ]}
                columns={3}
              />
            </CardBody>
          </Card>

          {/* 合同变更记录 */}
          <Card>
            <CardHeader>
              <CardTitle>合同变更记录</CardTitle>
            </CardHeader>
            <CardBody>
              {changes && changes.length > 0 ? (
                <div className="space-y-4">
                  {changes.map((change, index) => {
                    const changeType = changeTypeMap[change.changeType];
                    return (
                      <div
                        key={change.id}
                        className="flex items-start gap-4 p-4 bg-[var(--color-surface-bg)] rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant={changeType.variant} size="sm">{changeType.label}</Badge>
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {formatDate(change.changeDate)}
                            </span>
                            <span className="text-sm text-[var(--color-text-disabled)]">
                              操作人：{change.operator}
                            </span>
                          </div>
                          {change.changeReason && (
                            <p className="text-sm">
                              <span className="text-[var(--color-text-secondary)]">变更原因：</span>
                              {change.changeReason}
                            </p>
                          )}
                          {change.changeContent && (
                            <p className="text-sm">
                              <span className="text-[var(--color-text-secondary)]">变更内容：</span>
                              {change.changeContent}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-[var(--color-text-disabled)] py-4">暂无变更记录</p>
              )}
            </CardBody>
          </Card>

          {/* 合同附件 */}
          <Card>
            <CardHeader>
              <CardTitle>合同附件</CardTitle>
            </CardHeader>
            <CardBody>
              {attachment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge
                      variant={signStatusMap[attachment.signStatus].variant}
                      size="sm"
                    >
                      {signStatusMap[attachment.signStatus].label}
                    </Badge>
                    {attachment.signTime && (
                      <span className="text-sm text-[var(--color-text-disabled)]">
                        签章时间：{formatDate(attachment.signTime)}
                      </span>
                    )}
                  </div>

                  {/* 合同扫描件 */}
                  {attachment.contractScan && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[var(--color-text-secondary)]">合同扫描件</p>
                      <ImagePreview src={attachment.contractScan} alt="合同扫描件" />
                    </div>
                  )}

                  {/* 签章 */}
                  <div className="grid grid-cols-2 gap-4">
                    {attachment.employerSignature && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">甲方签章</p>
                        <ImagePreview src={attachment.employerSignature} alt="甲方签章" />
                      </div>
                    )}
                    {attachment.employeeSignature && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">乙方签章（员工）</p>
                        <ImagePreview src={attachment.employeeSignature} alt="乙方签章" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-[var(--color-text-disabled)] py-4">暂无附件</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}