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
      className="border-b border-wibe bg-wibe-surface px-2.5 pb-3 pt-2 lg:border-b-0 lg:px-0 lg:pb-4 lg:pt-0"
      aria-label="اکسپلور هوشمند"
    >
      <p className="mb-1.5 wibe-caption font-medium text-wibe-secondary lg:hidden">جستجو در اکسپلور</p>
      <button
        type="button"
        onClick={openExploreSearch}
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
          {hasQuery ? searchQuery : EXPLORE_SEARCH_PLACEHOLDER}
        </span>
      </button>

      {showMoodExplorer && !hasQuery && onMoodSelect && (
        <MoodExplorerHero onMoodSelect={onMoodSelect} />
      )}
    </section>
  );
}
