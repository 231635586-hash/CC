import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type ImportType = 'create' | 'adjust';

interface EstablishmentBatchModalProps {
  open: boolean;
  importType: ImportType;
  onClose: () => void;
  onImport: (data: any[]) => Promise<{ success: number; failed: number; errors: any[] }>;
}

export const EstablishmentBatchModal = ({
  open,
  importType,
  onClose,
  onImport,
}: EstablishmentBatchModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreate = importType === 'create';
  const title = isCreate ? '批量导入新编制' : '批量发起调整';

  // 模板列定义
  const templateColumnsCreate = ['部门', '职位', '年份', '月份', '编制名额', '调整原因', '调整说明'];
  const templateColumnsAdjust = ['部门', '职位', '年份', '月份', '原名额', '新名额', '调整原因', '调整说明'];

  // 模板示例数据
  const templateDataCreate = [
    ['研发部', '前端开发工程师', '2026', '7', '10', '业务扩张', '团队扩张需要'],
    ['研发部', '后端开发工程师', '2026', '7', '8', '业务扩张', ''],
  ];

  const templateDataAdjust = [
    ['研发部', '前端开发工程师', '2026', '7', '10', '12', '业务扩张', '团队扩张'],
    ['产品部', '产品经理', '2026', '8', '5', '3', '业务收缩', ''],
  ];

  const templateColumns = isCreate ? templateColumnsCreate : templateColumnsAdjust;
  const templateData = isCreate ? templateDataCreate : templateDataAdjust;

  const handleDownloadTemplate = () => {
    const csvContent = [
      templateColumns.join(','),
      ...templateData.map((row) => row.join(',')),
    ].join('\n');

    const BOM = '﻿';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}模板.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        setResult({ success: 0, failed: 0, errors: [{ row: 0, message: '文件内容为空' }] });
        setLoading(false);
        return;
      }

      // 解析数据（跳过表头）
      const data: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};

        templateColumns.forEach((col, idx) => {
          row[col] = values[idx] || '';
        });

        const isEmptyRow = Object.values(row).every((v) => !v);
        if (isEmptyRow) continue;

        data.push(row);
      }

      const importResult = await onImport(data);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [{ row: 0, message: '文件解析失败' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} title={title} onClose={handleClose} size="md">
      <div className="space-y-4">
        {/* 下载模板 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">下载导入模板</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              请先下载模板，按格式填写后上传
            </div>
          </div>
          <Button variant="secondary" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            下载模板
          </Button>
        </div>

        {/* 上传文件 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">上传文件</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              支持 .csv 格式
            </div>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </Button>
          </div>
        </div>

        {/* 已选文件 */}
        {file && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            已选择：{file.name}
          </div>
        )}

        {/* 导入结果 */}
        {result && (
          <div className={`p-4 rounded-lg ${result.failed === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-sm">
              <span className="text-green-600 font-medium">成功：{result.success} 条</span>
              {result.failed > 0 && (
                <span className="text-red-600 font-medium ml-4">失败：{result.failed} 条</span>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {result.errors.slice(0, 5).map((err, idx) => (
                  <div key={idx}>第{err.row}行：{err.message}</div>
                ))}
                {result.errors.length > 5 && (
                  <div>...还有 {result.errors.length - 5} 条错误</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            关闭
          </Button>
          <Button onClick={handleImport} loading={loading} disabled={!file}>
            导入
          </Button>
        </div>
      </div>
    </Modal>
  );
};