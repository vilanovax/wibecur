'use client';

import { Search } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import SearchShortcutHint from '@/components/shared/SearchShortcutHint';
import { Button } from '@/components/ui/button';

/** دکمه جستجو برای هدر دسکتاپ */
export default function HeaderDesktopSearch() {
  const { openSearch } = useSearch();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => openSearch()}
      className="h-auto w-full justify-start gap-3 rounded-xl px-4 py-2.5 text-right font-normal"
      aria-label="باز کردن جستجو"
    >
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex-1 wibe-small font-normal text-muted-foreground">فیلم، کتاب، کافه، لیست…</span>
      <SearchShortcutHint />
    </Button>
  );
}
