'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { rowIconForRowId } from '@/lib/discovery/guided-intent';
import type {
  GuidedDiscoveryPayload,
  GuidedItemCard,
  GuidedListCard as GuidedListCardData,
} from '@/lib/discovery/guided-recommendations';
import type { GuidedScenario } from '@/lib/discovery/guided-intent';
import { trackGuidedDiscoveryEvent } from '@/lib/discovery/guided-client';
import { pickCategoryCoverGradient } from '@/lib/category-cover-images';

type Props = {
  data: GuidedDiscoveryPayload;
  scenario: GuidedScenario;
  onItemClick?: () => void;
};

function rowQueryFromId(rowId: string): string | undefined {
  return rowId.startsWith('search-') ? rowId.slice('search-'.length) : undefined;
}

const LISTS_PER_ROW = 4;

export default function GuidedDiscoveryResults({ data, scenario, onItemClick }: Props) {
  if (data.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wibe-surface text-2xl ring-1 ring-wibe"
          aria-hidden
        >
          🔍
        </span>
        <p className="wibe-body font-medium text-foreground">فعلاً پیشنهادی پیدا نشد</p>
        <p className="max-w-xs wibe-caption leading-relaxed text-wibe-secondary">
          بعداً دوباره امتحان کن یا از جستجو استفاده کن
        </p>
      </div>
    );
  }

  let listCardIndex = 0;

  return (
    <div className="space-y-7 pb-1 lg:space-y-8" dir="rtl">
      {data.rows.map((row) => {
        const query = rowQueryFromId(row.id);
        const rowIcon = rowIconForRowId(row.id, query);
        const visibleLists =
          row.type === 'lists' && row.lists ? row.lists.slice(0, LISTS_PER_ROW) : [];

        return (
          <section key={row.id} aria-labelledby={`guided-row-${row.id}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3
                id={`guided-row-${row.id}`}
                className="flex items-center gap-2 text-right wibe-body font-bold text-foreground"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wibe-surface text-lg ring-1 ring-wibe"
                  aria-hidden
                >
                  {rowIcon}
                </span>
                {row.title}
              </h3>
              {visibleLists.length > 0 ? (
                <span className="shrink-0 wibe-caption tabular-nums text-wibe-secondary">
                  {visibleLists.length.toLocaleString('fa-IR')}
                </span>
              ) : null}
            </div>

            {row.type === 'lists' && visibleLists.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 lg:gap-3 xl:grid-cols-3">
                {visibleLists.map((list) => {
                  const priority = listCardIndex < 2;
                  listCardIndex += 1;
                  return (
                    <GuidedListCardLink
                      key={list.id}
                      list={list}
                      scenario={scenario}
                      rowId={row.id}
                      onNavigate={onItemClick}
                      priority={priority}
                    />
                  );
                })}
              </div>
            ) : null}

            {row.type === 'items' && row.items && row.items.length > 0 ? (
              <div className="space-y-2">
                {row.items.map((item) => (
                  <GuidedItemCardRow
                    key={item.id}
                    item={item}
                    scenario={scenario}
                    rowId={row.id}
                    onNavigate={onItemClick}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

const GuidedListCardLink = memo(function GuidedListCardLink({
  list,
  scenario,
  rowId,
  onNavigate,
  priority = false,
}: {
  list: GuidedListCardData;
  scenario: GuidedScenario;
  rowId: string;
  onNavigate?: () => void;
  priority?: boolean;
}) {
  const coverGradient = pickCategoryCoverGradient(
    list.category?.slug,
    list.slug || list.title
  );

  return (
    <Link
      href={`/lists/${list.slug}`}
      onClick={() => {
        trackGuidedDiscoveryEvent('result_click', {
          scenario,
          listSlug: list.slug,
          rowId,
        });
        onNavigate?.();
      }}
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-wibe bg-wibe-card transition-colors active:scale-[0.99] lg:hover:border-primary/25 lg:hover:shadow-sm">
        <div
          className={`relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gradient-to-br ${coverGradient}`}
        >
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, 45vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            categorySlug={list.category?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            fallbackIcon={list.category?.icon ?? '📋'}
            fallbackClassName="absolute inset-0 flex items-center justify-center text-2xl"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
            aria-hidden
          />
        </div>
        <div className="flex min-h-[3.75rem] flex-1 flex-col gap-1 p-2.5 text-right lg:p-3">
          <h4 className="line-clamp-2 wibe-caption font-bold leading-snug text-foreground lg:wibe-small">
            {list.title}
          </h4>
          <ListCardStats
            saves={list.saveCount}
            itemCount={list.itemCount}
            variant="minimal"
            className="mt-auto"
          />
        </div>
      </article>
    </Link>
  );
});

const GuidedItemCardRow = memo(function GuidedItemCardRow({
  item,
  scenario,
  rowId,
  onNavigate,
}: {
  item: GuidedItemCard;
  scenario: GuidedScenario;
  rowId: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      onClick={() => {
        trackGuidedDiscoveryEvent('result_click', {
          scenario,
          itemId: item.id,
          rowId,
        });
        onNavigate?.();
      }}
      className="group flex items-start gap-3 rounded-xl border border-wibe bg-wibe-card p-3 text-right transition-colors hover:border-primary/25 hover:bg-primary/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] lg:p-3.5"
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wibe-surface text-lg ring-1 ring-wibe"
        aria-hidden
      >
        💡
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="wibe-small font-bold text-foreground">{item.title}</h4>
        {item.description ? (
          <p className="mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
            {item.description}
          </p>
        ) : null}
        <span className="mt-1.5 inline-flex items-center gap-1 wibe-caption font-medium text-primary">
          از لیست {item.listTitle}
          <ChevronLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </span>
      </div>
    </Link>
  );
});
