'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import Link from 'next/link';
import {
  Share2,
  Heart,
  Bookmark,
  ChevronLeft,
  ExternalLink,
  List,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ItemCoverImage from '@/components/shared/ItemCoverImage';
import ItemMetadataFacts from '@/components/shared/ItemMetadataFacts';
import ItemTipCard from '@/components/shared/ItemTipCard';
import CommentSection from '@/components/mobile/comments/CommentSection';
import ItemDiscoverySection from '@/components/mobile/items/ItemDiscoverySection';
import ItemDetailTopActions from '@/components/mobile/items/ItemDetailTopActions';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import Toast from '@/components/shared/Toast';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';
import {
  buildItemMetadataFacts,
  buildLightweightDisplayBody,
  extractItemTip,
  parseTipAsMetadataFact,
} from '@/lib/item-metadata-display';
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
import type { SimilarItem, TrendingItem, AlsoLikedItem } from '@/types/items';

const HERO_COLLAPSE_SCROLL_Y = 120;
const DESCRIPTION_TRUNCATE = 180;

function displayRating(rating: number | null | undefined): string | null {
  if (rating == null || Number(rating) === 0) return null;
  return String(rating);
}

interface ItemDetailClientProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    displayImageUrl: string;
    externalUrl: string | null;
    catalogItemId?: string | null;
    listNote?: string | null;
    rating: number | null;
    voteCount: number | null;
    metadata: Record<string, unknown> | null;
    commentCount: number;
    listRank: number | null;
    listItemCount: number;
    personalSaveCount: number;
    lists: {
      id: string;
      title: string;
      slug: string;
      saveCount: number;
      categories: {
        id: string;
        name: string;
        slug: string;
        icon: string;
        color: string;
      } | null;
    };
    users: { name: string | null } | null;
  };
}

function ItemSidebarPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-wibe/70 bg-wibe-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function ItemDetailClient({ item }: ItemDetailClientProps) {
  const isDesktop = useIsDesktop();
  const { status: authStatus } = useSession();
  const pathname = usePathname();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${item.id}`)}`;
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const onCommentsUpdate = () => setCommentRefreshTrigger((t) => t + 1);

  const categoryId = item.lists.categories?.id ?? null;

  const { data: similarItems = [], isLoading: similarLoading } = useQuery({
    queryKey: ['items', item.id, 'similar'],
    queryFn: async (): Promise<SimilarItem[]> => {
      const res = await fetch(`/api/items/${item.id}/similar`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingRaw = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['categories', categoryId, 'trending'],
    queryFn: async (): Promise<TrendingItem[]> => {
      const res = await fetch(`/api/categories/${categoryId}/trending`);
      const json = await res.json();
      const list = json.data && Array.isArray(json.data) ? (json.data as TrendingItem[]) : [];
      return list.filter((t) => t.id !== item.id);
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
  const trendingItems = trendingRaw;

  const { data: alsoLikedItems = [], isLoading: alsoLikedLoading } = useQuery({
    queryKey: ['items', item.id, 'also-liked'],
    queryFn: async (): Promise<AlsoLikedItem[]> => {
      const res = await fetch(`/api/items/${item.id}/also-liked`);
      const json = await res.json();
      return json.data && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryName = item.lists.categories?.name ?? null;
  const listCategorySlug = item.lists.categories?.slug ?? null;
  const itemCategorySlug =
    sourceCategorySlugFromItem({
      metadata: item.metadata,
      catalogItemId: item.catalogItemId,
    }) ?? listCategorySlug;
  const entryKind = resolveEntryKind(item);
  const isLightweight = isLightweightListItem(item);
  const isLifestyle = isLifestyleCategory(listCategorySlug);
  const meta = (item.metadata || {}) as Record<string, string | number>;
  const year = meta.year ?? null;
  const ratingLabel = displayRating(
    item.rating ?? (meta.imdbRating as number | undefined) ?? null
  );
  const genre = meta.genre ?? categoryName;
  const likeCount = item.voteCount ?? 0;
  const baseMetadataFacts = isLightweight
    ? []
    : buildItemMetadataFacts(item.metadata, itemCategorySlug, {
        fallbackImdbRating: meta.imdbRating ?? item.rating,
      });
  const itemTip = extractItemTip(item.metadata);
  const tipAsFact = parseTipAsMetadataFact(itemTip);
  const displayMetadataFacts = useMemo(() => {
    if (!tipAsFact) return baseMetadataFacts;
    if (baseMetadataFacts.some((f) => f.key === 'translator')) return baseMetadataFacts;
    return [...baseMetadataFacts, tipAsFact];
  }, [baseMetadataFacts, tipAsFact]);
  const displayTip = tipAsFact ? null : itemTip;
  const listNote = item.listNote?.trim() || null;
  const factTypeRaw = item.metadata?.factType;
  const factLabel =
    typeof factTypeRaw === 'string'
      ? FACT_TYPE_LABELS[factTypeRaw as FactType] ?? factTypeRaw
      : null;
  const bodyText = isLightweight
    ? buildLightweightDisplayBody(item, { lifestyleMode: isLifestyle }) || null
    : item.description?.trim() || null;

  const canTruncateDescription =
    !!bodyText && bodyText.length > DESCRIPTION_TRUNCATE;
  const shortDescription =
    canTruncateDescription && !descriptionExpanded
      ? bodyText!.slice(0, DESCRIPTION_TRUNCATE) + '…'
      : bodyText;

  const hasSocialProof =
    (item.listRank != null && item.listItemCount > 0) ||
    likeCount > 0 ||
    item.personalSaveCount > 0;

  const breadcrumbItems = useMemo(
    () => [
      { label: 'خانه', href: '/' },
      ...(item.lists.categories
        ? [
            {
              label: item.lists.categories.name,
              href: `/categories/${item.lists.categories.slug}`,
            },
          ]
        : []),
      { label: item.lists.title, href: `/lists/${item.lists.slug}` },
      { label: item.title?.trim() || 'آیتم' },
    ],
    [item.lists.categories, item.lists.slug, item.lists.title, item.title]
  );

  useEffect(() => {
    if (isDesktop) {
      setHeroCollapsed(false);
      return;
    }
    const onScroll = () => setHeroCollapsed(window.scrollY > HERO_COLLAPSE_SCROLL_Y);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDesktop]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setToast({ message: 'لینک کپی شد ✨', type: 'success' });
        return;
      }
    } catch {
      /* fall through */
    }

    setToast({ message: 'اشتراک‌گذاری ممکن نشد', type: 'error' });
  };

  const listContextCard = (
    <ItemSidebarPanel>
      <p className="mb-2 wibe-caption font-medium text-wibe-secondary">در لیست</p>
      <Link
        href={`/lists/${item.lists.slug}`}
        className="group flex items-start gap-3 rounded-xl border border-wibe bg-wibe-surface p-3 transition-colors hover:border-primary/25 hover:bg-primary/5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
          {item.lists.categories?.icon || '📋'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 wibe-small font-semibold text-foreground group-hover:text-primary">
            {item.lists.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 wibe-caption text-wibe-secondary">
            {item.listRank != null && item.listItemCount > 0 && (
              <span className="font-semibold text-primary">
                #{item.listRank.toLocaleString('fa-IR')} از{' '}
                {item.listItemCount.toLocaleString('fa-IR')}
              </span>
            )}
            <span>{item.lists.saveCount.toLocaleString('fa-IR')} ذخیره</span>
          </p>
        </div>
        <ChevronLeft className="mt-1 h-4 w-4 shrink-0 rotate-180 text-wibe-secondary opacity-60" />
      </Link>
      {item.users?.name && (
        <p className="mt-2 wibe-caption text-wibe-secondary">
          کیوریتور: <span className="font-medium text-foreground">{item.users.name}</span>
        </p>
      )}
    </ItemSidebarPanel>
  );

  const detailsSection = (
    <section className="space-y-4 lg:rounded-2xl lg:border lg:border-wibe/60 lg:bg-wibe-card lg:p-5 lg:shadow-sm">
      {hasSocialProof && (
        <div className="flex flex-wrap justify-start gap-1.5 lg:hidden">
          {item.listRank != null && item.listItemCount > 0 && (
            <Link
              href={`/lists/${item.lists.slug}`}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 wibe-caption font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              #{item.listRank.toLocaleString('fa-IR')} از{' '}
              {item.listItemCount.toLocaleString('fa-IR')}
            </Link>
          )}
          {likeCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
              <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden />
              {likeCount.toLocaleString('fa-IR')} پسند
            </span>
          )}
          {item.personalSaveCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 wibe-caption text-foreground">
              <Bookmark className="h-3.5 w-3.5 text-primary" aria-hidden />
              {item.personalSaveCount.toLocaleString('fa-IR')} ذخیره
            </span>
          )}
        </div>
      )}

      {displayMetadataFacts.length > 0 && (
        <ItemMetadataFacts
          facts={displayMetadataFacts}
          variant={isDesktop ? 'grid' : 'chips'}
        />
      )}

      {displayTip && !isLightweight && (
        <ItemTipCard tip={displayTip} variant="highlight" />
      )}
      {listNote && listNote !== bodyText && !(isLightweight && isLifestyle) && (
        <ItemTipCard tip={listNote} variant="note" />
      )}

      {bodyText ? (
        <div className="text-start">
          <h2 className="mb-2 wibe-small font-semibold text-foreground">درباره</h2>
          <p className="text-[0.9375rem] leading-[1.85] text-foreground/80 whitespace-pre-line">
            {shortDescription}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-start gap-3">
            {canTruncateDescription && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="wibe-caption font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                {descriptionExpanded ? 'کمتر' : 'بیشتر بخوان'}
              </button>
            )}
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  isLightweight && entryKind === 'link'
                    ? 'inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 wibe-small font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark'
                    : 'inline-flex items-center gap-1 wibe-caption font-medium text-primary hover:underline'
                }
              >
                {isLightweight && entryKind === 'link' && (
                  <ExternalLink className="h-4 w-4" aria-hidden />
                )}
                {isLightweight && entryKind === 'link' ? 'باز کردن لینک' : 'منبع خارجی'}
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="py-2 text-start wibe-caption text-wibe-secondary">
          هنوز توضیحی ثبت نشده
        </p>
      )}
    </section>
  );

  return (
    <>
      <main className="pb-2" dir="rtl">
        <div className="px-4 pt-2 lg:px-0 lg:pt-3">
          <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
          <PageBreadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        {isLightweight ? (
          <section
            className={`relative overflow-hidden rounded-b-2xl px-4 pb-5 pt-4 lg:rounded-2xl lg:px-6 lg:pb-6 lg:pt-5 ${
              isLifestyle
                ? 'bg-wibe-surface'
                : 'bg-gradient-to-br from-amber-50 via-white to-violet-50'
            }`}
          >
            <button
              type="button"
              onClick={handleShare}
              className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm transition-colors hover:bg-white active:scale-95"
              aria-label="اشتراک‌گذاری"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <Link
              href={`/lists/${item.lists.slug}`}
              className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 wibe-caption font-medium text-wibe-secondary shadow-sm"
            >
              <List className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{item.lists.title}</span>
            </Link>

            {isLifestyle ? (
              item.title?.trim() && (
                <h1 className="pe-12 text-xl font-bold leading-snug text-foreground sm:text-2xl">
                  {item.title}
                </h1>
              )
            ) : (
              <div className="flex items-start gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-amber-200/70">
                  {entryKindIcon(entryKind)}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex rounded-md bg-white/90 px-2 py-0.5 wibe-caption font-semibold text-wibe-secondary shadow-sm">
                      {entryKindBadgeLabel(entryKind)}
                    </span>
                    {factLabel && (
                      <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 wibe-caption font-semibold text-violet-700">
                        {factLabel}
                      </span>
                    )}
                  </div>
                  {item.title?.trim() && (
                    <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
                      {item.title}
                    </h1>
                  )}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section
            className={`relative w-full overflow-hidden transition-[height] duration-500 ease-out lg:!h-[min(280px,34vh)] lg:rounded-2xl lg:transition-none ${
              heroCollapsed ? 'h-[5.5rem]' : 'h-[18rem] sm:h-[20rem]'
            }`}
          >
            <div className="absolute inset-0">
              <ItemCoverImage
                itemId={item.id}
                imageUrl={item.imageUrl}
                title={item.title}
                metadata={item.metadata}
                categorySlug={itemCategorySlug}
                enrichPoster={isMovieLikeCategory(itemCategorySlug)}
                priority
                fallbackIcon={item.lists.categories?.icon || '📋'}
                className={`h-full w-full object-cover object-top transition-transform duration-500 ease-out ${
                  heroCollapsed ? 'scale-100' : 'scale-105'
                }`}
              />
            </div>

            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/10 transition-opacity duration-500 lg:from-black/88 lg:via-black/35 ${
                heroCollapsed ? 'opacity-95' : 'opacity-100'
              }`}
            />

            <button
              type="button"
              onClick={handleShare}
              className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/50 active:scale-95 lg:end-4 lg:top-4 lg:h-10 lg:w-10"
              aria-label="اشتراک‌گذاری"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <div className="absolute inset-0 flex flex-col justify-end p-4 pb-4 text-start text-white lg:p-6 lg:pb-5">
              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  heroCollapsed
                    ? 'max-h-0 opacity-0 pointer-events-none'
                    : 'mb-2 max-h-12 opacity-100'
                }`}
              >
                <Link
                  href={`/lists/${item.lists.slug}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1 wibe-caption font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <span>{item.lists.categories?.icon || '📋'}</span>
                  <span className="truncate">{item.lists.title}</span>
                </Link>
              </div>

              <h1
                className={`leading-tight text-white transition-all duration-500 ease-out ${
                  heroCollapsed
                    ? 'line-clamp-1 text-base font-bold'
                    : 'text-xl font-bold sm:text-2xl lg:text-[1.65rem] lg:leading-snug'
                }`}
              >
                {item.title}
              </h1>

              <div
                className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 overflow-hidden wibe-caption text-white/90 transition-all duration-500 ease-out ${
                  heroCollapsed
                    ? 'mt-0 max-h-0 opacity-0'
                    : 'mt-1.5 max-h-10 opacity-100'
                }`}
              >
                {(genre || categoryName) && <span>{String(genre || categoryName)}</span>}
                {year != null && (
                  <>
                    {(genre || categoryName) && <span className="text-white/40">·</span>}
                    <span>{String(year)}</span>
                  </>
                )}
                {ratingLabel && (
                  <>
                    <span className="text-white/40">·</span>
                    <span>⭐ {ratingLabel}</span>
                  </>
                )}
                {item.listRank != null && item.listItemCount > 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span>
                      #{item.listRank.toLocaleString('fa-IR')} از{' '}
                      {item.listItemCount.toLocaleString('fa-IR')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* موبایل: نوار اکشن چسبان */}
        {!isLightweight && (
          <div className="lg:hidden">
            <ItemDetailTopActions itemId={item.id} likeCount={likeCount} variant="bar" />
          </div>
        )}

        <div className="relative z-10 mt-4 flex flex-col gap-5 px-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-8 lg:px-0 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            {isLightweight && (
              <div className="rounded-2xl border border-wibe/70 bg-wibe-card px-3 py-2.5 shadow-sm">
                <ItemDetailTopActions itemId={item.id} likeCount={likeCount} variant="inline" />
              </div>
            )}

            {authStatus === 'unauthenticated' && (
              <Link
                href={loginHref}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 wibe-small text-foreground transition-colors hover:bg-primary/10"
              >
                <span>برای ذخیره، پسند و نظر وارد شو</span>
                <span className="shrink-0 font-semibold text-primary">ورود</span>
              </Link>
            )}

            {detailsSection}

            <ItemDiscoverySection
              categorySlug={itemCategorySlug}
              similarItems={similarItems}
              similarLoading={similarLoading}
              alsoLikedItems={alsoLikedItems}
              alsoLikedLoading={alsoLikedLoading}
              trendingItems={trendingItems}
              trendingLoading={trendingLoading}
            />

            <section className="scroll-mt-16 border-t border-wibe/70 pt-5 lg:hidden">
              <CommentSection
                itemId={item.id}
                onCommentAdded={onCommentsUpdate}
                refreshTrigger={commentRefreshTrigger}
                embeddedInPanel
              />
            </section>
          </div>

          <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-[6.5rem] lg:self-start">
            <ItemSidebarPanel>
              <p className="mb-3 wibe-caption font-medium text-wibe-secondary">تعامل</p>
              <ItemDetailTopActions itemId={item.id} likeCount={likeCount} variant="inline" />
              {(likeCount > 0 || item.personalSaveCount > 0) && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-wibe/60 pt-3">
                  {likeCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 wibe-caption text-foreground">
                      <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden />
                      {likeCount.toLocaleString('fa-IR')} پسند
                    </span>
                  )}
                  {item.personalSaveCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 wibe-caption text-foreground">
                      <Bookmark className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {item.personalSaveCount.toLocaleString('fa-IR')} ذخیره
                    </span>
                  )}
                </div>
              )}
            </ItemSidebarPanel>

            {listContextCard}

            <section className="scroll-mt-16 rounded-2xl border border-wibe/60 bg-wibe-card p-5 shadow-sm">
              <CommentSection
                itemId={item.id}
                onCommentAdded={onCommentsUpdate}
                refreshTrigger={commentRefreshTrigger}
                embeddedInPanel
              />
            </section>
          </aside>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
