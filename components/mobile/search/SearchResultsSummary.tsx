'use client';

import type { SearchQueryIntent } from '@/lib/search-keywords';

export type SearchResultTab = 'all' | 'items' | 'lists';

type Props = {
  query: string;
  totals: { items: number; lists: number };
  shownItems: number;
  shownLists: number;
  shownTopPicks?: number;
  queryIntent?: SearchQueryIntent;
  activeTab: SearchResultTab;
  onTabChange: (tab: SearchResultTab) => void;
};

const TABS: { id: SearchResultTab; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'items', label: 'آیتم‌ها' },
  { id: 'lists', label: 'لیست‌ها' },
];

export function formatSearchSummaryText(input: {
  query: string;
  totals: { items: number; lists: number };
  shownItems: number;
  shownLists: number;
  shownTopPicks?: number;
  queryIntent?: SearchQueryIntent;
}): string {
  if (input.queryIntent === 'broad') {
    const parts = [`کاوش «${input.query}»`];
    if (input.totals.items > 0) {
      parts.push(`${input.totals.items.toLocaleString('fa-IR')} آیتم`);
    }
    if (input.totals.lists > 0) {
      parts.push(`${input.totals.lists.toLocaleString('fa-IR')} لیست`);
    }
    const picks = input.shownTopPicks ?? 0;
    if (picks > 0) {
      parts.push(`${picks.toLocaleString('fa-IR')} پیشنهاد برتر`);
    }
    return parts.join(' · ');
  }

  const total = input.totals.items + input.totals.lists;
  const shown = input.shownItems + input.shownLists;
  const parts = [`${total.toLocaleString('fa-IR')} نتیجه برای «${input.query}»`];
  if (shown < total) {
    parts.push(`${shown.toLocaleString('fa-IR')} نمایش داده شده`);
  }
  if (input.totals.items > 0) {
    parts.push(`${input.totals.items.toLocaleString('fa-IR')} آیتم`);
  }
  if (input.totals.lists > 0) {
    parts.push(`${input.totals.lists.toLocaleString('fa-IR')} لیست`);
  }
  return parts.join(' · ');
}

export default function SearchResultsSummary({
  query,
  totals,
  shownItems,
  shownLists,
  shownTopPicks = 0,
  queryIntent = 'specific',
  activeTab,
  onTabChange,
}: Props) {
  const summary = formatSearchSummaryText({
    query,
    totals,
    shownItems,
    shownLists,
    shownTopPicks,
    queryIntent,
  });

  return (
    <div className="space-y-2.5">
      <p className="wibe-caption leading-relaxed text-wibe-secondary">{summary}</p>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`h-8 shrink-0 rounded-full px-3.5 wibe-caption font-medium transition-colors active:scale-[0.98] ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'border border-wibe bg-wibe-card text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
