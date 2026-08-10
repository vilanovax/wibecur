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
      className="relative border-b border-wibe/60 bg-gradient-to-b from-primary/[0.07] via-wibe-surface to-wibe-surface px-2.5 pb-3 pt-3 lg:border-b-0 lg:from-primary/[0.05] lg:px-0 lg:pb-4 lg:pt-1"
      aria-label="اکسپلور هوشمند"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={openExploreSearch}
          className="sticky top-[52px] z-10 mb-3 flex w-full items-center rounded-2xl border border-wibe/80 bg-wibe-card/95 px-4 py-3 text-right shadow-vibe-sm backdrop-blur-md transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.99] lg:static lg:hidden"
          aria-label="باز کردن جستجو"
        >
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-wibe-secondary"
            aria-hidden
          />
          <span
            className={`block w-full truncate py-0.5 pl-2 pr-9 text-right wibe-small ${hasQuery ? 'text-foreground' : 'text-wibe-secondary'}`}
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
