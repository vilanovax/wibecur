'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ExternalLink, Star } from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ItemCoverImage from '@/components/shared/ItemCoverImage';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import {
  buildItemMetadataChips,
  buildLightweightDisplayBody,
  extractItemTip,
  resolveImdbRatingDisplay,
  shouldShowSeparateTipCard,
} from '@/lib/item-metadata-display';
import ItemTipCard from '@/components/shared/ItemTipCard';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import { buildListItemQuickActions } from '@/lib/list-item-quick-actions';
import { trackItemPreviewOpen } from '@/lib/analytics';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
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

const CHIP_CLASS =
  'inline-flex max-w-full items-baseline gap-1.5 rounded-xl border border-wibe/80 bg-wibe-surface px-3 py-2 wibe-caption leading-snug text-right transition-colors';

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
  return (
    <ItemCoverImage
      itemId={item.id}
      imageUrl={item.displayImageUrl ?? item.imageUrl}
      title={item.title}
      metadata={item.metadata}
      categorySlug={categorySlug}
      priority
      sizes="(min-width: 1024px) 12rem, 48vw"
      fallbackIcon={categoryIcon ?? '🎬'}
      coverLayout="grid"
      className={`h-full w-full ${className}`}
    />
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
      <span className={CHIP_CLASS}>
        <span className="shrink-0 text-wibe-secondary">{label}</span>
        <span className="min-w-0 font-semibold text-foreground">
          {profileLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? <span className="text-wibe-secondary/40"> · </span> : null}
              <Link
                href={link.href}
                className="text-primary underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
              >
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
      <span className="shrink-0 text-wibe-secondary">{label}</span>
      <span className={`min-w-0 font-semibold ${href ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </span>
    </>
  );

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link
          href={href}
          className={`${CHIP_CLASS} hover:border-primary/25 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
        >
          {content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CHIP_CLASS} hover:border-primary/25 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
      >
        {content}
      </a>
    );
  }

  return <span className={CHIP_CLASS}>{content}</span>;
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
  const hasExternal = Boolean(externalUrl?.trim());

  const quickActionsRow =
    quickActions.length > 0 ? (
      <ListItemQuickActions
        actions={quickActions}
        size="md"
        className={layout === 'inline' ? 'shrink-0' : 'justify-start'}
      />
    ) : null;

  const reactButtons = (
    <div className="flex shrink-0 items-center gap-2" aria-label="ذخیره و پسندیدن">
      <ItemSaveButton itemId={item.id} deferViewerState />
      <ItemLikeButton
        itemId={item.id}
        initialLikeCount={item.voteCount ?? 0}
        variant="compact"
        deferViewerState
      />
    </div>
  );

  const fullPageLink = (
    <Link
      href={`/items/${item.id}`}
      onClick={onClose}
      className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-xl bg-primary px-4 py-3 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 active:scale-[0.99] ${
        layout === 'inline' ? 'flex-1' : 'w-full'
      }`}
    >
      مشاهده
      <ChevronLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
    </Link>
  );

  const externalLink = hasExternal ? (
    <a
      href={externalUrl!}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-wibe bg-wibe-surface px-3.5 py-3 wibe-small font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.99] ${
        layout === 'inline' ? '' : 'w-full'
      }`}
    >
      <ExternalLink className="h-4 w-4 shrink-0 text-wibe-secondary" aria-hidden />
      منبع
    </a>
  ) : null;

  if (layout === 'inline') {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`}>
        {quickActionsRow}
        <div className="flex items-center gap-2" aria-label="عملیات آیتم">
          {reactButtons}
          {externalLink}
          {fullPageLink}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {quickActionsRow}
      {reactButtons}
      <div className="flex flex-col gap-2 sm:flex-row">
        {externalLink}
        {fullPageLink}
      </div>
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
  listSlug,
  onPrev,
  onNext,
}: ItemPreviewSheetProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const previewTrackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    router.prefetch(`/items/${item.id}`);
  }, [isOpen, item, router]);

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
      if (e.key === 'ArrowRight' && onPrev) onPrev();
      if (e.key === 'ArrowLeft' && onNext) onNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

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
  const imdbRating = resolveImdbRatingDisplay(item.metadata, item.rating);

  const factTypeRaw = meta.factType;
  const factLabel =
    typeof factTypeRaw === 'string'
      ? FACT_TYPE_LABELS[factTypeRaw as FactType] ?? factTypeRaw
      : null;

  const sheetTitle = item.title?.trim() || (isLightweight ? entryKindBadgeLabel(entryKind) : item.title);
  const positionLabel =
    itemIndex != null && totalItems != null && totalItems > 0
      ? `${(itemIndex + 1).toLocaleString('fa-IR')} از ${totalItems.toLocaleString('fa-IR')}`
      : null;

  const mobileFooter = !isDesktop ? (
    <div className="px-4 pt-1">
      <PreviewActions
        item={item}
        onClose={onClose}
        layout="inline"
        externalUrl={item.externalUrl}
        categorySlug={itemCategorySlug}
      />
    </div>
  ) : undefined;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      subtitle={positionLabel ?? undefined}
      maxHeight="92vh"
      desktopMaxWidth="lg"
      footer={mobileFooter}
    >
      <div className="px-4 pt-3 pb-4 text-right lg:px-0 lg:pt-0 lg:pb-0" dir="rtl">
        {isLightweight ? (
          <div className="flex flex-col gap-5">
            {!isLifestyle && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-amber-200/60">
                  {entryKindIcon(entryKind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex rounded-lg bg-white/80 px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary ring-1 ring-amber-200/50">
                      {entryKindBadgeLabel(entryKind)}
                    </span>
                    {factLabel && (
                      <span className="inline-flex rounded-lg border border-wibe bg-wibe-surface px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary">
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
                className={`wibe-body whitespace-pre-line leading-relaxed text-foreground/80 ${
                  isLifestyle ? 'pt-0.5' : ''
                }`}
              >
                {desc}
              </p>
            ) : (
              <p className="wibe-caption text-wibe-secondary">متنی ثبت نشده</p>
            )}

            {!isLifestyle && listNote && listNote !== desc && (
              <ItemTipCard tip={listNote} className="text-right" />
            )}
            {showSeparateTip && itemTip && (
              <ItemTipCard tip={itemTip} variant="highlight" className="text-right" />
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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
            <div className="relative mx-auto w-fit shrink-0 lg:mx-0">
              <div className="overflow-hidden rounded-2xl bg-wibe-surface shadow-[0_8px_28px_-8px_rgba(15,23,42,0.28)] ring-1 ring-black/[0.06]">
                <div className="aspect-[2/3] w-[min(48vw,168px)] sm:w-[180px] lg:aspect-[3/4] lg:w-[11.5rem] xl:w-[12.5rem]">
                  <PreviewPoster
                    item={item}
                    categorySlug={itemCategorySlug}
                    categoryIcon={categoryIcon}
                  />
                </div>
              </div>
              {imdbRating && (
                <span className="absolute bottom-2.5 start-2.5 inline-flex items-center gap-1 rounded-lg bg-black/80 px-2 py-1 wibe-caption font-bold text-white shadow-sm backdrop-blur-sm">
                  <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="tabular-nums text-amber-300">{imdbRating}</span>
                </span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5 lg:pt-0.5">
              {chips.length > 0 && (
                <div className="flex flex-wrap justify-start gap-2" aria-label="جزئیات">
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

              {itemTip && <ItemTipCard tip={itemTip} variant="highlight" className="text-right" />}
              {listNote && <ItemTipCard tip={listNote} className="text-right" />}

              {desc ? (
                <p className="wibe-body max-w-prose leading-relaxed text-foreground/80">{desc}</p>
              ) : (
                <p className="wibe-caption text-wibe-secondary">توضیحی ثبت نشده</p>
              )}

              <div className="mt-auto max-lg:hidden">
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
    </BottomSheet>
  );
}
