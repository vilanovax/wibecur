'use client';

import { Search } from 'lucide-react';
import { useSearchOptional } from '@/contexts/SearchContext';
import SearchShortcutHint from '@/components/shared/SearchShortcutHint';

export default function NotFoundSearchButton() {
  const search = useSearchOptional();

  if (!search) return null;

  return (
    <button
      type="button"
      onClick={() => search.openSearch()}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-control border border-border bg-popover px-5 text-sm font-semibold text-foreground transition-colors hover:border-brand/40"
    >
      <Search className="size-4 text-muted-foreground" aria-hidden />
      جستجو
      <SearchShortcutHint className="!inline-flex opacity-70" />
    </button>
  );
}
