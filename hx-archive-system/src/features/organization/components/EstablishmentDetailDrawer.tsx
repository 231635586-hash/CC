import { useEffect, useMemo, useState } from 'react';
import { X, Briefcase, Calendar, ArrowRight, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { cn } from '@/lib/utils';
import type { EstablishmentMatrixRow, EstablishmentHistory, TempEstablishmentStatus } from '../types';
import { getEstablishmentHistoryByPosition } from '../services/api';

// Drawer 宽度（编制详情需要展示更多字段，比部门详情略宽）
const DRAWER_WIDTH = 'w-[520px]';

// 临时编制状态配置
const TEMP_STATUS_CONFIG: Record<TempEstablishmentStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: {
    label: '待生效',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  active: {
    label: '生效中',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  expired: {
    label: '已失效',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-300',
  },
};

// 变更历史状态配置
const HISTORY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  approved: { label: '已通过', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '已驳回', color: 'bg-red-50 text-red-700 border-red-200' },
};

const REASON_MAP: Record<string, string> = {
  business_expansion: '业务扩张',
  business_contraction: '业务收缩',
  natural_turnover: '自然流动',
  other: '其他',
};

interface EstablishmentDetailDrawerProps {
  visible: boolean;
  row: EstablishmentMatrixRow | null;
  year: number;
  onClose: () => void;
  /** "查看全部"按钮回调：跳转扩展版 EstablishmentHistoryModal */
  onViewAllHistory?: (
    departmentId: string,
    positionId: string,
    year: number,
    departmentName: string,
    positionName: string,
  ) => void;
  /** "续约"按钮回调：打开续约弹窗（仅 expiring 状态卡片显示） */
  onExtend?: (params: {
    establishmentId: string;
    currentEndDate: string;
    currentStartDate: string;
    quota: number;
    occupied: number;
    month: number;
    departmentName: string;
    positionName: string;
  }) => void;
}

// 含月份的临时编制条目
interface TempEstWithMonth {
  id: string;
  startDate: string;
  endDate: string;
  quota: number;
  occupied: number;
  tempStatus: TempEstablishmentStatus;
  month: number;
}

// 全年汇总类型
interface YearSummary {
  totalQuota: number;
  totalOccupied: number;
  totalRemaining: number;
  occupancyRate: number;
  formalQuota: number;
  formalOccupied: number;
  tempQuota: number;
  tempOccupied: number;
  tempEsts: TempEstWithMonth[];
  hasAnyData: boolean;
}

/**
 * 计算剩余天数（endDate - today）
 */
function calcDaysRemaining(endDate: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * 计算日期段状态对应的徽标颜色（F5 精细化：到期 ≤ 14 天 = 即将到期）
 */
function getTempBadgeStyle(tempStatus: TempEstablishmentStatus, endDate: string) {
  if (tempStatus === 'pending') {
    return { bg: 'bg-gray-400', text: 'text-white', label: '待' };
  }
  if (tempStatus === 'expired') {
    return { bg: 'bg-gray-500', text: 'text-white opacity-60', label: '失效' };
  }
  // active
  const days = calcDaysRemaining(endDate);
  if (days !== null && days <= 14) {
    return { bg: 'bg-amber-500', text: 'text-white', label: '即将到期' };
  }
  return { bg: 'bg-emerald-500', text: 'text-white', label: '生效中' };
}

export const EstablishmentDetailDrawer = ({
  visible,
  row,
  year,
  onClose,
  onViewAllHistory,
  onExtend,
}: EstablishmentDetailDrawerProps) => {
  const [histories, setHistories] = useState<EstablishmentHistory[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);

  // ESC 关闭 + body 锁滚动
  useEffect(() => {
    if (!visible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, onClose]);

  // 块 A 全年汇总（客户端自聚合）
  const yearSummary = useMemo<YearSummary | null>(() => {
    if (!row) return null;
    let totalQuota = 0;
    let totalOccupied = 0;
    let formalQuota = 0;
    let formalOccupied = 0;
    let tempQuota = 0;
    let tempOccupied = 0;
    const tempEsts: TempEstWithMonth[] = [];

    row.cells.forEach((cell, idx) => {
      if (cell.status === 'empty') return;
      totalQuota += cell.quota;
      totalOccupied += cell.occupied;

      const tb = cell.typeBreakdown ?? {
        formal: { quota: cell.quota, occupied: cell.occupied },
        temp: { quota: 0, occupied: 0, status: 'pending' as TempEstablishmentStatus },
      };
      formalQuota += tb.formal.quota;
      formalOccupied += tb.formal.occupied;
      tempQuota += tb.temp.quota;
      tempOccupied += tb.temp.occupied;

      cell.tempEstablishments?.forEach((t) => {
        tempEsts.push({ ...t, month: idx + 1 });
      });
    });

    const totalRemaining = totalQuota - totalOccupied;
    const occupancyRate = totalQuota > 0 ? Math.round((totalOccupied / totalQuota) * 100) : 0;

    return {
      totalQuota,
      totalOccupied,
      totalRemaining,
      occupancyRate,
      formalQuota,
      formalOccupied,
      tempQuota,
      tempOccupied,
      tempEsts,
      hasAnyData: totalQuota > 0,
    };
  }, [row]);

  // 块 C 历史摘要加载
  useEffect(() => {
    if (!visible || !row) {
      setHistories([]);
      return;
    }
    let cancelled = false;
    setLoadingHistories(true);
    getEstablishmentHistoryByPosition(row.departmentId, row.positionId, year)
      .then((res) => {
        if (cancelled) return;
        if (res.code === 0 && res.data) {
          // 取最新 5 条
          setHistories(res.data.slice(0, 5));
        } else {
          setHistories([]);
        }
      })
      .catch(() => {
        if (!cancelled) setHistories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, row, year]);

  if (!visible) return null;

  const handleViewAll = () => {
    if (!row || !onViewAllHistory) return;
    onViewAllHistory(row.departmentId, row.positionId, year, row.departmentName, row.positionName);
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-[var(--color-backdrop)] z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* 滑出面板 */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 bg-[var(--color-surface-card)] z-50 shadow-[-8px_0_24px_rgba(0,0,0,0.15)] animate-slide-in-right overflow-hidden flex flex-col',
          DRAWER_WIDTH,
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Briefcase className="w-5 h-5 text-[var(--color-brand)] flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                编制详情
              </h2>
              {row && (
                <span className="text-xs text-[var(--color-text-secondary)] truncate block">
                  {row.departmentName} / {row.positionName}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-5">
          {!row ? (
            <Empty title="暂无数据" description="未选中编制行" />
          ) : !yearSummary || !yearSummary.hasAnyData ? (
            <Empty
              title="该职位暂无编制记录"
              description={`${row.departmentName} / ${row.positionName} 在 ${year} 年没有编制数据`}
            />
          ) : (
            <>
              {/* 年份徽标 */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]">{year} 年</span>
                <span className="text-xs px-2 py-0.5 bg-[var(--color-brand-bg)] text-[var(--color-brand)] rounded">
                  全年汇总
                </span>
              </div>

              {/* 块 A：全年汇总 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <span>📊 全年汇总</span>
                </h3>
                {/* 顶部 4 项数据 */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="p-3 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">编制总数</div>
                    <div className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {yearSummary.totalQuota}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)]">人</div>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">已占用</div>
                    <div className="text-lg font-semibold text-[var(--color-status-warning)]">
                      {yearSummary.totalOccupied}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)]">人</div>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">剩余</div>
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        yearSummary.totalRemaining > 0
                          ? 'text-[var(--color-status-success)]'
                          : 'text-[var(--color-status-danger)]',
                      )}
                    >
                      {yearSummary.totalRemaining}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)]">人</div>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">占用率</div>
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        yearSummary.occupancyRate >= 90
                          ? 'text-[var(--color-status-danger)]'
                          : yearSummary.occupancyRate >= 70
                          ? 'text-[var(--color-status-warning)]'
                          : 'text-[var(--color-status-success)]',
                      )}
                    >
                      {yearSummary.occupancyRate}%
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)]">12个月</div>
                  </div>
                </div>

                {/* 正式/临时分项 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium text-blue-700">正式编制</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-[var(--color-text-primary)]">
                        {yearSummary.formalQuota}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        / {yearSummary.formalOccupied}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)] mt-1">
                      名额 / 已占用
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-3 border rounded-lg',
                      yearSummary.tempQuota > 0
                        ? 'border-orange-200 bg-orange-50/50'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-bg)]',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className={cn(
                          'inline-block w-2 h-2 rounded-full',
                          yearSummary.tempQuota > 0 ? 'bg-orange-500' : 'bg-gray-400',
                        )}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium',
                          yearSummary.tempQuota > 0 ? 'text-orange-700' : 'text-[var(--color-text-secondary)]',
                        )}
                      >
                        临时编制
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          'text-xl font-semibold',
                          yearSummary.tempQuota > 0
                            ? 'text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-disabled)]',
                        )}
                      >
                        {yearSummary.tempQuota}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        / {yearSummary.tempOccupied}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-disabled)] mt-1">
                      名额 / 已占用
                      {yearSummary.tempEsts.length > 0 && ` · ${yearSummary.tempEsts.length} 段`}
                    </div>
                  </div>
                </div>
              </section>

              {/* 块 B：临时编制明细 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <span>⏰ 临时编制明细</span>
                  <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                    ({yearSummary.tempEsts.length} 条)
                  </span>
                </h3>
                {yearSummary.tempEsts.length === 0 ? (
                  <div className="px-3 py-4 bg-[var(--color-surface-bg)] rounded-lg text-sm text-center text-[var(--color-text-secondary)]">
                    暂无临时编制
                  </div>
                ) : (
                  <div className="space-y-2">
                    {yearSummary.tempEsts.map((temp) => {
                      const config = TEMP_STATUS_CONFIG[temp.tempStatus];
                      const days = calcDaysRemaining(temp.endDate);
                      const badge = getTempBadgeStyle(temp.tempStatus, temp.endDate);
                      // V1.4：判断是否 expiring（active + 剩余 ≤ 14 天）
                      const isExpiring = temp.tempStatus === 'active' && days !== null && days <= 14;
                      return (
                        <div
                          key={`${temp.id}-${temp.month}`}
                          className={cn(
                            'p-3 border rounded-lg',
                            config.border,
                            config.bg,
                            isExpiring && 'ring-1 ring-amber-300',
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 text-[10px] font-medium rounded',
                                  badge.bg,
                                  badge.text,
                                )}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                {year} 年 {temp.month} 月
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className={cn('font-semibold', config.text)}>
                                {temp.quota}
                              </span>
                              <span className="text-xs text-[var(--color-text-secondary)] ml-1">
                                人
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                            <span>
                              {temp.startDate} ~ {temp.endDate}
                            </span>
                            {temp.tempStatus === 'active' && days !== null && (
                              <span
                                className={cn(
                                  'font-medium',
                                  days <= 14 ? 'text-amber-600' : 'text-emerald-600',
                                )}
                              >
                                剩 {days} 天
                              </span>
                            )}
                            {temp.tempStatus === 'pending' && days !== null && days > 0 && (
                              <span className="font-medium text-gray-500">
                                {days} 天后生效
                              </span>
                            )}
                            {temp.tempStatus === 'expired' && days !== null && days < 0 && (
                              <span className="font-medium text-red-500">
                                已过期 {Math.abs(days)} 天
                              </span>
                            )}
                          </div>
                          {temp.occupied > 0 && (
                            <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)]">
                              已占用 <span className="font-medium text-[var(--color-text-primary)]">{temp.occupied}</span> 人
                            </div>
                          )}
                          {/* V1.4：expiring 状态显示续约按钮 */}
                          {isExpiring && onExtend && (
                            <div className="mt-2 pt-2 border-t border-amber-200 flex justify-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  onExtend({
                                    establishmentId: temp.id,
                                    currentEndDate: temp.endDate,
                                    currentStartDate: temp.startDate,
                                    quota: temp.quota,
                                    occupied: temp.occupied,
                                    month: temp.month,
                                    departmentName: row?.departmentName || '',
                                    positionName: row?.positionName || '',
                                  })
                                }
                                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                续约
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* 块 C：变更历史摘要 */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <span>📋 变更历史</span>
                    <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                      ({loadingHistories ? '加载中' : `近 ${histories.length} 条`})
                    </span>
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleViewAll}>
                    查看全部
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                {loadingHistories ? (
                  <div className="flex items-center justify-center py-8 text-[var(--color-text-secondary)]">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    加载中...
                  </div>
                ) : histories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-[var(--color-text-secondary)] bg-[var(--color-surface-bg)] rounded-lg">
                    <FileText className="w-6 h-6 mb-2 opacity-50" />
                    <span className="text-sm">暂无变更记录</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {histories.map((h) => {
                      const statusInfo = HISTORY_STATUS_MAP[h.status] || HISTORY_STATUS_MAP.pending;
                      const changeAmount = h.newQuota - h.oldQuota;
                      const changeText = changeAmount > 0 ? `+${changeAmount}` : `${changeAmount}`;
                      return (
                        <div
                          key={h.id}
                          className="p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-bg)]"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {new Date(h.createdAt).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded border',
                                statusInfo.color,
                              )}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{h.oldQuota}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                            <span className="font-medium text-[var(--color-brand)]">{h.newQuota}</span>
                            <span
                              className={cn(
                                'text-xs',
                                changeAmount > 0 ? 'text-green-600' : 'text-red-600',
                              )}
                            >
                              ({changeText})
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
                              {REASON_MAP[h.reason] || h.reason}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                            申请人：{h.applicantName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] flex justify-end flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </>
  );
};