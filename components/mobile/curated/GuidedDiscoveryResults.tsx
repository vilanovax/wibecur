'use client';

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
        <span className="text-4xl" aria-hidden>
          🔍
        </span>
        <p className="wibe-body font-medium text-foreground">فعلاً پیشنهادی پیدا نشد</p>
        <p className="max-w-xs wibe-caption leading-relaxed text-wibe-secondary">
          بعداً دوباره امتحان کن یا از جستجو استفاده کن
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-1 lg:space-y-7" dir="rtl">
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
                className="flex items-center gap-2 text-right wibe-small font-bold text-foreground lg:text-base"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg"
                  aria-hidden
                >
                  {rowIcon}
                </span>
                {row.title}
              </h3>
              {visibleLists.length > 2 && (
                <span className="hidden shrink-0 wibe-caption text-wibe-secondary lg:inline">
                  {visibleLists.length.toLocaleString('fa-IR')} لیست
                </span>
              )}
            </div>

            {row.type === 'lists' && visibleLists.length > 0 && (
              <div className="lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
                <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:contents lg:overflow-visible lg:p-0">
                  {visibleLists.map((list, index) => (
                    <div
                      key={list.id}
                      className="h-full w-[72%] max-w-[240px] shrink-0 snap-start sm:w-[58%] lg:w-auto lg:max-w-none lg:min-w-0"
                    >
                      <GuidedListCardLink
                        list={list}
                        scenario={scenario}
                        rowId={row.id}
                        onNavigate={onItemClick}
                        featured={index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {row.type === 'items' && row.items && row.items.length > 0 && (
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
            )}
          </section>
        );
      })}
    </div>
  );
}

function GuidedListCardLink({
  list,
  scenario,
  rowId,
  onNavigate,
  featured = false,
}: {
  list: GuidedListCardData;
  scenario: GuidedScenario;
  rowId: string;
  onNavigate?: () => void;
  featured?: boolean;
}) {
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
      className="group block h-full transition-transform active:scale-[0.99]"
    >
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-wibe-card shadow-sm transition-all lg:hover:-translate-y-0.5 lg:hover:shadow-md ${
          featured ? 'border-primary/20 ring-1 ring-primary/10' : 'border-wibe'
        }`}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gray-200">
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, 72vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            categorySlug={list.category?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            fallbackIcon={list.category?.icon ?? '📋'}
            fallbackClassName="absolute inset-0 flex items-center justify-center text-3xl"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          {list.category?.name && (
            <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 wibe-caption font-medium text-white backdrop-blur-sm">
              {list.category.icon ? `${list.category.icon} ` : ''}
              {list.category.name}
            </span>
          )}
          <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-wibe-secondary opacity-0 shadow-sm transition-opacity group-hover:opacity-100 lg:opacity-100">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </span>
        </div>
        <div className="flex min-h-[4.25rem] flex-1 flex-col p-3 text-right">
          <h4 className="line-clamp-2 wibe-small font-bold leading-snug text-foreground lg:text-[0.9375rem]">
            {list.title}
          </h4>
          <ListCardStats
            saves={list.saveCount}
            itemCount={list.itemCount}
            variant="minimal"
            className="mt-2"
          />
        </div>
      </article>
    </Link>
  );
}

function GuidedItemCardRow({
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
      className="group block rounded-2xl border border-wibe bg-wibe-card p-3.5 text-right transition-all active:scale-[0.99] hover:border-primary/25 hover:bg-primary/[0.03] lg:p-4"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg"
          aria-hidden
        >
          💡
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="wibe-small font-bold text-foreground">{item.title}</h4>
          {item.description && (
            <p className="mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
              {item.description}
            </p>
          )}
          <span className="mt-2 inline-flex items-center gap-1 wibe-caption font-medium text-primary/80">
            از لیست {item.listTitle}
            <ChevronLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
