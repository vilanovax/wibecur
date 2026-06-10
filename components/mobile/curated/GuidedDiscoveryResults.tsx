'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
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

export default function GuidedDiscoveryResults({ data, scenario, onItemClick }: Props) {
  if (data.rows.length === 0) {
    return (
      <p className="py-8 text-center wibe-small text-wibe-secondary">
        فعلاً پیشنهادی پیدا نشد. بعداً دوباره امتحان کن.
      </p>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <p className="text-right wibe-body font-semibold text-foreground">{data.headline}</p>

      {data.rows.map((row) => (
        <section key={row.id} aria-labelledby={`guided-row-${row.id}`}>
          <h3
            id={`guided-row-${row.id}`}
            className="mb-2.5 text-right wibe-small font-semibold text-foreground"
          >
            {row.title}
          </h3>

          {row.type === 'lists' && row.lists && row.lists.length > 0 && (
            <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1">
              {row.lists.map((list) => (
                <div key={list.id} className="w-[78%] max-w-[260px] shrink-0 snap-start sm:w-[68%]">
                  <GuidedListCardLink
                    list={list}
                    scenario={scenario}
                    rowId={row.id}
                    onNavigate={onItemClick}
                  />
                </div>
              ))}
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
      ))}
    </div>
  );
}

function GuidedListCardLink({
  list,
  scenario,
  rowId,
  onNavigate,
}: {
  list: GuidedListCardData;
  scenario: GuidedScenario;
  rowId: string;
  onNavigate?: () => void;
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
      className="group block transition-transform active:scale-[0.99]"
    >
      <div className="overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm">
        <div className="relative aspect-[4/3] bg-gray-200">
          <ImageWithFallback
            src={list.coverImage}
            alt={list.title}
            className="h-full w-full object-cover"
            categorySlug={list.category?.slug}
            fallbackIcon={list.category?.icon ?? '📋'}
            fallbackClassName="flex h-full w-full items-center justify-center text-2xl"
          />
        </div>
        <div className="p-2.5 text-right">
          <h4 className="line-clamp-2 wibe-small font-semibold text-foreground">{list.title}</h4>
          <ListCardStats saves={list.saveCount} itemCount={list.itemCount} className="mt-1" />
        </div>
      </div>
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
      className="block rounded-xl border border-wibe bg-wibe-card p-3 text-right transition-colors active:scale-[0.99] hover:border-primary/20"
    >
      <h4 className="wibe-small font-semibold text-foreground">{item.title}</h4>
      {item.description && (
        <p className="mt-1 line-clamp-2 wibe-caption leading-relaxed text-wibe-secondary">
          {item.description}
        </p>
      )}
      <span className="mt-2 inline-block wibe-caption text-primary/80">از لیست {item.listTitle}</span>
    </Link>
  );
}
