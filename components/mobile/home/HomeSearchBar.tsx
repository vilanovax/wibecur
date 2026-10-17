'use client';

import { Search } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';

export default function HomeSearchBar() {
  const { openSearch } = useSearch();

  return (
    <div className="px-4 pb-2 pt-1 lg:hidden">
      <Button
        type="button"
        variant="outline"
        onClick={() => openSearch()}
        className="h-auto min-h-11 w-full justify-start gap-3 rounded-xl px-4 py-3 text-start font-normal shadow-sm"
        aria-label="باز کردن جستجو"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 wibe-small font-normal text-muted-foreground">فیلم، کتاب، کافه، لیست خاص…</span>
      </Button>
    </div>
  );
}
