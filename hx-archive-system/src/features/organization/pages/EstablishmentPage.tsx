import { SearchIcon, ChevronDown, Plus, Upload, Edit3, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import {
  DepartmentTree,
  EstablishmentMatrix,
  EstablishmentApplyModal,
  EstablishmentHistoryPanel,
  EstablishmentBatchModal,
  EstablishmentCreateModal,
  BatchPreviewModal,
  EstablishmentHistoryModal,
  ApprovalRecordsModal,
  UnlockApplyModal,
  LockApplyModal,
  BatchLockModal,
} from '../components';
import { useEstablishment } from './EstablishmentPage.hooks';
import styles from './EstablishmentPage.module.css';

export const EstablishmentPage = () => {
  const {
    currentYear,
    setCurrentYear,
    departmentTree,
    selectedDepartmentId,
    matrixData,
    loading,
    searchKeyword,
    autoExpandAll,
    highlightNodeIds,
    pendingApprovalCounts,
    applyModalOpen,
    setApplyModalOpen,
    applyModalMode,
    applyCell,
    setApplyCell,
    historyPanelVisible,
    setHistoryPanelVisible,
    selectedEstablishmentId,
    selectedEstablishmentInfo,
    historyModalVisible,
    setHistoryModalVisible,
    historyModalData,
    approvalRecordsModalVisible,
    setApprovalRecordsModalVisible,
    unlockModalOpen,
    setUnlockModalOpen,
    unlockCell,
    setUnlockCell,
    lockModalOpen,
    setLockModalOpen,
    lockCell,
    setLockCell,
    selectingCellForLock,
    setSelectingCellForLock,
    batchSelectMode,
    setBatchSelectMode,
    selectedEstablishmentIds,
    setSelectedEstablishmentIds,
    batchLockModalOpen,
    setBatchLockModalOpen,
    batchLockModalMode,
    setBatchLockModalMode,
    batchModalOpen,
    setBatchModalOpen,
    batchModalType,
    setBatchModalType,
    createModalOpen,
    setCreateModalOpen,
    batchEditMode,
    modifiedCells,
    modifiedCellsCount,
    batchPreviewOpen,
    setBatchPreviewOpen,
    batchPreviewLoading,
    toasts,
    yearOptions,
    selectedDepartmentName,
    batchPreviews,
    loadMatrix,
    handleSearch,
    handleSelectDepartment,
    handleEdit,
    handleCreate,
    handleViewHistory,
    handleRowClick,
    handleApplySuccess,
    handleOpenCreate,
    handleOpenBatchAdjust,
    handleCancelBatchEdit,
    handleCellValueChange,
    handleSubmitBatchAdjust,
    handleConfirmBatchAdjust,
    handleBatchImport,
    handleCreateSuccess,
    removeToast,
  } = useEstablishment();

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>编制管理</h1>
          {selectedDepartmentName && (
            <span className="text-sm text-[var(--color-text-secondary)]">
              当前部门：{selectedDepartmentName}
            </span>
          )}
        </div>

        <div className={styles.pageHeaderRight}>
          {/* 年份选择 */}
          <div className={styles.yearSelectWrapper}>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className={styles.yearSelect}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
            <ChevronDown className={styles.yearSelectIcon} />
          </div>

          <Button variant="secondary" onClick={loadMatrix}>
            刷新
          </Button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          {batchEditMode ? (
            <>
              <div className={styles.batchEditBanner}>
                <span className={styles.batchEditTip}>
                  批量编辑模式 - 点击单元格直接修改名额
                </span>
              </div>
              <span className={styles.batchEditCount}>
                已修改 {modifiedCellsCount} 项
              </span>
              <Button variant="secondary" onClick={handleCancelBatchEdit}>
                取消
              </Button>
              <Button onClick={handleSubmitBatchAdjust}>提交调整</Button>
            </>
          ) : (
            <>
              {/* 审批记录 */}
              <Button variant="secondary" onClick={() => setApprovalRecordsModalVisible(true)}>
                审批记录
              </Button>

              {/* 锁定编制 */}
              <Button
                variant={selectingCellForLock ? 'primary' : 'secondary'}
                onClick={() => setSelectingCellForLock(!selectingCellForLock)}
              >
                <Lock className="w-4 h-4 mr-2" />
                {selectingCellForLock ? '选择中...' : '锁定编制'}
              </Button>

              {/* 批量选择 */}
              <Button
                variant={batchSelectMode ? 'primary' : 'secondary'}
                onClick={() => {
                  setBatchSelectMode(!batchSelectMode);
                  if (batchSelectMode) {
                    setSelectedEstablishmentIds(new Set());
                  }
                }}
              >
                {batchSelectMode ? `已选${selectedEstablishmentIds.size}项` : '批量选择'}
              </Button>

              {/* 批量锁定 */}
              {batchSelectMode && selectedEstablishmentIds.size > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBatchLockModalMode('lock');
                    setBatchLockModalOpen(true);
                  }}
                >
                  批量锁定
                </Button>
              )}

              {/* 批量解锁 */}
              {batchSelectMode && selectedEstablishmentIds.size > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBatchLockModalMode('unlock');
                    setBatchLockModalOpen(true);
                  }}
                >
                  批量解锁
                </Button>
              )}

              {/* 导入编制 */}
              <Button
                variant="secondary"
                onClick={() => {
                  setBatchModalType('create');
                  setBatchModalOpen(true);
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                导入编制
              </Button>

              {/* 批量调整 */}
              <Button variant="secondary" onClick={handleOpenBatchAdjust}>
                <Edit3 className="w-4 h-4 mr-2" />
                批量调整
              </Button>

              {/* 新增编制 */}
              <Button variant="secondary" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                新增编制
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 说明信息 */}
      <div className={styles.legendBar}>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotNormal}`} />
            <span className="text-[var(--color-text-secondary)]">充足（剩余 &gt; 20%）</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotWarning}`} />
            <span className="text-[var(--color-text-secondary)]">紧张（剩余 ≤ 20%）</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotDanger}`} />
            <span className="text-[var(--color-text-secondary)]">满编（剩余 ≤ 0）</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotEmpty}`} />
            <span className="text-[var(--color-text-secondary)]">无数据（虚线框）</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotLocking}`} />
            <span className="text-[var(--color-text-secondary)]">锁定中（待审批）</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotLocked}`} />
            <span className="text-[var(--color-text-secondary)]">已锁定（审批通过）</span>
          </div>
          <div className={styles.legendTip}>
            提示：双击单元格调整或创建编制，右键查看更多选项
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className={styles.contentArea}>
        {/* 左侧部门树 */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelSearch}>
            <Input
              placeholder="搜索部门..."
              prefixIcon={<SearchIcon className="w-4 h-4" />}
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className={styles.leftPanelTree}>
            <DepartmentTree
              data={departmentTree}
              selectedId={selectedDepartmentId}
              showActions={false}
              showPositionCount={false}
              pendingApprovalCounts={pendingApprovalCounts}
              autoExpandAll={autoExpandAll}
              searchKeyword={searchKeyword}
              highlightNodeIds={highlightNodeIds}
              onSelect={handleSelectDepartment}
            />
          </div>
        </div>

        {/* 右侧矩阵表格 */}
        <div className={styles.rightPanel}>
          <Card>
            <CardBody className="p-0">
              {loading ? (
                <div className={styles.loadingState}>加载中...</div>
              ) : matrixData.rows.length === 0 ? (
                <Empty
                  title="暂无编制数据"
                  description="点击下方按钮新增第一个编制"
                  actionLabel="新增编制"
                  onAction={handleOpenCreate}
                />
              ) : (
                <EstablishmentMatrix
                  headers={matrixData.headers}
                  rows={matrixData.rows}
                  batchEditMode={batchEditMode}
                  modifiedCells={modifiedCells}
                  onEdit={handleEdit}
                  onCreate={handleCreate}
                  onViewHistory={handleViewHistory}
                  onRowClick={handleRowClick}
                  onCellChange={handleCellValueChange}
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* 申请弹窗 */}
      {applyCell && (
        <EstablishmentApplyModal
          open={applyModalOpen}
          mode={applyModalMode}
          cell={applyCell}
          onClose={() => {
            setApplyModalOpen(false);
            setApplyCell(null);
          }}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* 历史面板 */}
      <EstablishmentHistoryPanel
        visible={historyPanelVisible}
        establishmentId={selectedEstablishmentId || ''}
        establishmentInfo={selectedEstablishmentInfo}
        onClose={() => setHistoryPanelVisible(false)}
      />

      {/* 批量操作弹窗 */}
      <EstablishmentBatchModal
        open={batchModalOpen}
        importType={batchModalType}
        onClose={() => setBatchModalOpen(false)}
        onImport={handleBatchImport}
      />

      {/* 新增编制弹窗 */}
      <EstablishmentCreateModal
        open={createModalOpen}
        departmentId={selectedDepartmentId || ''}
        departmentName={selectedDepartmentName || ''}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        currentYear={currentYear}
      />

      {/* 批量预览弹窗 */}
      <BatchPreviewModal
        open={batchPreviewOpen}
        previews={batchPreviews}
        onClose={() => setBatchPreviewOpen(false)}
        onConfirm={handleConfirmBatchAdjust}
        loading={batchPreviewLoading}
      />

      {/* 编制变更历史记录弹窗 */}
      <EstablishmentHistoryModal
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        establishmentId={historyModalData?.establishmentId}
        departmentName={historyModalData?.departmentName}
        positionName={historyModalData?.positionName}
      />

      {/* 审批记录弹窗 */}
      <ApprovalRecordsModal
        open={approvalRecordsModalVisible}
        onClose={() => setApprovalRecordsModalVisible(false)}
      />

      {/* 解锁申请弹窗 */}
      {unlockModalOpen && unlockCell && (
        <UnlockApplyModal
          open={unlockModalOpen}
          cell={unlockCell}
          onClose={() => {
            setUnlockModalOpen(false);
            setUnlockCell(null);
          }}
          onSuccess={() => {
            setUnlockModalOpen(false);
            setUnlockCell(null);
            loadMatrix();
          }}
        />
      )}

      {/* 锁定申请弹窗 */}
      <LockApplyModal
        open={lockModalOpen}
        cell={lockCell}
        onClose={() => {
          setLockModalOpen(false);
          setLockCell(null);
        }}
        onSuccess={() => {
          setLockModalOpen(false);
          setLockCell(null);
          loadMatrix();
        }}
      />

      {/* 批量锁定/解锁弹窗 */}
      <BatchLockModal
        open={batchLockModalOpen}
        mode={batchLockModalMode}
        selectedCount={selectedEstablishmentIds.size}
        onClose={() => setBatchLockModalOpen(false)}
        onSubmit={async (_reason, _durationType, _durationValue) => {
          showToast('批量操作已提交', 'success');
          setBatchSelectMode(false);
          setSelectedEstablishmentIds(new Set());
        }}
      />

      {/* Toast 提示 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};