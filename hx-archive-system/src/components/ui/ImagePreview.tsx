import { useState } from 'react';
import { XIcon, DownloadIcon, EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = '图片', className }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return (
      <div className={cn('text-[var(--color-text-disabled)] text-sm', className)}>
        暂无
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <img
          src={src}
          alt={alt}
          className="w-16 h-12 object-cover rounded border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-brand)] transition-colors"
          onClick={() => setIsOpen(true)}
        />
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 rounded hover:bg-[var(--color-surface-bg)] transition-colors"
          title="预览"
        >
          <EyeIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </button>
        <a
          href={src}
          download
          className="p-1 rounded hover:bg-[var(--color-surface-bg)] transition-colors"
          title="下载"
        >
          <DownloadIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </a>
      </div>

      {/* 预览弹窗 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

// 银行卡号显示组件（可切换显示/隐藏）
interface BankCardNumberProps {
  bankCardNumber?: string;
  className?: string;
}

export function BankCardNumber({ bankCardNumber, className }: BankCardNumberProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!bankCardNumber) {
    return <span className={cn('text-[var(--color-text-disabled)]', className)}>暂无</span>;
  }

  const maskedNumber = bankCardNumber.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');
  const fullNumber = bankCardNumber.replace(/(\d{4})(?=\d{4})/g, '$1 ');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="font-mono">
        {isVisible ? fullNumber : maskedNumber}
      </span>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="px-2 py-0.5 text-xs bg-[var(--color-surface-bg)] rounded hover:bg-[var(--color-border)] transition-colors"
      >
        {isVisible ? '隐藏' : '显示'}
      </button>
    </div>
  );
}