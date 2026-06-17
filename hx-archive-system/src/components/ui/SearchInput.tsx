import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  onSearch?: (value: string) => void;
  searchText?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, placeholder = '搜索...', value, onChange, onSearch, onKeyDown, searchText = '搜索', ...props }, ref) => {
    const inputValue = typeof value === 'string' ? value : '';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        e.preventDefault();
        onSearch(inputValue);
      }
      onKeyDown?.(e);
    };

    const handleClear = () => {
      onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className={cn('search-box-wrap', inputValue && 'active', className)}>
        <div className="search-group">
          <input
            ref={ref}
            type="text"
            className="search-group-input"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {inputValue && (
            <span
              className="search-clear"
              onClick={handleClear}
              role="button"
              tabIndex={0}
            >
              ×
            </span>
          )}
          <button
            type="button"
            className="search-group-btn"
            onClick={() => onSearch?.(inputValue)}
          >
            {searchText}
          </button>
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
