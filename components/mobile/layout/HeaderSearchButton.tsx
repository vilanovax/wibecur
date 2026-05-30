'use client';

import { Search } from 'lucide-react';
import { useSearchOptional } from '@/contexts/SearchContext';

interface HeaderSearchButtonProps {
  className?: string;
}

export default function HeaderSearchButton({ className = '' }: HeaderSearchButtonProps) {
  const search = useSearchOptional();
  if (!search) return null;

  return (
    <button
      type="button"
      onClick={() => search.openSearch()}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 active:scale-[0.98] ${className}`}
      aria-label="جستجو"
    >
      <Search className="h-5 w-5 text-gray-600" />
    </button>
  );
}
