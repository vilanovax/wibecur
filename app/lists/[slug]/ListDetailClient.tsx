'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useListScrollDepth } from '@/hooks/useListScrollDepth';
import { useInterestTracking } from '@/hooks/useInterestTracking';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDeferReady } from '@/hooks/useDeferReady';
import { useLazyInView } from '@/hooks/useLazyInView';
import { prefetchListSimilar } from '@/lib/list-similar-client';
import { Share2, MoreVertical, Flame, Bookmark, Plus, Settings, Link2, Flag, Lightbulb, Map, LayoutGrid, Check } from 'lucide-react';
import ListItemsGrid from '@/components/mobile/lists/ListItemsGrid';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import VibeCommentSectionLazy from '@/components/mobile/lists/VibeCommentSectionLazy';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import {
  ItemPreviewSheetLazy,
  ListItemsMapViewLazy,
  ListReportModalLazy,
  SuggestItemSearchLazy,
  ListSimilarListsSectionLazy,
  ListDetailSidebarLazy,
  type ItemPreviewData,
} from '@/components/mobile/lists/list-detail-lazy-sections';
import SearchInput from '@/components/mobile/search/SearchInput';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { getDisplayListTitle } from '@/lib/list-display-title';
import { filterItemsByQuery, LIST_INNER_SEARCH_MIN_ITEMS } from '@/lib/item-display-utils';
import { isLocationCategorySlug } from '@/lib/category-layout';
import { itemHasMapLocation } from '@/lib/list-item-quick-actions';
import { normalizeSearchQuery } from '@/lib/list-search';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { ListPagePlacements } from '@/lib/sponsored-placements';
import { isLifestyleCategory, sourceCategorySlugFromItem } from '@/lib/list-entry';
type Item = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl?: string | null;
  externalUrl?: string | null;
  catalogItemId?: string | null;
  listNote?: string | null;
  rating: number;
  metadata?: Record<string, unknown> | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
} | null;

type User = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
  curatorLevel?: string | null;
  viralListsCount?: number;
  totalLikesReceived?: number;
} | null;

type ListDetail = {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  horizontalImage?: string | null;
  bannerImage?: string | null;
  saveCount: number;
  itemCount: number;
  viewCount: number;
  badge?: 'TRENDING' | 'NEW' | 'FEATURED' | null;
  tags?: string[];
  categories: Category;
  items: Item[];
  users: User;
  _count: { items: number; list_comments?: number };
};

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString('fa-IR');
}

interface ListDetailClientProps {
  list: ListDetail;
  sponsoredPlacements?: ListPagePlacements;
}

type ListViewMode = 'grid' | 'map';

type ItemEntry = { item: Item; originalIndex: number };

function ListCompactStatsBar({
  saveCount,
  itemCount,
  commentCount,
  viewCount,
  isOwner = false,
  variant = 'horizontal',
  onItemsClick,
  onCommentsClick,
  onSavesClick,
}: {
  saveCount: number;
  itemCount: number;
  commentCount: number;
  viewCount: number;
  isOwner?: boolean;
  variant?: 'horizontal' | 'vertical';
  onItemsClick?: () => void;
  onCommentsClick?: () => void;
  onSavesClick?: () => void;
}) {
  const cells: Array<{
    key: string;
    label: string;
    value: string;
    highlight?: boolean;
    onClick?: () => void;
  }> = [
    {
      key: 'save',
      label: 'ذخیره',
      value: isOwner ? '—' : formatCompact(saveCount),
      highlight: !isOwner && saveCount > 0,
      onClick: !isOwner ? onSavesClick : undefined,
    },
    { key: 'items', label: 'آیتم', value: itemCount.toLocaleString('fa-IR'), onClick: onItemsClick },
    {
      key: 'comments',
      label: 'نظر',
      value: commentCount.toLocaleString('fa-IR'),
      onClick: onCommentsClick,
    },
    { key: 'views', label: 'بازدید', value: formatCompact(viewCount) },
  ];

  if (variant === 'vertical') {
    return (
      <div className="rounded-xl border border-wibe bg-wibe-card p-3 shadow-sm">
        <div className="space-y-2">
          {cells.map(({ key, label, value, highlight, onClick }) => {
            const row = (
              <>
                <span className="wibe-caption text-wibe-secondary">{label}</span>
                <span
                  className={`wibe-small font-bold tabular-nums ${
                    highlight ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {value}
                </span>
              </>
            );

            if (onClick) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  aria-label={key === 'save' ? 'ذخیره لیست' : undefined}
                  className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 transition-colors hover:bg-gray-50"
                >
                  {row}
                </button>
              );
            }

            return (
              <div key={key} className="flex items-center justify-between px-1 py-0.5">
                {row}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 divide-x divide-x-reverse divide-wibe overflow-hidden rounded-xl border border-wibe bg-wibe-card shadow-sm lg:py-0.5">
      {cells.map(({ key, label, value, highlight, onClick }) => {
        const inner = (
          <>
            <p
              className={`wibe-small font-bold tabular-nums leading-none ${
                highlight ? 'text-primary' : 'text-foreground'
              }`}
            >
              {value}
            </p>
            <p className="mt-0.5 wibe-caption text-wibe-secondary">{label}</p>
          </>
        );

        if (onClick) {
          return (
            <button
              key={key}
              type="button"
              onClick={onClick}
              aria-label={key === 'save' ? 'ذخیره لیست' : undefined}
              className="px-1 py-2.5 text-center transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={key} className="px-1 py-2.5 text-center">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function ListOwnerToolbar({
  viralProgress,
  saveCount,
  onManage,
  onShare,
}: {
  viralProgress: number;
  saveCount: number;
  onManage: () => void;
  onShare: () => void;
}) {
  const showViral = saveCount < 100;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5">
      <button
        type="button"
        onClick={onManage}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 wibe-caption font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.98]"
      >
        <Settings className="h-3.5 w-3.5" />
        مدیریت
      </button>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-wibe bg-wibe-card px-3 py-2 wibe-caption font-semibold text-foreground transition-colors hover:border-primary/25 active:scale-[0.98]"
      >
        <Share2 className="h-3.5 w-3.5 text-wibe-secondary" />
        اشتراک
      </button>
      {showViral && (
        <div className="mr-auto flex min-w-[8.5rem] flex-1 items-center gap-2 sm:flex-none">
          <div className="h-1.5 min-w-[4.5rem] flex-1 overflow-hidden rounded-full bg-gray-200 sm:w-20 sm:flex-none">
            <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${viralProgress}%` }} />
          </div>
          <span className="shrink-0 wibe-caption tabular-nums text-wibe-secondary">
            {Math.round(viralProgress).toLocaleString('fa-IR')}٪ وایرال
          </span>
        </div>
      )}
    </div>
  );
}

const LIST_SECTION_SCROLL_MT = 'scroll-mt-[7.5rem]';

export default function ListDetailClient({
  list,
  sponsoredPlacements = { banner: [], sidebar: [], afterSimilar: [] },
}: ListDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  useListScrollDepth(list.slug, list.categories?.slug);
  useInterestTracking({
    type: 'list_view',
    categorySlug: list.categories?.slug,
    listId: list.id,
    keywords: list.tags,
  });
  const isDesktop = useIsDesktop();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [displaySaveCount, setDisplaySaveCount] = useState(0);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const heroBannerRef = useRef<HTMLElement>(null);
  const { ref: itemsSectionRef, inView: itemsSectionInView } = useLazyInView<HTMLElement>({
    rootMargin: '240px',
    once: true,
  });
  const { ref: commentsSectionRef, inView: commentsInView } = useLazyInView<HTMLDivElement>({
    rootMargin: '280px',
    once: true,
  });
  const [commentsActivated, setCommentsActivated] = useState(false);
  const [viewMode, setViewMode] = useState<ListViewMode>('grid');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [listReportOpen, setListReportOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const debouncedItemSearchQuery = useDebouncedValue(itemSearchQuery, 200);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const viewerStateFetched = useRef(false);

  const handleScrollToComment = useCallback((commentId: string) => {
    setCommentsActivated(true);
    setSuggestOpen(false);
    setTimeout(() => {
      document.getElementById(`comment-${commentId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }, []);

  // پارامتر ?suggest=1 سمت کلاینت خوانده می‌شود تا صفحه‌ی سرور static/ISR بماند
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('suggest') === '1') {
      setSuggestOpen(true);
      router.replace(`/lists/${list.slug}`, { scroll: false });
    }
  }, [list.slug, router]);

  // #item-{id} — باز کردن مودال پیش‌نمایش از لینک‌های خارجی (مثلاً دسته‌بندی قدیمی)
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#item-(.+)$/);
    if (!match) return;

    const itemId = decodeURIComponent(match[1]);
    const index = list.items.findIndex((item) => item.id === itemId);
    if (index < 0) return;

    setPreviewIndex(index);
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', cleanUrl);
  }, [list.items]);

  const fetchViewerState = useCallback(() => {
    if (!session?.user || viewerStateFetched.current) return;
    viewerStateFetched.current = true;
    fetch(`/api/lists/${list.id}/viewer-state`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.data) {
          setIsBookmarked(!!data.data.isBookmarked);
        }
      })
      .catch(() => {
        viewerStateFetched.current = false;
      });
  }, [session?.user, list.id]);

  const viewerDeferReady = useDeferReady(true);

  useEffect(() => {
    if (!viewerDeferReady || !session?.user) {
      if (!session?.user) viewerStateFetched.current = false;
      return;
    }
    fetchViewerState();
  }, [viewerDeferReady, session?.user, fetchViewerState]);

  useEffect(() => {
    if (itemsSectionInView) prefetchListSimilar(list.slug);
  }, [itemsSectionInView, list.slug]);

  useEffect(() => {
    if (commentsInView) setCommentsActivated(true);
  }, [commentsInView]);

  const handleSetMap = () => {
    setViewMode((mode) => (mode === 'map' ? 'grid' : 'map'));
  };

  const itemCount = list.itemCount ?? list._count?.items ?? list.items?.length ?? 0;
  const commentCount = list._count?.list_comments ?? 0;
  const saveCount = list.saveCount ?? 0;
  const viewCount = list.viewCount ?? 0;
  const isViral = list.badge === 'TRENDING' || saveCount >= 100;
  const isOwner = !!session?.user && list.userId === (session.user as { id?: string }).id;

  useEffect(() => {
    setDisplaySaveCount(saveCount);
  }, [saveCount]);

  const handleToggleBookmark = useCallback(
    async (closeMenu = false) => {
      if (isOwner) return;
      if (closeMenu) setMoreOpen(false);

      if (!session?.user) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/lists/${list.slug}`)}`);
        return;
      }

      if (bookmarkSaving) return;
      setBookmarkSaving(true);

      try {
        const res = await fetch(`/api/lists/${list.id}/bookmark`, { method: 'POST' });
        const data = await res.json();
        if (data?.success) {
          const saved = !!data.data?.isBookmarked;
          setIsBookmarked(saved);
          if (typeof data.data?.bookmarkCount === 'number') {
            setDisplaySaveCount(data.data.bookmarkCount);
          }
          setToast({
            message: saved ? 'لیست ذخیره شد' : 'از ذخیره‌ها حذف شد',
            type: 'success',
          });
        } else {
          setToast({ message: 'خطا در ذخیره لیست', type: 'error' });
        }
      } catch {
        setToast({ message: 'خطا در ذخیره لیست', type: 'error' });
      } finally {
        setBookmarkSaving(false);
      }
    },
    [bookmarkSaving, isOwner, list.id, list.slug, router, session?.user]
  );

  const displayTitle = getDisplayListTitle({
    title: list.title,
    slug: list.slug,
    categorySlug: list.categories?.slug,
  });
  const categorySlug = list.categories?.slug ?? null;
  const isLifestyleList = isLifestyleCategory(categorySlug);
  const categoryIcon = list.categories?.icon ?? null;
  const listDescription = list.description?.trim();

  const mappableItemCount = useMemo(
    () =>
      list.items.filter((item) =>
        itemHasMapLocation(
          item.metadata,
          sourceCategorySlugFromItem(item) ?? categorySlug
        )
      ).length,
    [list.items, categorySlug]
  );

  const showMapView =
    Boolean(categorySlug && isLocationCategorySlug(categorySlug)) && mappableItemCount > 0;

  const breadcrumbItems = useMemo(
    () => [
      { label: 'خانه', href: '/' },
      { label: 'لیست‌ها', href: '/lists' },
      ...(list.categories
        ? [{ label: list.categories.name, href: `/categories/${list.categories.slug}` }]
        : []),
      { label: displayTitle },
    ],
    [displayTitle, list.categories]
  );

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: displayTitle,
          text: list.description || displayTitle,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setToast({ message: 'لینک کپی شد', type: 'success' });
    }
    setMoreOpen(false);
  };

  const handleOpenSuggest = useCallback(() => {
    if (isOwner) {
      router.push(`/user-lists/${list.id}/add-item`);
      return;
    }
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/lists/${list.slug}?suggest=1`)}`);
      return;
    }
    setSuggestOpen(true);
  }, [isOwner, list.id, list.slug, router, session?.user]);

  const handleOpenSuggestFromMenu = () => {
    setMoreOpen(false);
    handleOpenSuggest();
  };

  const handleOpenReportFromMenu = () => {
    setMoreOpen(false);
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/lists/${list.slug}`)}`);
      return;
    }
    setListReportOpen(true);
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToComments = () => {
    setCommentsActivated(true);
    scrollToSection(commentsSectionRef);
  };

  const BADGE_LABELS: Record<string, string> = {
    TRENDING: 'ترند',
    NEW: 'جدید',
    FEATURED: 'ویژه',
  };

  const badgeStyles: Record<string, string> = {
    TRENDING: 'bg-warning/90 text-white',
    NEW: 'bg-success/90 text-white',
    FEATURED: 'bg-primary/90 text-white',
  };

  const viralProgress = Math.min(100, (saveCount / 100) * 100);

  const allItemEntries = useMemo<ItemEntry[]>(
    () => list.items.map((item, originalIndex) => ({ item, originalIndex })),
    [list.items]
  );

  const normalizedItemSearch = normalizeSearchQuery(debouncedItemSearchQuery);
  const isItemSearchActive = normalizedItemSearch.length > 0;

  const filteredItemEntries = useMemo(() => {
    if (!isItemSearchActive) return allItemEntries;
    const filtered = filterItemsByQuery(
      allItemEntries.map((e) => e.item),
      normalizedItemSearch
    );
    const ids = new Set(filtered.map((i) => i.id));
    return allItemEntries.filter((e) => ids.has(e.item.id));
  }, [allItemEntries, isItemSearchActive, normalizedItemSearch]);

  const showItemSearch = list.items.length >= LIST_INNER_SEARCH_MIN_ITEMS;
  const showSimilarLists = !isItemSearchActive;

  const previewItem: ItemPreviewData | null =
    previewIndex != null && list.items[previewIndex] ? list.items[previewIndex] : null;

  const previewNavIndices = useMemo(() => {
    if (!isItemSearchActive) return null;
    return filteredItemEntries.map((e) => e.originalIndex);
  }, [isItemSearchActive, filteredItemEntries]);

  const previewDisplayIndex = useMemo(() => {
    if (previewIndex == null) return undefined;
    if (previewNavIndices) {
      const pos = previewNavIndices.indexOf(previewIndex);
      return pos >= 0 ? pos : undefined;
    }
    return previewIndex;
  }, [previewIndex, previewNavIndices]);

  const previewDisplayTotal = isItemSearchActive
    ? filteredItemEntries.length
    : list.items.length;

  const goPreviewPrev = useCallback(() => {
    setPreviewIndex((current) => {
      if (current == null) return current;
      if (previewNavIndices) {
        const pos = previewNavIndices.indexOf(current);
        return pos > 0 ? previewNavIndices[pos - 1] : current;
      }
      return current > 0 ? current - 1 : current;
    });
  }, [previewNavIndices]);

  const goPreviewNext = useCallback(() => {
    setPreviewIndex((current) => {
      if (current == null) return current;
      if (previewNavIndices) {
        const pos = previewNavIndices.indexOf(current);
        return pos >= 0 && pos < previewNavIndices.length - 1
          ? previewNavIndices[pos + 1]
          : current;
      }
      return current < list.items.length - 1 ? current + 1 : current;
    });
  }, [previewNavIndices, list.items.length]);

  const canPreviewPrev =
    previewIndex != null &&
    (previewNavIndices
      ? previewNavIndices.indexOf(previewIndex) > 0
      : previewIndex > 0);

  const canPreviewNext =
    previewIndex != null &&
    (previewNavIndices
      ? previewNavIndices.indexOf(previewIndex) < previewNavIndices.length - 1
      : previewIndex < list.items.length - 1);

  useEffect(() => {
    if (previewIndex == null || !isItemSearchActive) return;
    if (!filteredItemEntries.some((e) => e.originalIndex === previewIndex)) {
      setPreviewIndex(null);
    }
  }, [filteredItemEntries, isItemSearchActive, previewIndex]);

  const openItemPreview = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  const closeItemPreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  const renderItemEntries = (entries: ItemEntry[]) => {
    if (viewMode === 'map') {
      return (
        <ListItemsMapViewLazy entries={entries} categorySlug={categorySlug} />
      );
    }

    if (viewMode === 'grid') {
      return (
        <ListItemsGrid
          entries={entries}
          listCategorySlug={categorySlug}
          categoryIcon={categoryIcon}
          isLifestyleList={isLifestyleList}
          onOpenAt={openItemPreview}
        />
      );
    }

    return null;
  };

  const heroImage = list.bannerImage ?? list.horizontalImage ?? list.coverImage ?? '';

  const listHeroChips = (
    <>
      {list.categories && (
        <Link
          href={`/categories/${list.categories.slug}`}
          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 wibe-caption font-medium text-foreground transition-colors hover:bg-gray-200 lg:bg-wibe-surface lg:ring-1 lg:ring-wibe/80"
        >
          {list.categories.icon} {list.categories.name}
        </Link>
      )}
      {list.badge && BADGE_LABELS[list.badge] && (
        <span className={`inline-flex px-2.5 py-0.5 rounded-pill wibe-caption font-semibold ${badgeStyles[list.badge] ?? 'bg-gray-100 text-foreground'}`}>
          {BADGE_LABELS[list.badge]}
        </span>
      )}
      {isViral && (
        <span className="inline-flex items-center gap-1 rounded-md bg-warning/15 px-2.5 py-1 wibe-caption font-semibold text-warning">
          <Flame className="h-3.5 w-3.5" /> وایرال
        </span>
      )}
    </>
  );

  return (
    <div className="bg-wibe-surface" dir="rtl">
      <div className="px-4 pt-2 lg:px-0 lg:pt-3">
        <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
        <PageBreadcrumb items={breadcrumbItems} />
      </div>

      {/* Hero — سینمایی موبایل | split header دسکتاپ */}
      <section ref={heroBannerRef} className="lg:mt-1">
        {isDesktop ? (
          <div className="grid grid-cols-[minmax(13rem,17.5rem)_minmax(0,1fr)] items-center gap-5 xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm ring-1 ring-black/[0.04] xl:aspect-[16/10]">
              <ImageWithFallback
                src={heroImage}
                alt={displayTitle}
                className="h-full w-full object-cover object-center"
                fallbackIcon={categoryIcon ?? '📋'}
                fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-5xl"
                categorySlug={categorySlug}
                listSlug={list.slug}
                listTitle={list.title}
                priority
              />
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-wibe-card/95 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
                aria-label="بیشتر"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 py-1">
              <h1 className="text-[1.5rem] font-bold leading-snug text-foreground line-clamp-2 xl:text-[1.65rem]">
                {displayTitle}
              </h1>
              {listDescription && (
                <p className="mt-2 line-clamp-3 max-w-2xl wibe-small leading-relaxed text-wibe-secondary xl:line-clamp-2">
                  {listDescription}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">{listHeroChips}</div>
            </div>
          </div>
        ) : (
          <div className="relative h-[210px] overflow-hidden rounded-b-2xl bg-gray-900 sm:h-[240px]">
            <ImageWithFallback
              src={heroImage}
              alt={displayTitle}
              className="absolute inset-0 h-full w-full object-cover object-center"
              fallbackIcon={categoryIcon ?? '📋'}
              fallbackClassName="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200 text-6xl"
              categorySlug={categorySlug}
              listSlug={list.slug}
              listTitle={list.title}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-wibe-card/95 text-foreground shadow-sm backdrop-blur transition-transform active:scale-95"
                aria-label="بیشتر"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            {isViral && (
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md wibe-caption font-semibold bg-warning text-white">
                  <Flame className="w-3.5 h-3.5" /> وایرال
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-4 text-right">
              <h1 className="text-h1 font-bold leading-tight text-white line-clamp-2">{displayTitle}</h1>
              {listDescription && (
                <p className="mt-1 line-clamp-2 wibe-small leading-relaxed text-white/85">{listDescription}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {list.categories && (
                  <Link
                    href={`/categories/${list.categories.slug}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md wibe-caption font-medium bg-white/15 backdrop-blur text-white/95"
                  >
                    {list.categories.icon} {list.categories.name}
                  </Link>
                )}
                {list.badge && BADGE_LABELS[list.badge] && (
                  <span className={`inline-flex px-2.5 py-0.5 rounded-pill wibe-caption font-semibold ${badgeStyles[list.badge] ?? 'bg-white/20 text-white'}`}>
                    {BADGE_LABELS[list.badge]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="relative z-20 -mt-4 px-4 lg:hidden">
        <ListCompactStatsBar
          saveCount={displaySaveCount}
          itemCount={itemCount}
          commentCount={commentCount}
          viewCount={viewCount}
          isOwner={isOwner}
          onItemsClick={() => scrollToSection(itemsSectionRef)}
          onCommentsClick={scrollToComments}
          onSavesClick={!isOwner ? () => handleToggleBookmark() : undefined}
        />
      </div>

      {sponsoredPlacements.banner.length > 0 ? (
        <SponsoredPlacementStack
          placements={sponsoredPlacements.banner}
          listId={list.id}
          categoryId={list.categories?.id}
          variant="banner"
        />
      ) : null}

      <main className="relative z-10 px-4 pt-2 lg:px-0 lg:pt-3">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8">
          <div className="min-w-0 space-y-4 lg:space-y-5">
            <div className="space-y-3 lg:hidden">
              {isOwner ? (
                <ListOwnerToolbar
                  viralProgress={viralProgress}
                  saveCount={saveCount}
                  onManage={() => setManageOpen(true)}
                  onShare={handleShare}
                />
              ) : null}

              {list.tags && list.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {list.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-md bg-gray-100 px-3 py-1 wibe-caption font-medium text-wibe-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            </div>

            <section
              ref={itemsSectionRef}
              id="list-items-section"
              className={`${LIST_SECTION_SCROLL_MT} lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card lg:p-5 lg:shadow-sm`}
            >
              {(showItemSearch || showMapView) && (
                <div className="mb-3 flex items-start gap-2 lg:mb-4">
                  {showItemSearch ? (
                    <div className="min-w-0 flex-1">
                      <SearchInput
                        value={itemSearchQuery}
                        onChange={setItemSearchQuery}
                        placeholder="جستجو در این لیست…"
                        aria-label="جستجو در آیتم‌های لیست"
                      />
                      {isItemSearchActive && (
                        <p className="mt-1 px-0.5 wibe-caption text-wibe-secondary">
                          {filteredItemEntries.length.toLocaleString('fa-IR')} نتیجه از{' '}
                          {list.items.length.toLocaleString('fa-IR')} آیتم
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {showMapView && list.items.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleSetMap}
                      title={viewMode === 'map' ? 'نمایش شبکه‌ای' : 'نمایش نقشه'}
                      aria-label={viewMode === 'map' ? 'نمایش شبکه‌ای' : 'نمایش نقشه'}
                      aria-pressed={viewMode === 'map'}
                      className={`flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2.5 wibe-caption transition-colors ${
                        viewMode === 'map'
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-wibe bg-wibe-card text-wibe-secondary'
                      }`}
                    >
                      {viewMode === 'map' ? (
                        <LayoutGrid className="h-4 w-4" />
                      ) : (
                        <Map className="h-4 w-4" />
                      )}
                      {viewMode === 'map' ? 'شبکه' : 'نقشه'}
                    </button>
                  ) : null}
                </div>
              )}

              {!list.items?.length ? (
                <div className="text-center py-10 bg-wibe-card rounded-lg border border-wibe">
                  <p className="wibe-body text-wibe-secondary">این لیست هنوز آیتمی ندارد</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setManageOpen(true)}
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-white wibe-small font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      افزودن اولین آیتم
                    </button>
                  )}
                </div>
              ) : isItemSearchActive && filteredItemEntries.length === 0 ? (
                <div className="py-10 text-center bg-wibe-card rounded-lg border border-wibe">
                  <p className="wibe-body font-medium text-foreground">آیتمی پیدا نشد</p>
                  <p className="mt-1 wibe-caption text-wibe-secondary">
                    عبارت دیگری برای «{normalizedItemSearch}» امتحان کن
                  </p>
                  <button
                    type="button"
                    onClick={() => setItemSearchQuery('')}
                    className="mt-4 wibe-caption font-medium text-primary"
                  >
                    پاک کردن جستجو
                  </button>
                </div>
              ) : isItemSearchActive ? (
                renderItemEntries(filteredItemEntries)
              ) : (
                renderItemEntries(allItemEntries)
              )}
            </section>

            {showSimilarLists ? <ListSimilarListsSectionLazy listSlug={list.slug} /> : null}

            {sponsoredPlacements.afterSimilar.length > 0 ? (
              <SponsoredPlacementStack
                placements={sponsoredPlacements.afterSimilar}
                listId={list.id}
                categoryId={list.categories?.id}
                variant="inline"
              />
            ) : null}

            <div
              ref={commentsSectionRef}
              id="list-comments-section"
              className={`${LIST_SECTION_SCROLL_MT} border-t border-wibe pt-6 lg:mt-0 lg:rounded-2xl lg:border lg:bg-wibe-card lg:p-5 lg:pt-5 lg:shadow-sm`}
            >
              {commentsActivated ? (
                <VibeCommentSectionLazy
                  listId={list.id}
                  listSlug={list.slug}
                  isOwner={isOwner}
                  categorySlug={categorySlug}
                  onOpenSuggestItem={() => setSuggestOpen(true)}
                  embeddedInSidebar
                />
              ) : (
                <div className="space-y-3" aria-hidden>
                  <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
                  <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
                </div>
              )}
            </div>

            <div className="h-6 lg:h-2" />
          </div>

          <ListDetailSidebarLazy
            listId={list.id}
            saveCount={saveCount}
            isOwner={isOwner}
            viralProgress={viralProgress}
            sidebarAds={sponsoredPlacements.sidebar}
            sidebarAdListId={list.id}
            sidebarAdCategoryId={list.categories?.id}
            tags={list.tags}
            onShare={handleShare}
            onManage={() => setManageOpen(true)}
            onSuggestItem={handleOpenSuggest}
            statsBar={
              <ListCompactStatsBar
                variant="vertical"
                saveCount={displaySaveCount}
                itemCount={itemCount}
                commentCount={commentCount}
                viewCount={viewCount}
                isOwner={isOwner}
                onItemsClick={() => scrollToSection(itemsSectionRef)}
                onCommentsClick={scrollToComments}
                onSavesClick={!isOwner ? () => handleToggleBookmark() : undefined}
              />
            }
          />
        </div>
      </main>

      {previewIndex != null && previewItem ? (
        <ItemPreviewSheetLazy
          isOpen
          onClose={closeItemPreview}
          item={previewItem}
          itemIndex={previewDisplayIndex}
          totalItems={previewDisplayTotal}
          categorySlug={categorySlug}
          categoryIcon={categoryIcon}
          categoryName={list.categories?.name}
          listSlug={list.slug}
          onPrev={canPreviewPrev ? goPreviewPrev : undefined}
          onNext={canPreviewNext ? goPreviewNext : undefined}
        />
      ) : null}

      {/* مدیریت لیست — owner */}
      <BottomSheet
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        title="مدیریت لیست"
        maxHeight="50vh"
      >
        <div className="space-y-2 px-1 pb-2">
          <Link
            href={`/user-lists/${list.id}/add-item`}
            onClick={() => setManageOpen(false)}
            className="flex items-center gap-3 rounded-xl border border-wibe bg-wibe-card p-3.5 wibe-small font-medium text-foreground active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </span>
            افزودن آیتم
          </Link>
          <Link
            href={`/user-lists/${list.id}`}
            onClick={() => setManageOpen(false)}
            className="flex items-center gap-3 rounded-xl border border-wibe bg-wibe-card p-3.5 wibe-small font-medium text-foreground active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-wibe-secondary">
              <Settings className="h-4 w-4" />
            </span>
            تنظیمات و ویرایش لیست
          </Link>
          <button
            type="button"
            onClick={() => {
              setManageOpen(false);
              handleShare();
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-wibe bg-wibe-card p-3.5 wibe-small font-medium text-foreground active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-wibe-secondary">
              <Share2 className="h-4 w-4" />
            </span>
            اشتراک‌گذاری لیست
          </button>
        </div>
      </BottomSheet>

      {/* منوی بیشتر */}
      <BottomSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} title="گزینه‌ها" maxHeight="50vh">
        <div className="space-y-1 px-1 pb-2">
          {!isOwner && (
            <button
              type="button"
              disabled={bookmarkSaving}
              onClick={() => handleToggleBookmark(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 wibe-small font-medium text-foreground hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
            >
              {isBookmarked ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Bookmark className="h-4 w-4 text-wibe-secondary" />
              )}
              {isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره لیست'}
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 wibe-small font-medium text-foreground hover:bg-gray-50 active:bg-gray-100"
          >
            <Share2 className="h-4 w-4 text-wibe-secondary" />
            اشتراک‌گذاری
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setToast({ message: 'لینک کپی شد', type: 'success' });
              setMoreOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 wibe-small font-medium text-foreground hover:bg-gray-50 active:bg-gray-100"
          >
            <Link2 className="h-4 w-4 text-wibe-secondary" />
            کپی لینک
          </button>

          <div className="my-1 border-t border-wibe/80" aria-hidden />

          <button
            type="button"
            onClick={handleOpenSuggestFromMenu}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 wibe-small font-medium text-foreground hover:bg-gray-50 active:bg-gray-100"
          >
            {isOwner ? (
              <Plus className="h-4 w-4 text-primary" />
            ) : (
              <Lightbulb className="h-4 w-4 text-primary" />
            )}
            {isOwner ? 'افزودن آیتم به لیست' : 'پیشنهاد آیتم به این لیست'}
          </button>

          {!isOwner && (
            <button
              type="button"
              onClick={handleOpenReportFromMenu}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 wibe-small font-medium text-red-600 hover:bg-red-50 active:bg-red-100/80"
            >
              <Flag className="h-4 w-4" />
              گزارش لیست
            </button>
          )}
        </div>
      </BottomSheet>

      {listReportOpen ? (
        <ListReportModalLazy
          isOpen={listReportOpen}
          onClose={() => setListReportOpen(false)}
          listId={list.id}
          onReportSuccess={() => setToast({ message: 'گزارش ثبت شد', type: 'success' })}
        />
      ) : null}

      {/* مودال پیشنهاد آیتم */}
      <BottomSheet
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="پیشنهاد آیتم"
        subtitle="جستجو کن یا از پیشنهادها انتخاب کن"
        maxHeight="85vh"
      >
        {suggestOpen ? (
          <SuggestItemSearchLazy
            listId={list.id}
            categorySlug={list.categories?.slug}
            onSuccess={() => setSuggestOpen(false)}
            onScrollToComment={handleScrollToComment}
            showToast={(message, type) => setToast({ message, type })}
          />
        ) : null}
      </BottomSheet>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Bottom nav placeholder - actual BottomNav is in page */}
    </div>
  );
}
