import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SearchIcon, Download, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { Pagination } from '@/components/ui/Pagination';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { PositionList, PositionFormModal, PositionEmployeeModal, ImportModal } from '../components';
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  importPositions,
} from '../services/api';
import { fetchArchiveList } from '@/services/api';
import type { Position } from '../types';

// 职位员工列表项
interface PositionEmployeeItem {
  id: string;
  name: string;
  employeeNo: string;
  departmentName: string;
  joinDate: string;
}

const PAGE_SIZE = 10;

export const PositionPage = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  // 排序状态（默认按在职员工数降序）
  const [sortField, setSortField] = useState<'name' | 'employeeCount'>('employeeCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editPosition, setEditPosition] = useState<Position | null>(null);

  // 员工列表弹窗状态
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [positionEmployees, setPositionEmployees] = useState<PositionEmployeeItem[]>([]);
  const [positionEmployeesLoading, setPositionEmployeesLoading] = useState(false);

  // 用于取消上次请求的 ref 和请求 ID 防抖
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // 加载职位列表
  const loadPositions = useCallback((): Promise<void> => {
    // 取消上一次的请求
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    return getPositions()
      .then((res) => {
        // 忽略过期请求的响应
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        if (res.code === 0 && res.data) {
          setPositions(res.data);
          setDataVersion((v) => v + 1);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('加载职位失败', error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 初始化加载
  useEffect(() => {
    loadPositions();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [loadPositions]);

  // 搜索时重置页码
  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  // 排序处理
  const handleSort = (field: 'name' | 'employeeCount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 过滤并排序职位
  const filteredAndSortedPositions = useMemo(() => {
    let result = [...positions];

    // 搜索过滤
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(keyword));
    }

    // 排序
    result.sort((a, b) => {
      if (sortField === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const aCount = a.employeeCount ?? 0;
        const bCount = b.employeeCount ?? 0;
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      }
    });

    return result;
  }, [positions, searchKeyword, sortField, sortOrder]);

  // 分页数据
  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPositions.slice(start, start + pageSize);
  }, [filteredAndSortedPositions, currentPage, pageSize]);

  // 总页数变化时检查
  useEffect(() => {
    const totalPages = Math.ceil(filteredAndSortedPositions.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredAndSortedPositions.length, currentPage, pageSize]);

  // 每页条数变化时重置到第一页
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // 新增职位
  const handleAdd = useCallback(() => {
    setModalMode('create');
    setEditPosition(null);
    setModalOpen(true);
  }, []);

  // 编辑职位
  const handleEdit = useCallback((position: Position) => {
    setModalMode('edit');
    setEditPosition(position);
    setModalOpen(true);
  }, []);

  // 查看员工
  const handleViewEmployees = useCallback(async (position: Position) => {
    setSelectedPosition(position);
    setEmployeeModalOpen(true);
    setPositionEmployeesLoading(true);

    try {
      // 按职位名称搜索获取员工
      const res = await fetchArchiveList({
        page: 1,
        pageSize: 100,
      });

      if (res.list) {
        // 过滤出该职位的员工（只看在岗状态）
        const employees = res.list
          .filter((e) => e.positionName === position.name && e.status === 'active')
          .map((e) => ({
            id: e.id,
            name: e.name,
            employeeNo: e.employeeNo,
            departmentName: e.departmentName,
            joinDate: e.entryDate,
          }));
        setPositionEmployees(employees);

        // 同步更新职位列表中的员工数量（保持数据统一）
        setPositions((prev) =>
          prev.map((p) =>
            p.id === position.id ? { ...p, employeeCount: employees.length } : p
          )
        );
      }
    } catch (error) {
      console.error('加载员工列表失败', error);
    } finally {
      setPositionEmployeesLoading(false);
    }
  }, []);

  // 删除职位
  const handleDelete = useCallback(async (position: Position) => {
    if (!confirm(`确定要删除职位"${position.name}"吗？`)) {
      return;
    }

    const res = await deletePosition(position.id);
    if (res.code === 0) {
      await loadPositions();
      addToast(`职位"${position.name}"已删除`, 'success');
    } else {
      addToast(res.message || '删除失败', 'error');
    }
  }, [loadPositions, addToast]);

  // 提交表单
  const handleSubmit = async (name: string, description?: string) => {
    if (modalMode === 'create') {
      const res = await createPosition(name, description);
      if (res.code !== 0) {
        throw new Error(res.message || '创建失败');
      }
      addToast(`职位"${name}"创建成功`, 'success');
    } else {
      if (!editPosition) return;
      const res = await updatePosition(editPosition.id, name, description);
      if (res.code !== 0) {
        throw new Error(res.message || '更新失败');
      }
      addToast(`职位"${name}"更新成功`, 'success');
    }

    // 等待数据重新加载完成后再关闭弹窗
    await loadPositions();
  };

  // 关闭Modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditPosition(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">职位管理</h1>
          <span className="text-sm text-[var(--color-text-secondary)]">
            共 {filteredAndSortedPositions.length} 个职位
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            导入
          </Button>

          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>

          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增职位
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-bg)]">
        <div className="w-[320px]">
          <Input
            placeholder="搜索职位..."
            prefixIcon={<SearchIcon className="w-4 h-4" />}
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 职位列表 */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-[var(--color-text-secondary)]">加载中...</div>
              </div>
            ) : filteredAndSortedPositions.length === 0 ? (
              <Empty
                title="暂无职位数据"
                description={searchKeyword ? "没有搜索到匹配的职位" : "点击下方按钮新增第一个职位"}
                actionLabel="新增职位"
                onAction={handleAdd}
              />
            ) : (
              <PositionList
                key={dataVersion}
                positions={paginatedPositions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddPosition={handleAdd}
                onViewEmployees={handleViewEmployees}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* 分页 */}
      <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredAndSortedPositions.length}
          onChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* 表单弹窗 */}
      <PositionFormModal
        open={modalOpen}
        mode={modalMode}
        editPosition={editPosition}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* 员工列表弹窗 */}
      <PositionEmployeeModal
        open={employeeModalOpen}
        position={selectedPosition}
        employees={positionEmployees}
        loading={positionEmployeesLoading}
        onClose={() => {
          setEmployeeModalOpen(false);
          setSelectedPosition(null);
        }}
      />

      {/* 导入弹窗 */}
      <ImportModal
        open={importModalOpen}
        title="职位导入"
        templateColumns={['职位名称', '职位说明']}
        templateData={[
          ['前端开发工程师', '负责前端开发工作'],
          ['后端开发工程师', '负责后端开发工作'],
        ]}
        onClose={() => setImportModalOpen(false)}
        onImport={async (data) => {
          const result = await importPositions(
            data.map((row: any) => ({
              positionName: row['职位名称'],
              description: row['职位说明'] || '',
            }))
          );
          if (result.success > 0) {
            loadPositions();
          }
          return result;
        }}
      />

      {/* Toast 提示 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};