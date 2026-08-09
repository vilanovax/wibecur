'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ExternalLink, Star } from 'lucide-react';
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

const DESC_CLAMP_CHARS = 180;

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
  return (
    <ItemCoverImage
      itemId={item.id}
      imageUrl={item.displayImageUrl ?? item.imageUrl}
      title={item.title}
      metadata={item.metadata}
      categorySlug={categorySlug}
      priority
      sizes="(min-width: 1024px) 12rem, 40vw"
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
      <span className="inline-flex max-w-full flex-wrap items-baseline gap-1 rounded-md bg-wibe-surface px-2 py-1 wibe-caption leading-snug text-right">
        <span className="shrink-0 text-wibe-secondary">{label}</span>
        <span className="min-w-0 font-medium text-foreground">
          {profileLinks.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? <span className="text-wibe-secondary/50"> · </span> : null}
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
      <span className="shrink-0 text-wibe-secondary">{label}</span>
      <span className={`min-w-0 font-medium ${href ? 'text-primary' : 'text-foreground'}`}>{value}</span>
    </>
  );

  const chipClass =
    'inline-flex max-w-full items-baseline gap-1 rounded-md bg-wibe-surface px-2 py-1 wibe-caption leading-snug text-right';

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link href={href} className={chipClass}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={chipClass}>
        {content}
      </a>
    );
  }

  return <span className={chipClass}>{content}</span>;
}

function ClampedText({
  text,
  resetKey,
  className = '',
}: {
  text: string;
  resetKey?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey, text]);

  const needsClamp = text.length > DESC_CLAMP_CHARS;
  const shown =
    !needsClamp || expanded ? text : `${text.slice(0, DESC_CLAMP_CHARS).trimEnd()}…`;

  return (
    <div className={className}>
      <p className="whitespace-pre-line text-right wibe-small leading-relaxed text-wibe-secondary">
        {shown}
      </p>
      {needsClamp ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 wibe-caption font-medium text-primary hover:underline"
        >
          {expanded ? 'کمتر' : 'بیشتر'}
        </button>
      ) : null}
    </div>
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

  const reactionButtons = (
    <>
      <ItemLikeButton
        itemId={item.id}
        initialLikeCount={item.voteCount ?? 0}
        variant="compact"
        deferViewerState
      />
      <ItemSaveButton itemId={item.id} deferViewerState showCountBadge={false} />
    </>
  );

  const fullPageLink = (
    <Link
      href={`/items/${item.id}`}
      onClick={onClose}
      className={`flex min-w-0 items-center justify-center rounded-xl bg-primary py-2.5 wibe-small font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.99] ${
        layout === 'inline' ? 'min-w-[7.5rem] flex-1' : 'w-full'
      }`}
    >
      مشاهده
    </Link>
  );

  const externalLink = externalUrl?.trim() ? (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-w-0 items-center justify-center gap-1 rounded-xl border border-wibe bg-wibe-card py-2.5 wibe-small font-medium text-foreground transition-[colors,transform] hover:border-primary/30 active:scale-[0.99] ${
        layout === 'inline' ? 'px-3' : 'w-full'
      }`}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-wibe-secondary" aria-hidden />
      منبع
    </a>
  ) : null;

  if (layout === 'inline') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {quickActionsRow}
        {/* RTL: مشاهده اول = سمت راست (اصلی) */}
        <div className="flex items-center gap-2" aria-label="عملیات آیتم">
          {fullPageLink}
          {externalLink}
          <div className="ms-auto flex items-center gap-1.5">{reactionButtons}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {quickActionsRow}
      <div className="flex items-center gap-2" aria-label="ذخیره و پسندیدن">
        {reactionButtons}
      </div>
      <div className="flex gap-2">
        {fullPageLink}
        {externalLink}
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
      ? `${(itemIndex + 1).toLocaleString('fa-IR')} / ${totalItems.toLocaleString('fa-IR')}`
      : null;

  const headerNav =
    onPrev || onNext ? (
      <div className="flex items-center gap-0.5">
        {positionLabel ? (
          <span className="me-1 tabular-nums wibe-caption text-wibe-secondary">{positionLabel}</span>
        ) : null}
        <button
          type="button"
          onClick={onPrev}
          disabled={!onPrev}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-wibe-surface disabled:opacity-30"
          aria-label="آیتم قبلی"
        >
          <ChevronRight className="h-4 w-4 text-wibe-secondary" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-wibe-surface disabled:opacity-30"
          aria-label="آیتم بعدی"
        >
          <ChevronLeft className="h-4 w-4 text-wibe-secondary" />
        </button>
      </div>
    ) : null;

  const footerActions = (
    <div className="px-4 pt-2.5 lg:hidden">
      <PreviewActions
        item={item}
        onClose={onClose}
        layout="inline"
        externalUrl={item.externalUrl}
        categorySlug={itemCategorySlug}
      />
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      maxHeight="88vh"
      desktopMaxWidth="lg"
      headerAction={headerNav}
      footer={footerActions}
    >
      <div className="px-4 pb-3 pt-2 text-right lg:px-0 lg:pb-1 lg:pt-0" dir="rtl">
        {isLightweight ? (
          <div className="flex flex-col gap-3">
            {!isLifestyle && (
              <div className="flex items-start gap-2.5 rounded-xl border border-wibe bg-wibe-surface/60 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wibe-card text-xl ring-1 ring-wibe">
                  {entryKindIcon(entryKind)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-1">
                    <span className="inline-flex rounded-md bg-wibe-card px-1.5 py-0.5 wibe-caption font-medium text-wibe-secondary">
                      {entryKindBadgeLabel(entryKind)}
                    </span>
                    {factLabel ? (
                      <span className="inline-flex rounded-md bg-wibe-card px-1.5 py-0.5 wibe-caption font-medium text-wibe-secondary">
                        {factLabel}
                      </span>
                    ) : null}
                  </div>
                  {item.title?.trim() ? (
                    <h3 className="wibe-small font-bold text-foreground">{item.title}</h3>
                  ) : null}
                </div>
              </div>
            )}

            {desc ? (
              <ClampedText text={desc} resetKey={item.id} />
            ) : (
              <p className="wibe-caption text-wibe-secondary">متنی ثبت نشده</p>
            )}

            {!isLifestyle && listNote && listNote !== desc ? (
              <ItemTipCard tip={listNote} className="text-right" />
            ) : null}
            {showSeparateTip && itemTip ? (
              <ItemTipCard tip={itemTip} variant="highlight" className="text-right" />
            ) : null}

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 lg:gap-6">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="overflow-hidden rounded-xl bg-wibe-surface ring-1 ring-black/5">
                <div className="aspect-[2/3] w-[7.5rem] sm:w-[8.5rem] lg:w-[11rem] xl:w-[12rem]">
                  <PreviewPoster
                    item={item}
                    categorySlug={itemCategorySlug}
                    categoryIcon={categoryIcon}
                  />
                </div>
              </div>
              {imdbRating ? (
                <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 wibe-caption font-bold backdrop-blur-sm">
                  <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="text-amber-400 tabular-nums">{imdbRating}</span>
                </span>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2.5 lg:gap-3 lg:pt-0.5">
              {chips.length > 0 ? (
                <div className="flex flex-wrap justify-start gap-1">
                  {chips.slice(0, 4).map(({ key, label, value, href, profileLinks }) => (
                    <MetadataChip
                      key={key}
                      label={label}
                      value={value}
                      href={href}
                      profileLinks={profileLinks}
                    />
                  ))}
                </div>
              ) : null}

              {itemTip ? <ItemTipCard tip={itemTip} variant="highlight" className="text-right" /> : null}
              {listNote ? <ItemTipCard tip={listNote} className="text-right" /> : null}

              {desc ? (
                <ClampedText text={desc} resetKey={item.id} />
              ) : (
                <p className="wibe-caption text-wibe-secondary">توضیحی ثبت نشده</p>
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
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
