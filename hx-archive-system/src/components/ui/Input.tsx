import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefixIcon, suffixIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <span className="absolute left-3 text-[var(--color-text-disabled)]">{prefixIcon}</span>
          )}
          <input
            ref={ref}
            className={cn(
              'input',
              prefixIcon && 'pl-10',
              suffixIcon && 'pr-10',
              error && 'border-[var(--color-status-danger)] focus:ring-[var(--color-status-danger-bg)]',
              className
            )}
            {...props}
          />
          {suffixIcon && (
            <span className="absolute right-3 text-[var(--color-text-disabled)]">{suffixIcon}</span>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-[12px] text-[var(--color-status-danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';