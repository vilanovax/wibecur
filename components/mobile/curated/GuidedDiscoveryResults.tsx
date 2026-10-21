'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Card } from '@/components/ui/card';

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
          className="flex size-14 items-center justify-center rounded-surface bg-muted text-2xl"
          aria-hidden
        >
          🔍
        </span>
        <p className="wibe-body font-medium text-foreground">فعلاً پیشنهادی پیدا نشد</p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
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
                className="flex items-center gap-2 text-start text-base font-bold text-foreground"
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-surface bg-muted text-lg"
                  aria-hidden
                >
                  {rowIcon}
                </span>
                {row.title}
              </h3>
              {visibleLists.length > 0 ? (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {visibleLists.length.toLocaleString('fa-IR')}
                </span>
              ) : null}
            </div>

            {row.type === 'lists' && visibleLists.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 lg:gap-3 xl:grid-cols-3">
                {visibleLists.map((list) => {
                  const priority = listCardIndex === 0;
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
  const router = useRouter();
  const href = `/lists/${list.slug}`;
  const coverGradient = pickCategoryCoverGradient(
    list.category?.slug,
    list.slug || list.title
  );

  return (
    <Link
      href={href}
      prefetch={false}
      onPointerDown={() => router.prefetch(href)}
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
      <Card className="flex h-full flex-col overflow-hidden bg-popover p-0 transition-transform active:scale-95">
        <div
          className={`relative aspect-4/3 w-full shrink-0 overflow-hidden bg-linear-to-br ${coverGradient}`}
        >
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, 45vw"
            priority={priority}
            fetchPriority={priority ? 'high' : 'low'}
            className="object-cover lg:transition-transform lg:duration-300 lg:group-hover:scale-105"
            categorySlug={list.category?.slug}
            listSlug={list.slug}
            listTitle={list.title}
            fallbackIcon={list.category?.icon ?? '📋'}
            fallbackClassName="absolute inset-0 flex items-center justify-center text-2xl"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-foreground/50 via-transparent to-transparent"
            aria-hidden
          />
        </div>
        <div className="flex min-h-16 flex-1 flex-col gap-1 p-3 text-start">
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
      </Card>
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
  const router = useRouter();
  const href = `/items/${item.id}`;
  return (
    <Link
      href={href}
      prefetch={false}
      onPointerDown={() => router.prefetch(href)}
      onClick={() => {
        trackGuidedDiscoveryEvent('result_click', {
          scenario,
          itemId: item.id,
          rowId,
        });
        onNavigate?.();
      }}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Card className="flex items-start gap-3 bg-popover p-3">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-lg"
        aria-hidden
      >
        💡
      </span>
      <div className="min-w-0 flex-1 text-start">
        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand">
          از لیست {item.listTitle}
          <ChevronLeft className="size-4 opacity-70" aria-hidden />
        </span>
      </div>
      </Card>
    </Link>
  );
});
