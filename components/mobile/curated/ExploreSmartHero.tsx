'use client';

import { Search } from 'lucide-react';
import { useSearchOptional } from '@/contexts/SearchContext';

interface ExploreSmartHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onModeScroll: (id: string) => void;
}

const EXPLORE_MODES = [
  { id: 'trending', label: 'ترند', icon: '🔥' },
  { id: 'foryou', label: 'برای تو', icon: '🎯' },
  { id: 'rising', label: 'در حال رشد', icon: '🌱' },
  { id: 'more', label: 'بیشتر', icon: '✨' },
] as const;

export default function ExploreSmartHero({
  searchQuery,
  onSearchChange,
  onModeScroll,
}: ExploreSmartHeroProps) {
  const search = useSearchOptional();
  const hasQuery = Boolean(searchQuery.trim());

  const openSearch = () => {
    search?.openSearch({
      query: searchQuery,
      applyLocally: onSearchChange,
      localActionLabel: 'فیلتر در اکسپلور',
    });
  };

  return (
    <section
      className="border-b border-wibe bg-wibe-surface px-2.5 pb-3 pt-2"
      aria-label="اکسپلور هوشمند"
    >
      <h2 className="mb-2 wibe-h3">امروز چی کشف می‌کنی؟</h2>
      <button
        type="button"
        onClick={openSearch}
        className="relative mb-2.5 flex w-full items-center rounded-xl border border-wibe bg-wibe-card px-4 py-2.5 text-right transition-colors hover:border-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.99]"
        aria-label="باز کردن جستجو"
      >
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wibe-secondary"
          aria-hidden
        />
        <span className={`block w-full truncate pl-2 pr-8 text-right wibe-small ${hasQuery ? 'text-foreground' : 'text-wibe-secondary'}`}>
          {hasQuery ? searchQuery : 'فیلم آرامش‌بخش، کافه دنج، سریال دهه ۹۰…'}
        </span>
      </button>

      {hasQuery && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="wibe-caption font-medium text-primary"
          >
            پاک کردن فیلتر
          </button>
          <p className="truncate wibe-caption text-wibe-secondary">
            فیلتر: «{searchQuery.trim()}»
          </p>
        </div>
      )}

      {!hasQuery && (
        <div className="scrollbar-hide -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 pb-0.5">
          {EXPLORE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeScroll(m.id)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-wibe bg-wibe-card px-3 py-1.5 wibe-caption font-medium text-wibe-secondary transition-colors hover:border-primary/30"
              aria-label={`رفتن به ${m.label}`}
            >
              <span aria-hidden>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
