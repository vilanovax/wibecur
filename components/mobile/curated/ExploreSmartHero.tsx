'use client';

import { Search } from 'lucide-react';
import { useSearchOptional } from '@/contexts/SearchContext';
import MoodExplorerHero from './MoodExplorerHero';
import type { MoodExplorerCard } from '@/lib/discovery/mood-explorer-config';

const EXPLORE_SEARCH_PLACEHOLDER = 'جستجو در وایب‌ها، مودها و لیست‌ها…';

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

  const openExploreSearch = () => {
    search?.openSearch({
      query: searchQuery,
      applyLocally: onSearchChange,
      localActionLabel: 'جستجو در اکسپلور',
    });
  };

  return (
    <section
      className="relative border-b border-border bg-background px-4 pb-4 pt-3 lg:border-b-0 lg:px-0 lg:pb-4 lg:pt-1"
      aria-label="اکسپلور هوشمند"
    >
      <div className="relative">
        <button
          type="button"
          onClick={openExploreSearch}
          className="sticky top-14 z-10 mb-4 flex h-12 w-full items-center gap-2 rounded-xl border border-border bg-popover px-4 text-start shadow-sm transition-colors hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:static lg:hidden"
          aria-label="باز کردن جستجو"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span
            className={`block min-w-0 flex-1 truncate text-start text-sm ${hasQuery ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {hasQuery ? searchQuery : EXPLORE_SEARCH_PLACEHOLDER}
          </span>
        </button>

        {showMoodExplorer && !hasQuery && onMoodSelect && (
          <MoodExplorerHero onMoodSelect={onMoodSelect} />
        )}
      </div>
    </section>
  );
}
