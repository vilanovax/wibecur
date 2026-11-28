'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { CATEGORY_SECTION } from '@/lib/category-layout';
import { discoveryTopicResultsHref } from '@/lib/category-discovery/topic-search-route';
import { fa } from '@/lib/utils';
import type { DiscoveryTopicChip } from '@/types/category-page';

interface DiscoveryTopicsBarProps {
  categorySlug: string;
  categoryName: string;
  topics: DiscoveryTopicChip[];
  inset?: boolean;
}

export default function DiscoveryTopicsBar({
  categorySlug,
  categoryName,
  topics,
  inset = false,
}: DiscoveryTopicsBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  if (topics.length === 0) return null;

  const sectionClass = `${CATEGORY_SECTION} ${inset ? '' : 'px-4'}`;

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      router.push(`/lists?category=${encodeURIComponent(categorySlug)}`);
      return;
    }
    // موضوع شناخته‌شده → صفحهٔ کشف با لیست/مکان؛ وگرنه سرچ متنی دسته
    const topicHref = discoveryTopicResultsHref(categorySlug, q, 'lists');
    if (topicHref) {
      router.push(topicHref);
      return;
    }
    router.push(
      `/lists?category=${encodeURIComponent(categorySlug)}&q=${encodeURIComponent(q)}`
    );
  }

  return (
    <section className={sectionClass} aria-label="موضوعات کشف">
      <div className="mb-3">
        <h2 className="text-base font-semibold leading-tight text-foreground">
          چی دوست داری پیدا کنی؟
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          موضوعات پیشنهادی بر اساس محتوای همین دسته — جستجو همه‌چیز را پیدا می‌کند.
        </p>
      </div>

      <form onSubmit={onSearch} className="mb-3">
        <label className="sr-only" htmlFor={`discovery-search-${categorySlug}`}>
          جستجو در {categoryName}
        </label>
        <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-popover px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          <input
            id={`discovery-search-${categorySlug}`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`جستجو در ${categoryName}…`}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center px-1 text-sm font-medium text-brand"
          >
            برو
          </button>
        </div>
      </form>

      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory lg:flex-wrap lg:overflow-visible"
      >
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/categories/${categorySlug}/discover?topic=${encodeURIComponent(topic.slug)}`}
            className="flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border border-border bg-popover px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {topic.icon ? <span aria-hidden>{topic.icon}</span> : null}
            <span>{topic.label}</span>
            {topic.listCount > 0 ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                {fa(topic.listCount)}
              </span>
            ) : topic.placeCount > 0 ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground tabular-nums">
                {fa(topic.placeCount)}
              </span>
            ) : null}
          </Link>
        ))}
        {/* peek hint: spacer so last chip can peek on mobile */}
        <span className="w-2 shrink-0 lg:hidden" aria-hidden />
      </div>
    </section>
  );
}
