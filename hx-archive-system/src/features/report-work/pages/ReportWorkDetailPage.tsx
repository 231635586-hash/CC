import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody, Button, Input } from '@/components/ui';
import { useReportWorkStore } from '../store';
import { fetchReportById, updateReportRecord } from '../services/api';
import type { ShiftType } from '@/types';
import { ArrowLeftIcon, EditIcon } from 'lucide-react';
import { shiftTypeOptions, mockApprovers, mockReportPoints } from '../services/mockData';

export function ReportWorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentReport, setCurrentReport } = useReportWorkStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<{
    shiftType: ShiftType;
    reportPoint: string;
    reportTime: string;
    approverId: string;
    modifyReason: string;
  }>({
    shiftType: '白班',
    reportPoint: '',
    reportTime: '',
    approverId: '',
    modifyReason: '',
  });

  useEffect(() => {
    if (id) {
      fetchReportById(id).then((data) => {
        if (data) {
          setCurrentReport(data);
          setEditData({
            shiftType: data.shiftType,
            reportPoint: data.reportPoint,
            reportTime: data.reportTime || '',
            approverId: '',
            modifyReason: '',
          });
        }
      });
    }
  }, [id, setCurrentReport]);

  const handleBack = () => {
    navigate('/report-work');
  };

  const handleStartSupplement = () => {
    navigate(`/report-work/supplement/${currentReport?.date}`);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editData.modifyReason.trim()) {
      alert('请填写修改原因');
      return;
    }
    if (!id) return;

    const success = await updateReportRecord(id, {
      shiftType: editData.shiftType,
      reportPoint: editData.reportPoint,
      reportTime: editData.reportTime,
      modifyReason: editData.modifyReason,
    });

    if (success) {
      alert('保存成功');
      setShowEditModal(false);
      // 刷新数据
      fetchReportById(id).then(setCurrentReport);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    // 恢复原数据
    if (currentReport) {
      setEditData({
        shiftType: currentReport.shiftType,
        reportPoint: currentReport.reportPoint,
        reportTime: currentReport.reportTime || '',
        approverId: '',
        modifyReason: '',
      });
    }
  };

  const getStatusBadge = (status: string) => {
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

  if (!currentReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />} onClick={handleBack}>
            返回
          </Button>
          <h1 className="text-xl font-semibold text-text-primary">报工详情</h1>
        </div>
        <Button variant="secondary" size="sm" icon={<EditIcon className="w-4 h-4" />} onClick={handleEditClick}>
          编辑
        </Button>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">日期</span>
              <span className="font-medium">{currentReport.date}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">姓名</span>
              <span className="font-medium">{currentReport.employeeName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">部门/班组</span>
              <span className="font-medium">{currentReport.departmentName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">班次</span>
              <span className="font-medium">{currentReport.shiftType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">报工点</span>
              <span className="font-medium">{currentReport.reportPoint || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">报工时间</span>
              <span className="font-medium">{currentReport.reportTime || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">报工方式</span>
              <span className={currentReport.reportMethod === '补报' ? 'text-warning font-medium' : 'font-medium'}>
                {currentReport.reportMethod}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">状态</span>
              {getStatusBadge(currentReport.status)}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 操作历史卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>操作历史</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1 h-full bg-brand rounded-full" />
              <div className="flex-1">
                <div className="text-sm text-text-secondary mb-1">
                  {currentReport.reportTime || currentReport.updatedAt}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{currentReport.employeeName}</span>
                  <span className="text-text-secondary"> 扫码报到</span>
                  {currentReport.reportPoint && (
                    <>
                      <span className="text-text-secondary">，报工点：</span>
                      <span className="font-medium">{currentReport.reportPoint}</span>
                    </>
                  )}
                  <span className="text-text-secondary">，班次：</span>
                  <span className="font-medium">{currentReport.shiftType}</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 底部操作栏 - 仅未完成的记录显示补报按钮 */}
      {currentReport.status === '未完成' && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleStartSupplement}>
            发起补报
          </Button>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4">编辑报工记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">班次</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-bg text-text-primary"
                  value={editData.shiftType}
                  onChange={(e) => setEditData({ ...editData, shiftType: e.target.value as ShiftType })}
                >
                  {shiftTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">报工点</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-bg text-text-primary"
                  value={editData.reportPoint}
                  onChange={(e) => setEditData({ ...editData, reportPoint: e.target.value })}
                >
                  <option value="">请选择报工点</option>
                  {mockReportPoints.map((point) => (
                    <option key={point.id} value={point.name}>{point.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">审批班长</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-bg text-text-primary"
                  value={editData.approverId}
                  onChange={(e) => setEditData({ ...editData, approverId: e.target.value })}
                >
                  <option value="">请选择审批班长</option>
                  {mockApprovers.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name}（{approver.department}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">报工时间</label>
                <Input
                  type="datetime-local"
                  value={editData.reportTime}
                  onChange={(e) => setEditData({ ...editData, reportTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  修改原因 <span className="text-danger">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface-bg text-text-primary resize-none"
                  rows={3}
                  value={editData.modifyReason}
                  onChange={(e) => setEditData({ ...editData, modifyReason: e.target.value })}
                  placeholder="请输入修改原因（必填）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={handleCancelEdit}>
                取消
              </Button>
              <Button onClick={handleSaveEdit}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}