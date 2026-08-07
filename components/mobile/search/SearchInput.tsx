'use client';

import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'جستجو در لیست‌ها…',
  autoFocus = false,
  inputRef,
  className = '',
  id,
  'aria-label': ariaLabel = 'جستجو',
}: SearchInputProps) {
  return (
    <div className={`relative flex h-10 items-center rounded-xl border border-wibe bg-wibe-card transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 ${className}`}>
      <Search className="absolute right-3 h-4 w-4 shrink-0 text-wibe-secondary" aria-hidden />
      <input
        id={id}
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit?.();
        }}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={ariaLabel}
        className="h-full w-full bg-transparent pl-9 pr-10 wibe-small text-foreground placeholder:text-wibe-secondary focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-wibe-secondary transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="پاک کردن جستجو"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
