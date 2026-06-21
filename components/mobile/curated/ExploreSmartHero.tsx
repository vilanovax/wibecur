'use client';

import { Search } from 'lucide-react';
import { useSearchOptional } from '@/contexts/SearchContext';
import SearchInput from '@/components/mobile/search/SearchInput';
import MoodExplorerHero from './MoodExplorerHero';
import type { MoodExplorerCard } from '@/lib/discovery/mood-explorer-config';

interface ExploreSmartHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMoodSelect?: (card: MoodExplorerCard) => void;
  showMoodExplorer?: boolean;
}

export default function ExploreSmartHero({
  searchQuery,
  onSearchChange,
  onMoodSelect,
  showMoodExplorer = true,
}: ExploreSmartHeroProps) {
  const search = useSearchOptional();
  const hasQuery = Boolean(searchQuery.trim());

  const openGlobalSearch = () => {
    search?.openSearch({ query: searchQuery });
  };

  return (
    <section
      className="border-b border-wibe bg-wibe-surface px-2.5 pb-3 pt-2 lg:border-b-0 lg:px-0 lg:pb-4 lg:pt-0"
      aria-label="اکسپلور هوشمند"
    >
      <div className="mb-2.5 hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="جستجو در آیتم‌ها و لیست‌ها…"
            />
          </div>
          <button
            type="button"
            onClick={openGlobalSearch}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-wibe bg-wibe-card text-wibe-secondary transition-colors hover:border-primary/30 hover:text-primary"
            aria-label="باز کردن جستجو"
            title="باز کردن جستجو"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={openGlobalSearch}
        className="relative mb-3 flex w-full items-center rounded-xl border border-wibe bg-wibe-card px-4 py-2.5 text-right transition-colors hover:border-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.99] lg:hidden"
        aria-label="باز کردن جستجو"
      >
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wibe-secondary"
          aria-hidden
        />
        <span
          className={`block w-full truncate py-0.5 pl-2 pr-8 text-right wibe-small ${hasQuery ? 'text-foreground' : 'text-wibe-secondary'}`}
        >
          {hasQuery ? searchQuery : 'جستجو در آیتم‌ها و لیست‌ها…'}
        </span>
      </button>

      {showMoodExplorer && !hasQuery && onMoodSelect && (
        <MoodExplorerHero onMoodSelect={onMoodSelect} />
      )}
    </section>
  );
}
