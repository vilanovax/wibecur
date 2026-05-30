'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Star } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ItemCoverImage from '@/components/shared/ItemCoverImage';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';

export type ItemPreviewData = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  displayImageUrl?: string | null;
  rating?: number;
  metadata?: Record<string, unknown> | null;
  externalUrl?: string | null;
};

interface ItemPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemPreviewData | null;
  itemIndex?: number;
  totalItems?: number;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  categoryName?: string | null;
  listSlug?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

type MetaChip = { key: string; label: string; value: string };

function buildMetaChips(meta: Record<string, string | number>): MetaChip[] {
  const chips: MetaChip[] = [];
  if (meta.year != null) chips.push({ key: 'year', label: 'سال', value: String(meta.year) });
  if (meta.genre) chips.push({ key: 'genre', label: 'ژانر', value: String(meta.genre) });
  if (meta.director) chips.push({ key: 'director', label: 'کارگردان', value: String(meta.director) });
  if (meta.imdbRating) chips.push({ key: 'imdb', label: 'IMDb', value: String(meta.imdbRating) });
  if (meta.author) chips.push({ key: 'author', label: 'نویسنده', value: String(meta.author) });
  return chips;
}

export default function ItemPreviewSheet({
  isOpen,
  onClose,
  item,
  itemIndex,
  totalItems,
  categorySlug,
  categoryIcon,
  categoryName,
  listSlug,
  onPrev,
  onNext,
}: ItemPreviewSheetProps) {
  if (!item) return null;

  const meta = (item.metadata ?? {}) as Record<string, string | number>;
  const chips = buildMetaChips(meta);
  const desc = item.description?.trim();
  const isMovie = isMovieLikeCategory(categorySlug);
  const imdbRating = meta.imdbRating ? String(meta.imdbRating) : null;

  const rankLabel =
    itemIndex != null && totalItems != null
      ? `${(itemIndex + 1).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')}`
      : null;

  const headerSubtitle = [rankLabel, categoryName].filter(Boolean).join(' · ');

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      subtitle={headerSubtitle || undefined}
      maxHeight="88vh"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3.5">
          <div className="relative mx-auto w-full max-w-[240px]">
            <div className="overflow-hidden rounded-xl border border-wibe bg-gray-100 shadow-md">
              <div className="aspect-[2/3] w-full">
                <ItemCoverImage
                  itemId={item.id}
                  imageUrl={item.displayImageUrl ?? item.imageUrl}
                  title={item.title}
                  metadata={item.metadata}
                  categorySlug={categorySlug}
                  className="h-full w-full object-cover"
                  fallbackIcon={categoryIcon ?? '🎬'}
                  fallbackClassName="flex h-full w-full items-center justify-center text-4xl"
                  enrichPoster={isMovie}
                  preferPosterEnrich={isMovie}
                  priority
                  coverLayout="grid"
                />
              </div>
            </div>

            {imdbRating && (
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 wibe-caption font-semibold text-white backdrop-blur-sm">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {imdbRating}
              </span>
            )}

            {(onPrev || onNext) && (
              <div className="pointer-events-none absolute inset-y-0 -left-3 -right-3 flex items-center justify-between">
                {onPrev && (
                  <button
                    type="button"
                    onClick={onPrev}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-sm backdrop-blur-sm"
                    aria-label="آیتم قبلی"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-sm backdrop-blur-sm"
                    aria-label="آیتم بعدی"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {chips.map(({ key, label, value }) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full border border-wibe bg-gray-50 px-2.5 py-1 wibe-caption text-wibe-secondary"
                >
                  <span className="text-foreground/70">{label}:</span>
                  <span className="mr-1 font-medium text-foreground">{value}</span>
                </span>
              ))}
            </div>
          )}

          {desc ? (
            <p className="text-right wibe-small leading-relaxed text-wibe-secondary">{desc}</p>
          ) : (
            <p className="text-center wibe-caption text-wibe-secondary">توضیحی ثبت نشده</p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-wibe pt-3">
          <Link
            href={`/items/${item.id}`}
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-xl bg-primary py-3 wibe-small font-semibold text-white"
          >
            مشاهده صفحه کامل
          </Link>
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-wibe py-3 wibe-small font-medium text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              لینک خارجی
            </a>
          )}
          {listSlug && (
            <button
              type="button"
              onClick={onClose}
              className="py-1 wibe-caption font-medium text-wibe-secondary hover:text-primary"
            >
              ادامه مرور لیست
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
