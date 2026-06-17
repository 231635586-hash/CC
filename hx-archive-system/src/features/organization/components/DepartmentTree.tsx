import { useCallback, useMemo, useState, memo } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { DepartmentTreeNode } from '../types';

interface DepartmentTreeProps {
  data: DepartmentTreeNode[];
  selectedId?: string;
  showActions?: boolean;
  showPositionCount?: boolean;
  positionCounts?: Record<string, number>;
  pendingApprovalCounts?: Record<string, number>;
  autoExpandAll?: boolean;
  searchKeyword?: string;
  highlightNodeIds?: Set<string>;
  onAddChild?: (parentNode: DepartmentTreeNode) => void;
  onEdit?: (node: DepartmentTreeNode) => void;
  onDelete?: (node: DepartmentTreeNode) => void;
  onSelect?: (node: DepartmentTreeNode) => void;
  onViewDetail?: (node: DepartmentTreeNode) => void;
}

interface TreeNodeProps {
  node: DepartmentTreeNode;
  level: number;
  selectedId?: string;
  showActions?: boolean;
  showPositionCount?: boolean;
  positionCounts?: Record<string, number>;
  pendingApprovalCounts?: Record<string, number>;
  isExpanded?: boolean;
  isNodeExpanded?: (nodeId: string) => boolean;
  searchKeyword?: string;
  highlight?: boolean;
  onToggle?: (nodeId: string) => void;
  onAddChild?: (parentNode: DepartmentTreeNode) => void;
  onEdit?: (node: DepartmentTreeNode) => void;
  onDelete?: (node: DepartmentTreeNode) => void;
  onSelect?: (node: DepartmentTreeNode) => void;
  onViewDetail?: (node: DepartmentTreeNode) => void;
}

// 高亮文本组件
const HighlightText = ({ text, keyword }: { text: string; keyword: string }) => {
  if (!keyword) {
    return <span>{text}</span>;
  }

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + keyword.length);
  const after = text.slice(index + keyword.length);

  return (
    <span>
      {before}
      <span className="bg-yellow-200 text-yellow-800 rounded px-0.5">{match}</span>
      {after}
    </span>
  );
};

const TreeNode = memo(({
  node,
  level,
  selectedId,
  showActions = true,
  showPositionCount = false,
  positionCounts = {},
  pendingApprovalCounts = {},
  isExpanded = true,
  isNodeExpanded,
  searchKeyword,
  highlight = false,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  onSelect,
  onViewDetail,
}: TreeNodeProps) => {
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = node.parentId === null;
  const isSelected = node.id === selectedId;
  const positionCount = positionCounts[node.id] || 0;
  const pendingCount = pendingApprovalCounts[node.id] || 0;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(node.id);
  }, [node.id, onToggle]);

  const handleClick = useCallback(() => {
    onSelect?.(node);
  }, [node, onSelect]);

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center h-11 px-3 group',
          'border-b border-[var(--color-border)] last:border-b-0',
          isSelected
            ? 'bg-[var(--color-brand-bg)] text-[var(--color-brand)]'
            : highlight
            ? 'bg-yellow-50'
            : 'hover:bg-[var(--color-surface-bg)]'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {/* 展开/折叠箭头 */}
        <div
          className={cn(
            'w-5 h-5 flex items-center justify-center mr-2',
            hasChildren ? 'cursor-pointer' : ''
          )}
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className={cn('w-4 h-4', isSelected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]')} />
            ) : (
              <ChevronRight className={cn('w-4 h-4', isSelected ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]')} />
            )
          ) : (
            <span className="w-4 h-4" />
          )}
        </div>

        {/* 节点名称 */}
        <div
          className={cn(
            'flex-1 text-sm cursor-pointer flex items-center gap-2',
            isRoot ? 'font-semibold' : '',
            isSelected ? 'text-[var(--color-brand)] font-medium' : 'text-[var(--color-text-secondary)]'
          )}
          onClick={() => {
            if (hasChildren) onToggle?.(node.id);
            handleClick();
          }}
        >
          <HighlightText text={node.name} keyword={searchKeyword || ''} />
          {showPositionCount && positionCount > 0 && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isSelected
                  ? 'bg-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)]'
              )}
            >
              {positionCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200'
              )}
              title="待审批"
            >
              {pendingCount}
            </span>
          )}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div
            className={cn(
              'flex items-center gap-1 transition-opacity',
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {!isRoot && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2',
                    isSelected ? 'text-[var(--color-brand)] hover:text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(node);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2',
                    isSelected ? 'text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(node);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2',
                isSelected ? 'text-[var(--color-brand)] hover:text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(node);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2',
                isSelected ? 'text-[var(--color-brand)] hover:text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail?.(node);
              }}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              showActions={showActions}
              showPositionCount={showPositionCount}
              positionCounts={positionCounts}
              pendingApprovalCounts={pendingApprovalCounts}
              isExpanded={isNodeExpanded ? isNodeExpanded(child.id) : true}
              isNodeExpanded={isNodeExpanded}
              searchKeyword={searchKeyword}
              highlight={highlight}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export const DepartmentTree = ({
  data,
  selectedId,
  showActions = true,
  showPositionCount = false,
  positionCounts = {},
  pendingApprovalCounts = {},
  autoExpandAll = false,
  searchKeyword,
  highlightNodeIds,
  onAddChild,
  onEdit,
  onDelete,
  onSelect,
  onViewDetail,
}: DepartmentTreeProps) => {
  // 用户手动展开的节点
  const [userExpandedKeys, setUserExpandedKeys] = useState(() => new Set<string>());

  // 计算展开的节点（合并自动展开和用户手动展开的节点）
  const expandedKeys = useMemo(() => {
    const keys = new Set<string>();

    const traverse = (nodes: DepartmentTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.add(node.id);
          traverse(node.children);
        }
      });
    };

    if (autoExpandAll) {
      traverse(data);
    } else {
      // 非自动展开模式时，只展开根节点
      data.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.add(node.id);
        }
      });
    }

    // 合并用户手动展开的节点
    userExpandedKeys.forEach((key) => keys.add(key));

    return keys;
  }, [autoExpandAll, data, userExpandedKeys]);

  const handleToggle = useCallback((nodeId: string) => {
    setUserExpandedKeys((prev) => {
      const newKeys = new Set(prev);
      if (newKeys.has(nodeId)) {
        newKeys.delete(nodeId);
      } else {
        newKeys.add(nodeId);
      }
      return newKeys;
    });
  }, []);

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-lg] bg-[var(--color-surface-card)] overflow-hidden">
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          showActions={showActions}
          showPositionCount={showPositionCount}
          positionCounts={positionCounts}
          pendingApprovalCounts={pendingApprovalCounts}
          isExpanded={expandedKeys.has(node.id)}
          isNodeExpanded={(nodeId) => expandedKeys.has(nodeId)}
          searchKeyword={searchKeyword}
          highlight={highlightNodeIds?.has(node.id) || false}
          onToggle={handleToggle}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
};