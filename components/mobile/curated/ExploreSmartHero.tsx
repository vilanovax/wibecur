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
      className="relative overflow-hidden border-b border-wibe/70 bg-gradient-to-b from-primary/[0.06] via-wibe-surface to-wibe-surface px-3.5 pb-4 pt-3 lg:border-b-0 lg:from-primary/[0.04] lg:px-0 lg:pb-5 lg:pt-1"
      aria-label="اکسپلور هوشمند"
    >
      <div
        className="pointer-events-none absolute -left-16 top-0 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 top-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <button
          type="button"
          onClick={openExploreSearch}
          className="relative mb-4 flex w-full items-center gap-3 rounded-2xl border border-wibe bg-wibe-card/95 px-4 py-3.5 text-right shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:hidden"
          aria-label="باز کردن جستجو"
        >
          <Search className="h-5 w-5 shrink-0 text-wibe-secondary" aria-hidden />
          <span
            className={`min-w-0 flex-1 truncate wibe-small ${
              hasQuery ? 'text-foreground' : 'text-wibe-secondary'
            }`}
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
