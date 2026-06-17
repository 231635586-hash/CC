import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { RankList, RankFormModal } from '../components';
import {
  getRanks,
  createRank,
  updateRank,
  deleteRank,
} from '../services/api';
import type { Rank, RankTrackType, RankLevelType } from '../types';

const PAGE_SIZE = 10;

export const RankPage = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [allRanks, setAllRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');

  // 筛选状态
  const [trackFilter, setTrackFilter] = useState<RankTrackType | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<RankLevelType | 'all'>('all');

  // Modal状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editRank, setEditRank] = useState<Rank | null>(null);

  // 加载职级列表（全部数据，用于前端分页）
  const loadRanks = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getRanks(trackFilter, levelFilter, searchKeyword);
      if (res.code === 0 && res.data) {
        setAllRanks(res.data);
        setDataVersion((v) => v + 1);
        setCurrentPage(1); // 重置到第一页
      }
    } catch (error) {
      console.error('加载职级列表失败', error);
    } finally {
      setLoading(false);
    }
  }, [trackFilter, levelFilter, searchKeyword]);

  // 初始化加载
  useEffect(() => {
    loadRanks();
  }, [loadRanks]);

  // 计算分页数据
  const paginatedRanks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return allRanks.slice(start, end);
  }, [allRanks, currentPage, pageSize]);

  // 序列选项
  const trackOptions: { value: RankTrackType | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'admin', label: '职能部门' },
    { value: 'tech', label: '技术部门' },
    { value: 'factory', label: '工厂' },
  ];

  // 职层选项
  const levelOptions: { value: RankLevelType | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'high', label: '高层' },
    { value: 'middle', label: '中层' },
    { value: 'low', label: '基层' },
  ];

  // 新增职级
  const handleAdd = useCallback(() => {
    setModalMode('create');
    setEditRank(null);
    setModalOpen(true);
  }, []);

  // 编辑职级
  const handleEdit = useCallback((rank: Rank) => {
    setModalMode('edit');
    setEditRank(rank);
    setModalOpen(true);
  }, []);

  // 删除职级
  const handleDelete = useCallback(async (rank: Rank) => {
    if (!confirm(`确定要删除职级"${rank.name}"吗？`)) {
      return;
    }

    const res = await deleteRank(rank.id);
    if (res.code === 0) {
      await loadRanks();
      addToast(`职级"${rank.name}"已删除`, 'success');
    } else {
      addToast(res.message || '删除失败', 'error');
    }
  }, [loadRanks, addToast]);

  // 提交表单
  const handleSubmit = async (data: { code: string; name: string; track: RankTrackType; level: RankLevelType }) => {
    if (modalMode === 'create') {
      const res = await createRank(data);
      if (res.code !== 0) {
        throw new Error(res.message || '创建失败');
      }
      addToast(`职级"${data.name}"创建成功`, 'success');
    } else {
      if (!editRank) return;
      const res = await updateRank(editRank.id, data);
      if (res.code !== 0) {
        throw new Error(res.message || '更新失败');
      }
      addToast(`职级"${data.name}"更新成功`, 'success');
    }

    await loadRanks();
  };

  // 关闭Modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditRank(null);
  }, []);

  // 分页变化时调整页码
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 每页条数变化时重置
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">职级管理</h1>
          <span className="text-sm text-[var(--color-text-secondary)]">
            共 {allRanks.length} 个职级
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadRanks}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增职级
          </Button>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-bg)]">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <SearchInput
            placeholder="搜索职级代码或职务名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={(val) => setSearchKeyword(val)}
            className="w-[200px]"
          />

          {/* 职务划分筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)] shrink-0">职务序列:</span>
            <Select
              options={trackOptions}
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value as RankTrackType | 'all')}
              className="w-[140px]"
            />
          </div>

          {/* 职层筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)] shrink-0">职层:</span>
            <Select
              options={levelOptions}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as RankLevelType | 'all')}
              className="w-[140px]"
            />
          </div>
        </div>
      </div>

      {/* 职级列表 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <Card>
            <CardBody className="p-8">
              <div className="flex items-center justify-center h-64">
                <div className="text-[var(--color-text-secondary)]">加载中...</div>
              </div>
            </CardBody>
          </Card>
        ) : allRanks.length === 0 ? (
          <Empty
            title="暂无职级数据"
            description="点击下方按钮新增第一个职级"
            actionLabel="新增职级"
            onAction={handleAdd}
          />
        ) : (
          <RankList
            key={dataVersion}
            ranks={paginatedRanks}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddRank={handleAdd}
          />
        )}
      </div>

      {/* 分页栏 */}
      {!loading && allRanks.length > 0 && (
        <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-card)]">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={allRanks.length}
            onChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}

      {/* 表单弹窗 */}
      <RankFormModal
        open={modalOpen}
        mode={modalMode}
        editRank={editRank}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* Toast 提示 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};