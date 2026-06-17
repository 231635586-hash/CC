import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { MindMapNode } from '../types';

interface DepartmentMindMapProps {
  data: MindMapNode[];
  selectedId?: string;
  onNodeDoubleClick?: (node: MindMapNode) => void;
  onNodeClick?: (node: MindMapNode) => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 44;
const LEVEL_GAP = 180;
const NODE_GAP = 70;
const MIN_CANVAS_WIDTH = 1200;
const MIN_CANVAS_HEIGHT = 600;

export const DepartmentMindMap = ({ data, selectedId, onNodeDoubleClick, onNodeClick }: DepartmentMindMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // 画布平移状态
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // 计算初始布局
  useEffect(() => {
    if (!data || data.length === 0) return;

    const newPositions = new Map<string, { x: number; y: number }>();

    // 递归计算节点尺寸（返回节点及其子树占用的总高度）
    const calculateSize = (node: MindMapNode): number => {
      const children = node.children || [];
      if (children.length === 0) return NODE_HEIGHT;

      let totalHeight = 0;
      children.forEach((child) => {
        totalHeight += calculateSize(child) + NODE_GAP;
      });
      totalHeight -= NODE_GAP; // 减去最后一个间隔
      return Math.max(totalHeight, NODE_HEIGHT);
    };

    // 递归布局节点
    const layoutNode = (node: MindMapNode, x: number, y: number): void => {
      // 先计算当前节点的大小
      const children = node.children || [];
      let totalChildHeight = 0;

      if (children.length > 0) {
        // 先计算所有子节点的大小
        const childSizes: number[] = [];
        children.forEach((child) => {
          childSizes.push(calculateSize(child));
        });

        // 计算子节点应该放置的起始Y（从顶部开始排列）
        let currentChildY = y;
        children.forEach((child, index) => {
          const childHeight = childSizes[index];
          // 递归布局子节点
          layoutNode(child, x + LEVEL_GAP, currentChildY);
          currentChildY += childHeight + NODE_GAP;
        });

        // 计算所有子节点占用的总高度
        totalChildHeight = currentChildY - y - NODE_GAP;
      }

      // 设置当前节点位置（居中对齐子节点）
      const nodeY = children.length > 0
        ? y + (totalChildHeight - NODE_HEIGHT) / 2
        : y;
      newPositions.set(node.id, { x, y: nodeY });
    };

    // 从同一起始Y开始布局所有根节点
    let currentY = 50;
    data.forEach((node) => {
      layoutNode(node, 100, currentY);
      currentY += calculateSize(node) + NODE_GAP;
    });

    setPositions(newPositions);
  }, [data]);

  // 画布拖动开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target === e.currentTarget ||
      target.tagName === 'svg' ||
      target.tagName === 'path' ||
      target.tagName === 'rect' ||
      target.tagName === 'text'
    ) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  // 画布拖动中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  }, [isPanning, startPan]);

  // 画布拖动结束
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // 绘制连接线
  const renderLines = () => {
    const lines: React.ReactElement[] = [];

    const drawLines = (node: MindMapNode) => {
      const parentPos = positions.get(node.id);
      if (!parentPos) return;

      const children = node.children || [];
      children.forEach((child) => {
        const childPos = positions.get(child.id);
        if (childPos && parentPos) {
          const startX = parentPos.x + NODE_WIDTH;
          const startY = parentPos.y + NODE_HEIGHT / 2;
          const endX = childPos.x;
          const endY = childPos.y + NODE_HEIGHT / 2;

          const midX = startX + (endX - startX) / 2;

          lines.push(
            <path
              key={`${node.id}-${child.id}`}
              d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
              stroke="var(--color-border)"
              strokeWidth={2}
              fill="none"
            />
          );

          drawLines(child);
        }
      });
    };

    data.forEach(drawLines);
    return lines;
  };

  const getCanvasSize = () => {
    let maxX = 0;
    let maxY = 0;
    positions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });

    // 动态计算 + 最小尺寸
    const calculatedWidth = maxX + NODE_WIDTH + 100;
    const calculatedHeight = maxY + NODE_HEIGHT + 100;

    return {
      width: Math.max(calculatedWidth, MIN_CANVAS_WIDTH),
      height: Math.max(calculatedHeight, MIN_CANVAS_HEIGHT),
    };
  };

  const canvasSize = getCanvasSize();

  return (
    <div
      ref={containerRef}
      className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-bg)]"
      style={{ minHeight: 400, cursor: isPanning ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <svg width={canvasSize.width} height={canvasSize.height} className="min-w-full">
          {renderLines()}

          {Array.from(positions.entries()).map(([id, pos]) => {
            const findNode = (nodes: MindMapNode[]): MindMapNode | undefined => {
              for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                  const found = findNode(node.children);
                  if (found) return found;
                }
              }
              return undefined;
            };

            const node = findNode(data);
            if (!node) return null;

            const isRoot = node.parentId === null;
            const isSelected = node.id === selectedId;

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onNodeClick?.(node)}
                onDoubleClick={() => onNodeDoubleClick?.(node)}
                className="cursor-pointer"
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={8}
                  ry={8}
                  fill={isSelected ? 'var(--color-brand-light)' : 'white'}
                  stroke={isSelected ? 'var(--color-brand)' : isRoot ? 'var(--color-brand)' : 'var(--color-border)'}
                  strokeWidth={isSelected ? 2 : isRoot ? 2 : 1}
                  style={isSelected ? { filter: 'drop-shadow(0 4px 16px oklch(48% 0.14 235 / 0.2))' } : undefined}
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={cn(
                    'text-sm fill-current pointer-events-none',
                    isSelected
                      ? 'font-medium text-[var(--color-brand)]'
                      : isRoot
                      ? 'font-semibold text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)]'
                  )}
                >
                  {node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};