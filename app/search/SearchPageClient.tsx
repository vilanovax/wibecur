'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/components/mobile/search/SearchInput';
import SearchResultSkeleton from '@/components/mobile/search/SearchResultSkeleton';
import SearchResultsPanel from '@/components/mobile/search/SearchResultsPanel';
import { useUnifiedSearchQuery } from '@/lib/hooks/useUnifiedSearchQuery';
import {
  normalizeSearchQuery,
  pushRecentSearch,
  SEARCH_MIN_LENGTH,
} from '@/lib/list-search';
import { trackSearch, trackSearchNoResults } from '@/lib/analytics';

type Props = {
  initialQuery?: string;
};

export default function SearchPageClient({ initialQuery = '' }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const noResultsTracked = useRef('');

  const search = useUnifiedSearchQuery(query);
  const { normalized, isActive, loading, hasResults } = search;

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const q = normalizeSearchQuery(query);
    const params = new URLSearchParams(window.location.search);
    const current = params.get('q') ?? '';
    if (current === q) return;
    if (q.length >= SEARCH_MIN_LENGTH) {
      router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    } else if (current) {
      router.replace('/search', { scroll: false });
    }
  }, [query, router]);

  useEffect(() => {
    if (!isActive || loading || hasResults) return;
    if (noResultsTracked.current === normalized) return;
    noResultsTracked.current = normalized;
    trackSearchNoResults(normalized, 'search_page');
  }, [isActive, loading, hasResults, normalized]);

  const { refetch } = search;

  const handleSubmit = useCallback(() => {
    const q = normalizeSearchQuery(query);
    if (q.length < SEARCH_MIN_LENGTH) return;
    pushRecentSearch(q);
    trackSearch(q, 'search_page_submit');
    refetch();
  }, [query, refetch]);

  return (
    <div className="px-4 pb-8 pt-2 lg:px-0">
      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          placeholder="جستجو در آیتم‌ها و لیست‌ها…"
          autoFocus
        />
      </div>

      {loading && isActive && !hasResults ? (
        <SearchResultSkeleton rows={5} />
      ) : isActive && !loading && !hasResults ? (
        <div className="py-16 text-center">
          <p className="wibe-body font-medium text-foreground">نتیجه‌ای پیدا نشد</p>
          <p className="mt-1 wibe-caption text-wibe-secondary">
            عبارت دیگری امتحان کن یا از کلمات کلیدی ژانر استفاده کن
          </p>
        </div>
      ) : isActive && hasResults ? (
        <SearchResultsPanel
          query={normalized}
          queryIntent={search.queryIntent}
          directItems={search.directItems}
          indirectItems={search.indirectItems}
          topPicks={search.topPicks}
          subThemes={search.subThemes}
          similarItems={search.similarItems}
          lists={search.lists}
          totals={search.totals}
          hasMore={search.hasMore}
          viewTab={search.viewTab}
          onTabChange={search.setViewTab}
          onLoadMore={search.loadMore}
          onSubThemeClick={setQuery}
          loadingMore={search.loadingMore}
          highlightQuery={normalized}
        />
      ) : (
        <p className="py-12 text-center wibe-caption text-wibe-secondary">
          برای شروع، عبارت جستجو را وارد کن
        </p>
      )}
    </div>
  );
}
