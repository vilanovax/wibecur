'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, Star } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { resolveImageDisplaySrc } from '@/lib/image-url-policy';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';

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

function PreviewPoster({
  item,
  categorySlug,
  categoryIcon,
  className = '',
}: {
  item: ItemPreviewData;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  className?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const posterSrc = useMemo(() => {
    const resolved = resolveItemDisplayImage({
      id: item.id,
      imageUrl: item.displayImageUrl ?? item.imageUrl,
      title: item.title,
      metadata: item.metadata,
      categorySlug,
    });
    return resolveImageDisplaySrc(resolved) || resolved;
  }, [item, categorySlug]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [posterSrc, item.id]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [posterSrc]);

  if (!posterSrc || failed) {
    return (
      <ItemCoverPlaceholder
        title={item.title}
        categorySlug={categorySlug}
        fallbackIcon={categoryIcon ?? '🎬'}
        state="empty"
        layout="grid"
        className={`h-full w-full ${className}`}
        ariaLabel={item.title}
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gray-100 ${className}`}>
      {!loaded && (
        <ItemCoverPlaceholder
          title={item.title}
          categorySlug={categorySlug}
          fallbackIcon={categoryIcon ?? '🎬'}
          state="loading"
          layout="grid"
          className="absolute inset-0 h-full w-full"
          ariaLabel={`در حال بارگذاری ${item.title}`}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={posterSrc}
        alt={item.title}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="eager"
        fetchPriority="high"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setFailed(true);
        }}
      />
    </div>
  );
}

function NavButton({
  direction,
  onClick,
  className = '',
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === 'prev' ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-wibe/80 bg-white/95 text-foreground shadow-md transition-colors hover:bg-gray-50 active:scale-95 lg:h-10 lg:w-10 ${className}`}
      aria-label={direction === 'prev' ? 'آیتم قبلی' : 'آیتم بعدی'}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function PreviewActions({
  item,
  listSlug,
  onClose,
}: {
  item: ItemPreviewData;
  listSlug?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-wibe pt-3 max-lg:px-0 lg:border-t-0 lg:pt-0">
      <Link
        href={`/items/${item.id}`}
        onClick={onClose}
        className="flex w-full items-center justify-center rounded-xl bg-primary py-3 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        مشاهده صفحه کامل
      </Link>
      {item.externalUrl && (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-wibe py-3 wibe-small font-medium text-foreground transition-colors hover:border-primary/30"
        >
          <ExternalLink className="h-4 w-4" />
          لینک خارجی
        </a>
      )}
      {listSlug && (
        <button
          type="button"
          onClick={onClose}
          className="py-1 wibe-caption font-medium text-wibe-secondary transition-colors hover:text-primary"
        >
          ادامه مرور لیست
        </button>
      )}
    </div>
  );
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
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onPrev) onPrev();
      if (e.key === 'ArrowLeft' && onNext) onNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onPrev, onNext, onClose]);

  if (!item) return null;

  const meta = (item.metadata ?? {}) as Record<string, string | number>;
  const chips = buildMetaChips(meta);
  const desc = item.description?.trim();
  const imdbRating = meta.imdbRating ? String(meta.imdbRating) : null;

  const rankLabel =
    itemIndex != null && totalItems != null
      ? `${(itemIndex + 1).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')}`
      : null;

  const headerSubtitle = [rankLabel, categoryName].filter(Boolean).join(' · ');

  const posterBlock = (
    <div className="relative shrink-0">
      <div className="overflow-hidden rounded-xl border border-wibe bg-gray-100 shadow-md">
        <div className="aspect-[2/3] w-full max-lg:mx-auto max-lg:max-w-[260px] lg:aspect-[3/4] lg:w-[11.5rem] xl:w-[12.5rem]">
          <PreviewPoster item={item} categorySlug={categorySlug} categoryIcon={categoryIcon} />
        </div>
      </div>
      {imdbRating && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 wibe-caption font-semibold text-white backdrop-blur-sm">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {imdbRating}
        </span>
      )}
    </div>
  );

  const detailsBlock = (
    <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-3.5">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-lg:justify-center lg:justify-start">
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
        <p className="px-0.5 text-right wibe-small leading-7 text-wibe-secondary">{desc}</p>
      ) : (
        <p className="px-0.5 text-center wibe-caption text-wibe-secondary lg:text-right">توضیحی ثبت نشده</p>
      )}

      <div className="mt-auto max-lg:hidden">
        <PreviewActions item={item} listSlug={listSlug} onClose={onClose} />
      </div>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      subtitle={headerSubtitle || undefined}
      maxHeight="92vh"
      desktopMaxWidth="lg"
      headerAction={
        (onPrev || onNext) && isDesktop ? (
          <div className="flex items-center gap-1">
            {onPrev && <NavButton direction="prev" onClick={onPrev} />}
            {onNext && <NavButton direction="next" onClick={onNext} />}
          </div>
        ) : undefined
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-2 lg:px-0 lg:pt-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <div className="relative flex shrink-0 flex-col items-center gap-3 lg:items-start">
              {posterBlock}
              {(onPrev || onNext) && !isDesktop && (
                <div className="flex items-center justify-center gap-3">
                  {onPrev && <NavButton direction="prev" onClick={onPrev} />}
                  {onNext && <NavButton direction="next" onClick={onNext} />}
                </div>
              )}
            </div>
            {detailsBlock}
          </div>
        </div>

        <div className="shrink-0 px-[5px] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 lg:hidden">
          <PreviewActions item={item} listSlug={listSlug} onClose={onClose} />
        </div>
      </div>
    </BottomSheet>
  );
}
