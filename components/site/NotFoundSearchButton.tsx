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
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-card px-5 py-2.5 wibe-small font-semibold text-foreground hover:border-primary/40 transition-colors"
    >
      <Search className="h-4 w-4 text-wibe-secondary" aria-hidden />
      جستجو
      <SearchShortcutHint className="!inline-flex opacity-70" />
    </button>
  );
}
