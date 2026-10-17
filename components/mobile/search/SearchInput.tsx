'use client';

import type { RefObject } from 'react';
import { SearchInput as KitSearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/** جستجوی اپ. همان کنترل وایب‌فارسی، با قرارداد قبلی صفحه‌ها. */
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
    <KitSearchInput
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      inputRef={inputRef}
      className={cn('h-12', className)}
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSubmit?.();
      }}
    />
  );
}
