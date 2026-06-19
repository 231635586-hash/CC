import { Plus, Upload, CheckSquare, ChevronDown, ChevronRight, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { ToastContainer, showToast } from '@/components/ui/Toast';
import { useState } from 'react';
import {
  DepartmentTree,
  EstablishmentMatrix,
  EstablishmentApplyModal,
  EstablishmentHistoryPanel,
  EstablishmentBatchModal,
  EstablishmentCreateModal,
  BatchPreviewModal,
  EstablishmentHistoryModal,
  EstablishmentDetailDrawer,
  EstablishmentExtendModal,
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
    // V1.4 编制详情 Drawer
    establishmentDetailVisible,
    setEstablishmentDetailVisible,
    establishmentDetailRow,
    // V1.4 按职位维度历史
    historyByPositionVisible,
    setHistoryByPositionVisible,
    historyByPositionData,
    handleViewAllHistory,
    // V1.4 临时编制续约
    extendModalOpen,
    setExtendModalOpen,
    extendContext,
    setExtendContext,
    handleExtendClick,
    handleExtendSuccess,
    unlockModalOpen,
    setUnlockModalOpen,
    unlockCell,
    setUnlockCell,
    lockModalOpen,
    setLockModalOpen,
    lockCell,
    setLockCell,
    batchSelectMode,
    setBatchSelectMode,
    selectedEstablishmentIds,
    setSelectedEstablishmentIds,
    batchSelectionInfo,
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
    filteredRows,
    summaryStats,
    positionSearchKeyword,
    setPositionSearchKeyword,
    handleSearch,
    handleSelectDepartment,
    handleEdit,
    handleCreate,
    handleViewHistory,
    handleRowClick,
    handleApplySuccess,
    handleOpenCreate,
    handleCancelBatchEdit,
    handleCellSelect,
    handleSelectAll,
    handleCellValueChange,
    handleSubmitBatchAdjust,
    handleConfirmBatchAdjust,
    handleBatchImport,
    handleCreateSuccess,
    removeToast,
  } = useEstablishment();

  // 图例折叠状态
  const [legendCollapsed, setLegendCollapsed] = useState(false);

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
          <Select
            options={yearOptions.map((year) => ({ value: String(year), label: `${year}年` }))}
            value={String(currentYear)}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="w-[100px]"
          />

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
          ) : batchSelectMode ? (
            <>
              <div className={styles.batchEditBanner}>
                <span className={styles.batchEditTip}>
                  批量选择模式 - 点击单元格选择，已锁定和锁定中的单元格不可选
                </span>
              </div>
              <span className={styles.batchEditCount}>
                已选 {batchSelectionInfo.total} 项
              </span>

              {/* 批量操作按钮：根据选中状态显示 */}
              {batchSelectionInfo.hasUnlocked && (
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
              {batchSelectionInfo.hasLocked && (
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

              <Button variant="secondary" onClick={() => {
                setBatchSelectMode(false);
                setSelectedEstablishmentIds(new Set());
              }}>
                取消
              </Button>
              <Button variant="secondary" onClick={handleSelectAll}>
                全选
              </Button>
            </>
          ) : (
            <>
              {/* 审批记录 */}
              <Button variant="secondary" onClick={() => setApprovalRecordsModalVisible(true)}>
                <History className="w-4 h-4 mr-2" />
                审批流程
              </Button>

              {/* 批量操作 */}
              <Button
                variant="secondary"
                onClick={() => setBatchSelectMode(true)}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                批量锁定/解锁
              </Button>

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

              {/* 新增编制 */}
              <Button variant="secondary" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-2" />
                新增编制
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 说明信息 - 可折叠 */}
      <div className={styles.legendBar}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLegendCollapsed(!legendCollapsed)}
              className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              {legendCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              图例
            </button>
            {!legendCollapsed && (
              <>
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
                  <span className="text-[var(--color-text-secondary)]">无数据</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotLocking}`} />
                  <span className="text-[var(--color-text-secondary)]">锁定中（待审批）</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotLocked}`} />
                  <span className="text-[var(--color-text-secondary)]">已锁定（审批通过）</span>
                </div>
              </>
            )}
          </div>
          {!legendCollapsed && (
            <span className="text-xs text-[var(--color-text-disabled)]">
              提示：双击单元格调整或创建编制，右键查看更多选项
            </span>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className={styles.contentArea}>
        {/* 左侧部门树 */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelSearch}>
            <SearchInput
              placeholder="搜索部门..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              className="w-[200px]"
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
              ) : !selectedDepartmentId ? (
                <Empty
                  title="请选择部门"
                  description="从左侧部门树选择一个部门查看编制信息"
                />
              ) : matrixData.rows.length === 0 ? (
                <Empty
                  title="暂无编制数据"
                  description="点击下方按钮新增第一个编制"
                  actionLabel="新增编制"
                  onAction={handleOpenCreate}
                />
              ) : (
                <>
                  {/* 汇总统计栏 */}
                  {!batchEditMode && !batchSelectMode && (
                    <div className="flex items-center gap-6 px-4 py-3 bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">总编制</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{summaryStats.totalQuota}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">已占用</span>
                        <span className="text-sm font-semibold text-[var(--color-status-warning)]">{summaryStats.totalOccupied}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">剩余</span>
                        <span className="text-sm font-semibold text-[var(--color-status-success)]">{summaryStats.totalRemaining}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-secondary)]">占用率</span>
                        <span className={`text-sm font-semibold ${summaryStats.occupancyRate >= 90 ? 'text-[var(--color-status-danger)]' : summaryStats.occupancyRate >= 70 ? 'text-[var(--color-status-warning)]' : 'text-[var(--color-status-success)]'}`}>
                          {summaryStats.occupancyRate}%
                        </span>
                      </div>
                      {/* 职位搜索 */}
                      <div className="ml-auto">
                        <SearchInput
                          placeholder="搜索职位..."
                          value={positionSearchKeyword}
                          onChange={(e) => setPositionSearchKeyword(e.target.value)}
                          onSearch={(val) => setPositionSearchKeyword(val)}
                          className="w-[160px]"
                        />
                      </div>
                    </div>
                  )}
                  {filteredRows.length === 0 && positionSearchKeyword ? (
                    <Empty
                      title="未找到匹配的职位"
                      description={`没有职位名称包含"${positionSearchKeyword}"的记录`}
                    />
                  ) : (
                    <EstablishmentMatrix
                      headers={matrixData.headers}
                      rows={filteredRows}
                      batchEditMode={batchEditMode}
                      modifiedCells={modifiedCells}
                      onEdit={handleEdit}
                      onCreate={handleCreate}
                      onViewHistory={handleViewHistory}
                      onRowClick={handleRowClick}
                      onCellChange={handleCellValueChange}
                      batchSelectMode={batchSelectMode}
                      selectedCellIds={selectedEstablishmentIds}
                      onCellSelect={handleCellSelect}
                    />
                  )}
                </>
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

      {/* 编制变更历史记录弹窗（单编制单元模式 - 右键菜单触发）*/}
      <EstablishmentHistoryModal
        open={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        mode="byCell"
        establishmentId={historyModalData?.establishmentId}
        departmentName={historyModalData?.departmentName}
        positionName={historyModalData?.positionName}
      />

      {/* V1.4 编制详情 Drawer（点击职位行触发）*/}
      <EstablishmentDetailDrawer
        visible={establishmentDetailVisible}
        row={establishmentDetailRow}
        year={currentYear}
        onClose={() => setEstablishmentDetailVisible(false)}
        onViewAllHistory={handleViewAllHistory}
        onExtend={handleExtendClick}
      />

      {/* V1.4 临时编制续约弹窗（Drawer 块 B 的【续约】按钮触发）*/}
      {extendModalOpen && extendContext && (
        <EstablishmentExtendModal
          open={extendModalOpen}
          establishmentId={extendContext.establishmentId}
          departmentName={extendContext.departmentName}
          positionName={extendContext.positionName}
          currentEndDate={extendContext.currentEndDate}
          currentStartDate={extendContext.currentStartDate}
          quota={extendContext.quota}
          occupied={extendContext.occupied}
          month={extendContext.month}
          year={currentYear}
          onClose={() => {
            setExtendModalOpen(false);
            setExtendContext(null);
          }}
          onSuccess={handleExtendSuccess}
        />
      )}

      {/* V1.4 按职位维度查看历史（Drawer 内"查看全部"按钮触发）*/}
      <EstablishmentHistoryModal
        open={historyByPositionVisible}
        onClose={() => setHistoryByPositionVisible(false)}
        mode="byPosition"
        departmentId={historyByPositionData?.departmentId}
        positionId={historyByPositionData?.positionId}
        year={historyByPositionData?.year}
        departmentName={historyByPositionData?.departmentName}
        positionName={historyByPositionData?.positionName}
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