import { useState, useEffect, useCallback } from 'react';
import { List, Network, Download, Upload, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { Empty } from '@/components/ui/Empty';
import { DepartmentTree, DepartmentMindMap, DepartmentFormModal, DepartmentDetailPanel, ImportModal } from '../components';
import {
  getDepartmentTree,
  getMindMapData,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentFullPath,
  getPositions,
  importDepartments,
} from '../services/api';
import type { DepartmentTreeNode, MindMapNode, DepartmentFormData } from '../types';

type ViewMode = 'list' | 'mindmap';

export const DepartmentPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [treeData, setTreeData] = useState<DepartmentTreeNode[]>([]);
  const [mindMapData, setMindMapData] = useState<MindMapNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // 导入弹窗状态
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Modal状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedParentNode, setSelectedParentNode] = useState<DepartmentTreeNode | null>(null);
  const [parentFullPath, setParentFullPath] = useState<string>('');
  const [editNode, setEditNode] = useState<DepartmentTreeNode | null>(null);
  const [editFullPath, setEditFullPath] = useState<string>('');

  // 详情面板状态
  const [detailPanelVisible, setDetailPanelVisible] = useState(false);
  const [detailDepartment, setDetailDepartment] = useState<DepartmentTreeNode | null>(null);
  const [detailPositionCount, setDetailPositionCount] = useState(0);
  const [detailEstablishmentCount, setDetailEstablishmentCount] = useState(0);

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, mindmapRes] = await Promise.all([
        getDepartmentTree(),
        getMindMapData(),
      ]);

      if (treeRes.code === 0 && treeRes.data) {
        setTreeData(treeRes.data);
      }
      if (mindmapRes.code === 0 && mindmapRes.data) {
        setMindMapData(mindmapRes.data);
      }
    } catch (error) {
      console.error('加载部门数据失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // 新增子部门
  const handleAddChild = useCallback((parentNode: DepartmentTreeNode) => {
    setModalMode('create');
    setSelectedParentNode(parentNode);
    setParentFullPath(getDepartmentFullPath(parentNode.id));
    setEditNode(null);
    setEditFullPath('');
    setModalOpen(true);
  }, []);

  // 编辑
  const handleEdit = useCallback((node: DepartmentTreeNode) => {
    setModalMode('edit');
    setEditNode(node);
    setEditFullPath(getDepartmentFullPath(node.id));
    setSelectedParentNode(null);
    setParentFullPath('');
    setModalOpen(true);
  }, []);

  // 删除
  const handleDelete = useCallback(async (node: DepartmentTreeNode) => {
    if (!confirm(`确定要删除部门"${node.name}"吗？`)) {
      return;
    }

    const res = await deleteDepartment(node.id);
    if (res.code === 0) {
      handleRefresh();
    } else {
      alert(res.message || '删除失败');
    }
  }, [handleRefresh]);

  // 思维导图双击编辑
  const handleMindMapDoubleClick = useCallback((node: MindMapNode) => {
    const findTreeNode = (nodes: DepartmentTreeNode[], id: string): DepartmentTreeNode | undefined => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findTreeNode(n.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    const treeNode = findTreeNode(treeData, node.id);
    if (treeNode) {
      handleEdit(treeNode);
    }
  }, [treeData, handleEdit]);

  //提交表单 - 新增后不刷新，直接更新本地状态
  const handleSubmit = async (data: DepartmentFormData) => {
    if (modalMode === 'create') {
      const res = await createDepartment(data);
      if (res.code !== 0) {
        throw new Error(res.message || '创建失败');
      }
      // 直接更新本地数据，不刷新
      const treeRes = await getDepartmentTree();
      if (treeRes.code === 0 && treeRes.data) {
        setTreeData(treeRes.data);
      }
      const mindmapRes = await getMindMapData();
      if (mindmapRes.code === 0 && mindmapRes.data) {
        setMindMapData(mindmapRes.data);
      }
    } else {
      if (!editNode) return;
      const res = await updateDepartment(editNode.id, data);
      if (res.code !== 0) {
        throw new Error(res.message || '更新失败');
      }
      // 直接更新本地数据，不刷新
      const treeRes = await getDepartmentTree();
      if (treeRes.code === 0 && treeRes.data) {
        setTreeData(treeRes.data);
      }
      const mindmapRes = await getMindMapData();
      if (mindmapRes.code === 0 && mindmapRes.data) {
        setMindMapData(mindmapRes.data);
      }
    }
    // 成功后清除选中状态
    setSelectedId(undefined);
  };

  // 关闭Modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedParentNode(null);
    setParentFullPath('');
    setEditNode(null);
    setEditFullPath('');
  }, []);

  // 查看详情
  const handleViewDetail = useCallback(async (node: DepartmentTreeNode) => {
    setDetailDepartment(node);
    setDetailPanelVisible(true);

    // 获取职位数量（该部门及其子部门的职位）
    const posRes = await getPositions(node.id);
    if (posRes.code === 0 && posRes.data) {
      setDetailPositionCount(posRes.data.length);
    }

    // 编制数量暂时模拟（实际需要从编制管理模块获取）
    setDetailEstablishmentCount(0);
  }, []);

  // 跳转到部门
  const handleNavigateDepartment = useCallback((departmentId: string) => {
    setSelectedId(departmentId);
    // 重新加载详情数据
    const node = treeData.find(n => n.id === departmentId);
    if (node) {
      setDetailDepartment(node);
      setDetailPositionCount(0);
      setDetailEstablishmentCount(0);
    }
  }, [treeData]);

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">部门管理</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* 视图切换 */}
          <div className="flex items-center border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
            <button
              className={`flex items-center gap-1.5 px-3 h-8 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)]'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              列表视图
            </button>
            <button
              className={`flex items-center gap-1.5 px-3 h-8 text-sm transition-colors ${
                viewMode === 'mindmap'
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)]'
              }`}
              onClick={() => setViewMode('mindmap')}
            >
              <Network className="w-4 h-4" />
              架构图
            </button>
          </div>

          <Button onClick={handleRefresh} variant="secondary">
            刷新
          </Button>

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
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-bg)]">
        <div className="w-[320px]">
          <Input
            placeholder="搜索部门..."
            prefixIcon={<SearchIcon className="w-4 h-4" />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--color-text-secondary)]">加载中...</div>
          </div>
        ) : viewMode === 'list' ? (
          <Card>
            <CardBody className="p-0">
              {treeData.length > 0 ? (
                <DepartmentTree
                  data={treeData}
                  selectedId={selectedId}
                  searchKeyword={searchKeyword}
                  onAddChild={handleAddChild}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSelect={(node) => setSelectedId(node.id)}
                  onViewDetail={handleViewDetail}
                />
              ) : (
                <Empty description="暂无部门数据" />
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="p-0">
              {mindMapData.length > 0 ? (
                <DepartmentMindMap
                  data={mindMapData}
                  selectedId={selectedId}
                  onNodeClick={(node) => setSelectedId(node.id)}
                  onNodeDoubleClick={handleMindMapDoubleClick}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* 表单弹窗 */}
      <DepartmentFormModal
        open={modalOpen}
        mode={modalMode}
        parentNode={selectedParentNode}
        parentFullPath={parentFullPath}
        editNode={editNode}
        editFullPath={editFullPath}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      {/* 导入弹窗 */}
      <ImportModal
        open={importModalOpen}
        title="部门导入"
        templateColumns={['部门名称', '上级部门路径']}
        templateData={[
          ['华翔科技', '华翔集团'],
          ['研发部', '华翔集团/华翔科技'],
        ]}
        onClose={() => setImportModalOpen(false)}
        onImport={async (data) => {
          const result = await importDepartments(
            data.map((row: any) => ({
              departmentName: row['部门名称'],
              parentDepartmentPath: row['上级部门路径'],
            }))
          );
          if (result.success > 0) {
            handleRefresh();
          }
          return result;
        }}
      />

      {/* 详情面板 */}
      <DepartmentDetailPanel
        visible={detailPanelVisible}
        department={detailDepartment}
        positionCount={detailPositionCount}
        establishmentCount={detailEstablishmentCount}
        onClose={() => setDetailPanelVisible(false)}
        onNavigateDepartment={handleNavigateDepartment}
      />
    </div>
  );
};