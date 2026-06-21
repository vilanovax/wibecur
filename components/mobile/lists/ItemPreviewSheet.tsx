'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Star } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ItemCoverPlaceholder from '@/components/shared/ItemCoverPlaceholder';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import { resolveImageDisplaySrc } from '@/lib/image-url-policy';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import {
  buildItemMetadataChips,
  buildLightweightDisplayBody,
  extractItemTip,
  shouldShowSeparateTipCard,
} from '@/lib/item-metadata-display';
import ItemTipCard from '@/components/shared/ItemTipCard';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import { buildListItemQuickActions } from '@/lib/list-item-quick-actions';
import { trackItemPreviewOpen } from '@/lib/analytics';
import {
  entryKindBadgeLabel,
  entryKindIcon,
  FACT_TYPE_LABELS,
  isLifestyleCategory,
  isLightweightListItem,
  resolveEntryKind,
  sourceCategorySlugFromItem,
  type FactType,
} from '@/lib/list-entry';

export type ItemPreviewData = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  displayImageUrl?: string | null;
  catalogItemId?: string | null;
  listNote?: string | null;
  rating?: number;
  voteCount?: number;
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

function MetadataChip({
  label,
  value,
  href,
  profileLinks,
}: {
  label: string;
  value: string;
  href?: string;
  profileLinks?: Array<{ name: string; href: string }>;
}) {
  if (profileLinks?.length) {
    return (
      <span className="inline-flex max-w-full flex-wrap items-baseline gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 wibe-caption leading-snug text-right">
        <span className="shrink-0 font-medium text-foreground/55">{label}</span>
        <span className="min-w-0 font-semibold text-foreground">
          {profileLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? <span className="text-foreground/40"> · </span> : null}
              <Link href={link.href} className="text-primary hover:underline">
                {link.name}
              </Link>
            </span>
          ))}
        </span>
      </span>
    );
  }

  const content = (
    <>
      <span className="shrink-0 font-medium text-foreground/55">{label}</span>
      <span className={`min-w-0 font-semibold ${href ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </>
  );

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link href={href} className="inline-flex max-w-full items-baseline gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 wibe-caption leading-snug text-right">
          {content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-baseline gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 wibe-caption leading-snug text-right"
      >
        {content}
      </a>
    );
  }

  return (
    <span className="inline-flex max-w-full items-baseline gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 wibe-caption leading-snug text-right">
      {content}
    </span>
  );
}

function PreviewActions({
  item,
  onClose,
  className = '',
  layout = 'stacked',
  externalUrl,
  categorySlug,
}: {
  item: ItemPreviewData;
  onClose: () => void;
  className?: string;
  layout?: 'stacked' | 'inline';
  externalUrl?: string | null;
  categorySlug?: string | null;
}) {
  const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

  const quickActionsRow =
    quickActions.length > 0 ? (
      <ListItemQuickActions
        actions={quickActions}
        size="md"
        className={layout === 'inline' ? 'shrink-0' : 'justify-start'}
      />
    ) : null;

  const actionButtons = (
    <>
      <ItemSaveButton itemId={item.id} />
      <ItemLikeButton
        itemId={item.id}
        initialLikeCount={item.voteCount ?? 0}
        variant="compact"
      />
    </>
  );

  const fullPageLink = (
    <Link
      href={`/items/${item.id}`}
      onClick={onClose}
      className={`flex min-w-0 items-center justify-center rounded-xl bg-primary py-3 wibe-small font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.99] ${
        layout === 'inline' ? 'flex-1' : 'w-full'
      }`}
    >
      مشاهده صفحه کامل
    </Link>
  );

  const externalLink =
    externalUrl?.trim() ? (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 py-3 wibe-small font-semibold text-primary transition-all active:scale-[0.99] ${
          layout === 'inline' ? 'flex-1' : 'w-full'
        }`}
      >
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        باز کردن لینک
      </a>
    ) : null;

  if (layout === 'inline') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {quickActionsRow}
        <div className="flex items-center gap-2" aria-label="عملیات آیتم">
          {actionButtons}
          {externalLink}
          {fullPageLink}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {quickActionsRow}
      <div className="flex items-center justify-start gap-2.5" aria-label="ذخیره و پسندیدن">
        {actionButtons}
      </div>
      {externalLink}
      {fullPageLink}
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
  const previewTrackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    if (previewTrackedId.current === item.id) return;
    previewTrackedId.current = item.id;
    trackItemPreviewOpen({
      item_id: item.id,
      list_slug: listSlug,
      category_slug: categorySlug ?? undefined,
      position: itemIndex != null ? itemIndex + 1 : undefined,
    });
  }, [isOpen, item, listSlug, categorySlug, itemIndex]);

  useEffect(() => {
    if (!isOpen) previewTrackedId.current = null;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!item) return null;

  const entryKind = resolveEntryKind(item);
  const isLightweight = isLightweightListItem(item);
  const itemCategorySlug = sourceCategorySlugFromItem(item) ?? categorySlug;
  const isLifestyle = isLifestyleCategory(categorySlug);

  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const chips = buildItemMetadataChips(meta, itemCategorySlug, {
    fallbackImdbRating: meta.imdbRating ?? item.rating,
  });
  const itemTip = extractItemTip(meta);
  const listNote = item.listNote?.trim() || null;
  const desc = isLightweight
    ? buildLightweightDisplayBody(item, { lifestyleMode: isLifestyle }) ||
      (!item.title?.trim() ? itemTip : null)
    : item.description?.trim() || null;
  const showSeparateTip =
    isLightweight &&
    !isLifestyle &&
    shouldShowSeparateTipCard(item, { lifestyleMode: false });
  const imdbRating =
    meta.imdbRating != null && String(meta.imdbRating).trim()
      ? String(meta.imdbRating)
      : item.rating != null && Number(item.rating) > 0
        ? String(item.rating)
        : null;

  const factTypeRaw = meta.factType;
  const factLabel =
    typeof factTypeRaw === 'string'
      ? FACT_TYPE_LABELS[factTypeRaw as FactType] ?? factTypeRaw
      : null;

  const rankLabel =
    itemIndex != null && totalItems != null
      ? `${(itemIndex + 1).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')}`
      : null;

  const headerSubtitle = [rankLabel, categoryName].filter(Boolean).join(' · ');
  const sheetTitle = item.title?.trim() || (isLightweight ? entryKindBadgeLabel(entryKind) : item.title);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      subtitle={headerSubtitle || undefined}
      maxHeight="92vh"
      desktopMaxWidth="lg"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" dir="rtl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2 text-right lg:px-0 lg:pt-0 lg:pb-0">
          {isLightweight ? (
            <div className="flex flex-col gap-4">
              {!isLifestyle && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-amber-200/60">
                    {entryKindIcon(entryKind)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-md bg-white/80 px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary ring-1 ring-amber-200/50">
                        {entryKindBadgeLabel(entryKind)}
                      </span>
                      {factLabel && (
                        <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 wibe-caption font-semibold text-violet-700">
                          {factLabel}
                        </span>
                      )}
                    </div>
                    {item.title?.trim() && (
                      <h3 className="wibe-h3 font-bold text-foreground">{item.title}</h3>
                    )}
                  </div>
                </div>
              )}

              {desc ? (
                <p
                  className={`text-right text-[0.9375rem] leading-[1.85] text-foreground/80 whitespace-pre-line ${
                    isLifestyle ? 'pt-0.5' : ''
                  }`}
                >
                  {desc}
                </p>
              ) : (
                <p className="wibe-caption text-wibe-secondary text-right">متنی ثبت نشده</p>
              )}

              {!isLifestyle && listNote && listNote !== desc && (
                <ItemTipCard tip={listNote} className="text-right" />
              )}
              {showSeparateTip && itemTip && (
                <ItemTipCard tip={itemTip} className="text-right" />
              )}

              <div className="max-lg:hidden">
                <PreviewActions
                  item={item}
                  onClose={onClose}
                  externalUrl={item.externalUrl}
                  categorySlug={itemCategorySlug}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-7">
              <div className="relative mx-auto shrink-0 lg:mx-0">
                <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-lg ring-1 ring-black/5">
                  <div className="aspect-[2/3] w-[min(72vw,220px)] lg:aspect-[3/4] lg:w-[11.5rem] xl:w-[12.5rem]">
                    <PreviewPoster
                      item={item}
                      categorySlug={itemCategorySlug}
                      categoryIcon={categoryIcon}
                    />
                  </div>
                </div>
                {imdbRating && (
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 wibe-caption font-bold text-white backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-warning text-warning" aria-hidden />
                    {imdbRating}
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3.5 lg:gap-4 lg:pt-1">
                {chips.length > 0 && (
                  <div className="flex flex-wrap justify-start gap-1.5">
                    {chips.map(({ key, label, value, href, profileLinks }) => (
                      <MetadataChip
                        key={key}
                        label={label}
                        value={value}
                        href={href}
                        profileLinks={profileLinks}
                      />
                    ))}
                  </div>
                )}

                {itemTip && <ItemTipCard tip={itemTip} className="text-right" />}
                {listNote && <ItemTipCard tip={listNote} className="text-right" />}

                {desc ? (
                  <p className="text-right text-[0.9375rem] leading-[1.8] text-foreground/75">{desc}</p>
                ) : (
                  <p className="wibe-caption text-wibe-secondary text-right">توضیحی ثبت نشده</p>
                )}

                <div className="mt-1 max-lg:hidden">
                  <PreviewActions
                    item={item}
                    onClose={onClose}
                    externalUrl={item.externalUrl}
                    categorySlug={itemCategorySlug}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative shrink-0 lg:hidden">
          <div
            className="pointer-events-none absolute -top-6 inset-x-0 h-6 bg-gradient-to-t from-wibe-card to-transparent"
            aria-hidden
          />
          <div className="border-t border-wibe/50 bg-wibe-card px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <PreviewActions
              item={item}
              onClose={onClose}
              layout="inline"
              externalUrl={item.externalUrl}
              categorySlug={itemCategorySlug}
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
