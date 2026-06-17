import { useState, useEffect } from 'react';
import { X, User, Clock, FileText, Shield, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ArchiveDetail, TransferRecord, ResignationRecord } from '@/types';
import { fetchArchiveDetail } from '@/services/api';

interface EmployeeDetailPanelProps {
  visible: boolean;
  employeeId: string | null;
  onClose: () => void;
}

type TabType = 'info' | 'contract' | 'history';

// 掩码手机号
const maskPhone = (phone: string) => {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

// 掩码身份证
const maskIdCard = (idCard: string) => {
  if (!idCard) return '-';
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
};

// 掩码银行卡
const maskBankCard = (cardNo: string) => {
  if (!cardNo) return '-';
  return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return dateStr.split('T')[0];
};

// 计算工龄
const calculateWorkYears = (firstJobDate?: string) => {
  if (!firstJobDate) return '-';
  const start = new Date(firstJobDate);
  const now = new Date();
  const years = Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${years}年`;
};

export const EmployeeDetailPanel = ({
  visible,
  employeeId,
  onClose,
}: EmployeeDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [archiveDetail, setArchiveDetail] = useState<ArchiveDetail | null>(null);

  // 加载员工详情
  useEffect(() => {
    if (visible && employeeId) {
      loadEmployeeDetail();
    }
  }, [visible, employeeId]);

  const loadEmployeeDetail = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const detail = await fetchArchiveDetail(employeeId);
      if (detail) {
        setArchiveDetail(detail);
      }
    } catch (error) {
      console.error('加载员工详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

  if (!visible || !employeeId) return null;

  const { employee, probation, transfers, resignations, contracts } = archiveDetail || {};
  const allHistory = archiveDetail ? [
    // 入职记录
    {
      id: `entry-${employee?.id}`,
      type: '入职',
      content: `入职 ${employee?.departmentName} / ${employee?.positionName}`,
      date: employee?.entryDate || '',
      operator: '-',
    },
    // 试用期记录
    ...(probation ? [{
      id: `probation-${probation.id}`,
      type: '转正',
      content: `试用期结束，考核${probation.status === 'passed' ? '通过' : probation.status === 'rejected' ? '不通过' : '延期'}`,
      date: probation.probationEndDate,
      operator: '-',
    }] : []),
    // 调动记录
    ...transfers?.map((t) => ({
      id: t.id,
      type: t.transferType as string,
      content: getTransferContent(t),
      date: t.transferDate,
      operator: '-',
    })) || [],
    // 离职记录
    ...resignations?.map((r) => ({
      id: r.id,
      type: '离职',
      content: getResignationContent(r),
      date: r.resignationDate,
      operator: '-',
    })) || [],
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* 滑出面板 */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 bg-white z-50 shadow-[-8px_0_24px_rgba(0,0,0,0.15)] animate-slide-in-right overflow-hidden flex flex-col',
          'w-[600px]'
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-light)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--color-brand)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {loading ? '加载中...' : employee?.name}
              </h2>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {loading ? '' : employee?.employeeNo}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab切换 */}
        <div className="flex border-b border-[var(--color-border)]">
          <button
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'info'
                ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
            onClick={() => setActiveTab('info')}
          >
            人员信息
          </button>
          <button
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'contract'
                ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
            onClick={() => setActiveTab('contract')}
          >
            合同信息
          </button>
          <button
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'history'
                ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
            onClick={() => setActiveTab('history')}
          >
            变动记录
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[var(--color-text-secondary)]">加载中...</div>
            </div>
          ) : activeTab === 'info' && employee ? (
            <div className="p-6 space-y-4">
              {/* 入职信息 */}
              <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">入职信息</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">工号</span>
                    <span className="text-[var(--color-text-primary)]">{employee.employeeNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">姓名</span>
                    <span className="text-[var(--color-text-primary)]">{employee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">性别</span>
                    <span className="text-[var(--color-text-primary)]">{employee.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">手机</span>
                    <span className="text-[var(--color-text-primary)]">{maskPhone(employee.phone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">身份证</span>
                    <span className="text-[var(--color-text-primary)]">{maskIdCard(employee.idCard)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">出生日期</span>
                    <span className="text-[var(--color-text-primary)]">{employee.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">学历</span>
                    <span className="text-[var(--color-text-primary)]">{employee.education}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">籍贯</span>
                    <span className="text-[var(--color-text-primary)]">{employee.hometown || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">入职日期</span>
                    <span className="text-[var(--color-text-primary)]">{employee.entryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">部门</span>
                    <span className="text-[var(--color-text-primary)]">{employee.departmentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">职位</span>
                    <span className="text-[var(--color-text-primary)]">{employee.positionName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">职级</span>
                    <span className="text-[var(--color-text-primary)]">{employee.rankLevel || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">员工类型</span>
                    <span className="text-[var(--color-text-primary)]">{employee.employeeType || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">招聘来源</span>
                    <span className="text-[var(--color-text-primary)]">{employee.recruitSource || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">合同类型</span>
                    <span className="text-[var(--color-text-primary)]">{employee.contractType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">合同期限</span>
                    <span className="text-[var(--color-text-primary)]">{employee.contractPeriod || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">试用期时长</span>
                    <span className="text-[var(--color-text-primary)]">{employee.probationDuration ? `${employee.probationDuration}个月` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">试用期薪资</span>
                    <span className="text-[var(--color-text-primary)]">{employee.probationSalary ? `¥${employee.probationSalary.toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">转正薪资</span>
                    <span className="text-[var(--color-text-primary)]">{employee.formalSalary ? `¥${employee.formalSalary.toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">档案状态</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      employee.status === 'active'
                        ? 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]'
                        : 'bg-[var(--color-text-disabled)] text-white'
                    )}>
                      {employee.status === 'active' ? '在职' : '离职'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 基本信息 */}
              <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">基本信息</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">婚姻状况</span>
                    <span className="text-[var(--color-text-primary)]">{employee.maritalStatus || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">身份证开始</span>
                    <span className="text-[var(--color-text-primary)]">{employee.idCardStartDate ? formatDate(employee.idCardStartDate) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">身份证截止</span>
                    <span className="text-[var(--color-text-primary)]">{employee.idCardEndDate ? formatDate(employee.idCardEndDate) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">首次参加工作</span>
                    <span className="text-[var(--color-text-primary)]">{employee.firstJobDate ? formatDate(employee.firstJobDate) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">工龄</span>
                    <span className="text-[var(--color-text-primary)]">{calculateWorkYears(employee.firstJobDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">户籍类型</span>
                    <span className="text-[var(--color-text-primary)]">{employee.householdType || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">政治面貌</span>
                    <span className="text-[var(--color-text-primary)]">{employee.politicalStatus || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">退役军人</span>
                    <span className="text-[var(--color-text-primary)]">{employee.isVeteran ? '是' : '否'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">血型</span>
                    <span className="text-[var(--color-text-primary)]">{employee.bloodType || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">身高</span>
                    <span className="text-[var(--color-text-primary)]">{employee.height ? `${employee.height}cm` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">体重</span>
                    <span className="text-[var(--color-text-primary)]">{employee.weight ? `${employee.weight}kg` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">毕业院校</span>
                    <span className="text-[var(--color-text-primary)]">{employee.graduateSchool || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">所学专业</span>
                    <span className="text-[var(--color-text-primary)]">{employee.major || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 社保公积金 */}
              <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  社保公积金
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">社保账号</span>
                    <span className="text-[var(--color-text-primary)]">{employee.socialSecurityNo || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">公积金账号</span>
                    <span className="text-[var(--color-text-primary)]">{employee.housingFundNo || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 地址户口 */}
              <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  地址 & 户口
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">住址</span>
                    <span className="text-[var(--color-text-primary)]">{employee.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">户口所在地</span>
                    <span className="text-[var(--color-text-primary)]">{employee.householdAddress || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 紧急联系 & 银行卡 */}
              <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">紧急联系 & 银行卡</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">紧急联系人</span>
                    <span className="text-[var(--color-text-primary)]">{employee.emergencyContact || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">银行卡号</span>
                    <span className="text-[var(--color-text-primary)]">{maskBankCard(employee.bankCardNo || '')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">银行名称</span>
                    <span className="text-[var(--color-text-primary)]">{employee.bankName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">开户行</span>
                    <span className="text-[var(--color-text-primary)]">{employee.bankBranch || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 电子签名 */}
              {employee.signature && (
                <div className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">电子签名</h3>
                  <div className="p-4 bg-white rounded border border-[var(--color-border)]">
                    <p className="text-lg font-serif text-[var(--color-text-primary)]">{employee.signature}</p>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'contract' && contracts && contracts.length > 0 ? (
            <div className="p-6 space-y-4">
              {contracts.map((contractDetail) => (
                <div key={contractDetail.contract.id} className="bg-[var(--color-surface-bg)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      {contractDetail.contract.contractType}
                    </h3>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      contractDetail.contract.status === 'active' && 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]',
                      contractDetail.contract.status === 'expiring_soon' && 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]',
                      contractDetail.contract.status === 'terminated' && 'bg-[var(--color-text-disabled)] text-white'
                    )}>
                      {contractDetail.contract.status === 'active' ? '生效中' :
                       contractDetail.contract.status === 'expiring_soon' ? '即将到期' :
                       contractDetail.contract.status === 'terminated' ? '已终止' : '草稿'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">合同编号</span>
                      <span className="text-[var(--color-text-primary)]">{contractDetail.contract.contractNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">甲方公司</span>
                      <span className="text-[var(--color-text-primary)]">{contractDetail.contract.employerCompany}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">签订日期</span>
                      <span className="text-[var(--color-text-primary)]">{contractDetail.contract.signDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">合同期限</span>
                      <span className="text-[var(--color-text-primary)]">
                        {contractDetail.contract.startDate} 至 {contractDetail.contract.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">续签次数</span>
                      <span className="text-[var(--color-text-primary)]">{contractDetail.contract.renewalCount}次</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'contract' ? (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-secondary)]">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm">暂无合同信息</span>
            </div>
          ) : (
            /* 变动记录 */
            <div className="p-6">
              {allHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">暂无变动记录</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {allHistory.map((record, index) => (
                    <div
                      key={record.id}
                      className={cn(
                        'relative pl-6 pb-4 border-l-2 border-[var(--color-border)]',
                        index === allHistory.length - 1 && 'border-l-0'
                      )}
                    >
                      {/* 时间线节点 */}
                      <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] bg-white border-2 border-[var(--color-brand)] rounded-full" />

                      {/* 记录内容 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded border',
                              record.type === '入职' && 'bg-blue-50 text-blue-700 border-blue-200',
                              record.type === '转正' && 'bg-green-50 text-green-700 border-green-200',
                              record.type === '调岗' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                              record.type === '晋升' && 'bg-purple-50 text-purple-700 border-purple-200',
                              record.type === '降职' && 'bg-orange-50 text-orange-700 border-orange-200',
                              record.type === '离职' && 'bg-red-50 text-red-700 border-red-200'
                            )}
                          >
                            {record.type}
                          </span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {record.content}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-disabled)]">
                          <span>{record.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// 辅助函数：获取调动内容描述
function getTransferContent(transfer: TransferRecord): string {
  const typeLabels: Record<string, string> = {
    '调岗': '岗位调动',
    '晋升': '职位晋升',
    '降职': '职位降级',
  };
  const label = typeLabels[transfer.transferType] || transfer.transferType;
  return `${label}：${transfer.fromDepartmentName} ${transfer.fromPositionName} → ${transfer.toDepartmentName} ${transfer.toPositionName}`;
}

// 辅助函数：获取离职内容描述
function getResignationContent(resignation: ResignationRecord): string {
  const typeLabels: Record<string, string> = {
    '主动离职': '主动辞职',
    '被动离职': '被动离职',
    '退休': '退休',
  };
  const label = typeLabels[resignation.resignationType] || resignation.resignationType;
  return `${label}：${resignation.reason || '未知原因'}`;
}
