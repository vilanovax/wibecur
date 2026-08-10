'use client';

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useListScrollDepth } from '@/hooks/useListScrollDepth';
import { useInterestTracking } from '@/hooks/useInterestTracking';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDeferReady } from '@/hooks/useDeferReady';
import { useLazyInView } from '@/hooks/useLazyInView';
import { prefetchListSimilar } from '@/lib/list-similar-client';
import { listBadgeLabel, listBadgeSolidClass } from '@/lib/list-badge-styles';
import { Share2, MoreVertical, Flame, Bookmark, Plus, Settings, Link2, Flag, Lightbulb, Map, LayoutGrid, Check, Shuffle, ListOrdered } from 'lucide-react';
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
  preloadItemPreviewSheet,
  type ItemPreviewData,
} from '@/components/mobile/lists/list-detail-lazy-sections';
import SearchInput from '@/components/mobile/search/SearchInput';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getDisplayListTitle } from '@/lib/list-display-title';
import { filterItemsByQuery, LIST_INNER_SEARCH_MIN_ITEMS } from '@/lib/item-display-utils';
import { isLocationCategorySlug } from '@/lib/category-layout';
import { itemHasMapLocation } from '@/lib/list-item-quick-actions';
import { normalizeSearchQuery } from '@/lib/list-search';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { ListPagePlacements } from '@/lib/sponsored-placements';
import { isLifestyleCategory, sourceCategorySlugFromItem } from '@/lib/list-entry';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
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
  voteCount?: number | null;
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
  /** SSR فقط پنجرهٔ اول را می‌فرستد؛ بقیه از /api/lists/[id]/items می‌آید. */
  itemsHasMore?: boolean;
}

type ListViewMode = 'grid' | 'map';

type ItemEntry = { item: Item; originalIndex: number };

/** رندر پنجره‌ای گرید آیتم‌ها — تعداد اولیه و گام آشکارسازی با اسکرول. */
const LIST_GRID_WINDOW_INITIAL = 24;
const LIST_GRID_WINDOW_STEP = 24;
const LIST_DETAIL_REMOTE_PAGE = 36;

import { calcViralProgress, shouldShowViralProgress } from '@/lib/list-viral-display';

function ListCompactStatsBar({
  saveCount,
  itemCount,
  commentCount,
  viewCount,
  isOwner = false,
  isBookmarked = false,
  bookmarkSaving = false,
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
  isBookmarked?: boolean;
  bookmarkSaving?: boolean;
  variant?: 'horizontal' | 'vertical';
  onItemsClick?: () => void;
  onCommentsClick?: () => void;
  onSavesClick?: () => void;
}) {
  const metricCells: Array<{
    key: string;
    label: string;
    value: string;
    onClick?: () => void;
  }> = [
    { key: 'items', label: 'آیتم', value: itemCount.toLocaleString('fa-IR'), onClick: onItemsClick },
    {
      key: 'comments',
      label: 'نظر',
      value: commentCount.toLocaleString('fa-IR'),
      onClick: onCommentsClick,
    },
    { key: 'views', label: 'بازدید', value: formatCompact(viewCount) },
  ];

  const renderSaveCell = (layout: 'horizontal' | 'vertical') => {
    if (isOwner) {
      const countLabel = formatCompact(saveCount);
      const row = (
        <>
          <span className="wibe-caption text-wibe-secondary">ذخیره</span>
          <span className="wibe-small font-bold tabular-nums text-foreground">{countLabel}</span>
        </>
      );
      return layout === 'vertical' ? (
        <div className="flex items-center justify-between px-1 py-0.5">{row}</div>
      ) : (
        <div className="px-1 py-2.5 text-center">
          <p className="wibe-small font-bold tabular-nums leading-none text-foreground">{countLabel}</p>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">ذخیره</p>
        </div>
      );
    }

    const saveInteractive = Boolean(onSavesClick);
    const saveLabel = isBookmarked ? 'ذخیره شد' : 'ذخیره';
    const saveCountLabel = saveCount > 0 ? formatCompact(saveCount) : null;

    const bookmarkedHorizontal = (
      <>
        <Bookmark
          className={`mx-auto mb-1 h-4 w-4 fill-primary text-primary ${bookmarkSaving ? 'opacity-60' : ''}`}
          aria-hidden
        />
        <p className="wibe-caption font-bold leading-none text-primary">{saveLabel}</p>
        {saveCountLabel ? (
          <p className="mt-0.5 wibe-caption tabular-nums text-primary/75">{saveCountLabel}</p>
        ) : null}
      </>
    );

    const defaultHorizontal = (
      <>
        <p
          className={`wibe-small font-bold tabular-nums leading-none ${
            saveCount > 0 ? 'text-primary' : 'text-foreground'
          }`}
        >
          {saveCountLabel ?? '۰'}
        </p>
        <p className="mt-0.5 wibe-caption text-wibe-secondary">{saveLabel}</p>
      </>
    );

    const bookmarkedVertical = (
      <>
        <span className="inline-flex items-center gap-1.5 wibe-caption font-bold text-primary">
          <Bookmark className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
          {saveLabel}
        </span>
        {saveCountLabel ? (
          <span className="wibe-caption tabular-nums text-primary/75">{saveCountLabel}</span>
        ) : null}
      </>
    );

    const defaultVertical = (
      <>
        <span className="wibe-caption text-wibe-secondary">{saveLabel}</span>
        <span
          className={`wibe-small font-bold tabular-nums ${
            saveCount > 0 ? 'text-primary' : 'text-foreground'
          }`}
        >
          {saveCountLabel ?? '۰'}
        </span>
      </>
    );

    const horizontalInner = isBookmarked ? bookmarkedHorizontal : defaultHorizontal;
    const verticalInner = isBookmarked ? bookmarkedVertical : defaultVertical;

    const horizontalClass = isBookmarked
      ? 'bg-primary/[0.12] ring-1 ring-inset ring-primary/25'
      : saveInteractive
        ? 'hover:bg-primary/[0.06] active:bg-primary/10'
        : '';

    const verticalClass = isBookmarked
      ? 'rounded-lg bg-primary/[0.1] px-2 py-1.5 ring-1 ring-inset ring-primary/20'
      : saveInteractive
        ? 'rounded-lg px-1 py-0.5 hover:bg-wibe-surface'
        : 'px-1 py-0.5';

    if (layout === 'vertical') {
      if (saveInteractive) {
        return (
          <button
            type="button"
            onClick={onSavesClick}
            disabled={bookmarkSaving}
            aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره لیست'}
            aria-pressed={isBookmarked}
            className={`flex w-full items-center justify-between transition-colors disabled:opacity-60 ${verticalClass}`}
          >
            {verticalInner}
          </button>
        );
      }
      return (
        <div className={`flex items-center justify-between ${verticalClass}`}>{verticalInner}</div>
      );
    }

    if (saveInteractive) {
      return (
        <button
          type="button"
          onClick={onSavesClick}
          disabled={bookmarkSaving}
          aria-label={isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره لیست'}
          aria-pressed={isBookmarked}
          className={`px-1 py-2.5 text-center transition-colors disabled:opacity-60 ${horizontalClass}`}
        >
          {horizontalInner}
        </button>
      );
    }

    return <div className={`px-1 py-2.5 text-center ${horizontalClass}`}>{horizontalInner}</div>;
  };

  if (variant === 'vertical') {
    return (
      <div className="rounded-xl border border-wibe bg-wibe-card p-3 shadow-sm">
        <div className="space-y-2">
          {renderSaveCell('vertical')}
          {metricCells.map(({ key, label, value, onClick }) => {
            const row = (
              <>
                <span className="wibe-caption text-wibe-secondary">{label}</span>
                <span className="wibe-small font-bold tabular-nums text-foreground">{value}</span>
              </>
            );

            if (onClick) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  className="flex w-full items-center justify-between rounded-lg px-1 py-0.5 transition-colors hover:bg-wibe-surface"
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
      {renderSaveCell('horizontal')}
      {metricCells.map(({ key, label, value, onClick }) => {
        const inner = (
          <>
            <p className="wibe-small font-bold tabular-nums leading-none text-foreground">{value}</p>
            <p className="mt-0.5 wibe-caption text-wibe-secondary">{label}</p>
          </>
        );

        if (onClick) {
          return (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="px-1 py-2.5 text-center transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
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

/** نوار consume موبایل — اشتراک/ذخیره اول؛ مدیریت آروم */
function ListConsumeActionBar({
  isOwner,
  isBookmarked,
  bookmarkSaving,
  viralProgress,
  saveCount,
  onSave,
  onShare,
  onManage,
}: {
  isOwner: boolean;
  isBookmarked: boolean;
  bookmarkSaving: boolean;
  viralProgress: number;
  saveCount: number;
  onSave: () => void;
  onShare: () => void;
  onManage: () => void;
}) {
  const showViral = isOwner && shouldShowViralProgress(saveCount);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!isOwner ? (
          <button
            type="button"
            onClick={onSave}
            disabled={bookmarkSaving}
            aria-pressed={isBookmarked}
            className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl wibe-caption font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
              isBookmarked
                ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/25'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            <Bookmark
              className={`h-4 w-4 ${isBookmarked ? 'fill-primary' : ''}`}
              aria-hidden
            />
            {isBookmarked ? 'ذخیره شد' : 'ذخیره'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onShare}
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-wibe bg-wibe-card wibe-caption font-semibold text-foreground transition-colors hover:border-primary/25 active:scale-[0.98] ${
            isOwner ? 'flex-1' : 'px-4'
          }`}
        >
          <Share2 className="h-4 w-4 text-wibe-secondary" aria-hidden />
          اشتراک
        </button>
        {isOwner ? (
          <button
            type="button"
            onClick={onManage}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 wibe-caption font-medium text-wibe-secondary transition-colors hover:bg-wibe-surface hover:text-foreground active:scale-[0.98]"
          >
            <Settings className="h-4 w-4" aria-hidden />
            مدیریت
          </button>
        ) : null}
      </div>
      {showViral ? (
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-wibe-surface">
            <div
              className="h-full rounded-full bg-warning transition-all"
              style={{ width: `${viralProgress}%` }}
            />
          </div>
          <span className="shrink-0 wibe-caption tabular-nums text-wibe-secondary">
            {Math.round(viralProgress).toLocaleString('fa-IR')}٪ وایرال
          </span>
        </div>
      ) : null}
    </div>
  );
}

const LIST_SECTION_SCROLL_MT = 'scroll-mt-[7.5rem]';

export default function ListDetailClient({
  list: listProp,
  sponsoredPlacements = { banner: [], sidebar: [], afterSimilar: [] },
  itemsHasMore = false,
}: ListDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  // فقط برای AT — چیدمان همچنان با CSS (`lg:`) تا CLS نسازد
  const isDesktop = useIsDesktop();
  const [items, setItems] = useState(listProp.items);
  const [hasMoreRemote, setHasMoreRemote] = useState(itemsHasMore);
  const [loadingMoreRemote, setLoadingMoreRemote] = useState(false);
  const remoteFetchLock = useRef(false);
  const itemsLenRef = useRef(listProp.items.length);
  const hasMoreRemoteRef = useRef(itemsHasMore);

  const list = useMemo(() => ({ ...listProp, items }), [listProp, items]);

  useEffect(() => {
    setItems(listProp.items);
    setHasMoreRemote(itemsHasMore);
    itemsLenRef.current = listProp.items.length;
    hasMoreRemoteRef.current = itemsHasMore;
  }, [listProp.id, listProp.items, itemsHasMore]);

  const fetchMoreItems = useCallback(async (): Promise<boolean> => {
    if (remoteFetchLock.current || !hasMoreRemoteRef.current) return false;
    remoteFetchLock.current = true;
    setLoadingMoreRemote(true);
    try {
      const offset = itemsLenRef.current;
      const res = await fetch(
        `/api/lists/${listProp.id}/items?offset=${offset}&limit=${LIST_DETAIL_REMOTE_PAGE}`
      );
      const json = (await res.json()) as {
        success?: boolean;
        items?: Item[];
        pagination?: { hasMore?: boolean };
      };
      if (!res.ok || !json.success || !Array.isArray(json.items)) return false;

      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        const next = [...prev, ...json.items!.filter((i) => !seen.has(i.id))];
        itemsLenRef.current = next.length;
        return next;
      });

      const more = Boolean(json.pagination?.hasMore);
      hasMoreRemoteRef.current = more;
      setHasMoreRemote(more);
      return more;
    } catch {
      return false;
    } finally {
      remoteFetchLock.current = false;
      setLoadingMoreRemote(false);
    }
  }, [listProp.id]);

  const ensureAllItemsLoaded = useCallback(async () => {
    while (hasMoreRemoteRef.current) {
      const more = await fetchMoreItems();
      if (!more) break;
    }
  }, [fetchMoreItems]);

  useListScrollDepth(list.slug, list.categories?.slug);
  useInterestTracking({
    type: 'list_view',
    categorySlug: list.categories?.slug,
    listId: list.id,
    keywords: list.tags,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [displaySaveCount, setDisplaySaveCount] = useState(0);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const heroBannerRef = useRef<HTMLElement>(null);
  const {
    ref: itemsSectionRef,
    inView: itemsSectionInView,
    elementRef: itemsSectionEl,
  } = useLazyInView<HTMLElement>({
    rootMargin: '240px',
    once: true,
  });
  const {
    ref: commentsSectionRef,
    inView: commentsInView,
    elementRef: commentsSectionEl,
  } = useLazyInView<HTMLDivElement>({
    rootMargin: '280px',
    once: true,
  });
  const [commentsActivated, setCommentsActivated] = useState(false);
  const [viewMode, setViewMode] = useState<ListViewMode>('grid');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [listReportOpen, setListReportOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // رندر پنجره‌ای گرید + صفحه‌بندی سرور برای لیست‌های بزرگ.
  const [visibleCount, setVisibleCount] = useState(LIST_GRID_WINDOW_INITIAL);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const debouncedItemSearchQuery = useDebouncedValue(itemSearchQuery, 200);
  /** حالت «امشب چی؟» — فقط ۵ آیتم اول */
  const [tonightTop5, setTonightTop5] = useState(false);
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

  // ثبت بازدید یک‌بار در هر لود صفحه — خارج از مسیر رندر سرور (beacon).
  const viewBeaconSent = useRef(false);
  useEffect(() => {
    if (viewBeaconSent.current) return;
    viewBeaconSent.current = true;
    const url = `/api/lists/${list.id}/view`;
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url);
        return;
      }
    } catch {
      // fallthrough به fetch
    }
    void fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  }, [list.id]);

  useEffect(() => {
    if (itemsSectionInView) prefetchListSimilar(list.slug);
  }, [itemsSectionInView, list.slug]);

  useEffect(() => {
    if (commentsInView) setCommentsActivated(true);
  }, [commentsInView]);

  const handleSetMap = () => {
    setViewMode((mode) => {
      const next = mode === 'map' ? 'grid' : 'map';
      if (next === 'map') void ensureAllItemsLoaded();
      return next;
    });
  };

  useEffect(() => {
    if (normalizeSearchQuery(itemSearchQuery).length > 0) {
      void ensureAllItemsLoaded();
    }
  }, [itemSearchQuery, ensureAllItemsLoaded]);

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
    scrollToSection(commentsSectionEl);
  };

  const badgeLabel = list.badge ? listBadgeLabel(list.badge) : undefined;
  const badgeClass = list.badge ? listBadgeSolidClass(list.badge) : undefined;

  const viralProgress = calcViralProgress(saveCount);

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

  const showItemSearch = itemCount >= LIST_INNER_SEARCH_MIN_ITEMS;
  const showSimilarLists = !isItemSearchActive;
  const showTonightPath =
    viewMode === 'grid' && !isItemSearchActive && list.items.length >= 3;

  useEffect(() => {
    if (isItemSearchActive && tonightTop5) setTonightTop5(false);
  }, [isItemSearchActive, tonightTop5]);

  // پنجره‌سازی فقط برای گرید و حالت غیرجستجو؛ نقشه و نتایج جستجو کامل رندر می‌شوند.
  const gridWindowActive = viewMode === 'grid' && !isItemSearchActive && !tonightTop5;
  const hasMoreToReveal =
    gridWindowActive && (visibleCount < allItemEntries.length || hasMoreRemote);
  const nonSearchEntries = tonightTop5
    ? allItemEntries.slice(0, 5)
    : gridWindowActive
      ? allItemEntries.slice(0, visibleCount)
      : allItemEntries;

  useEffect(() => {
    if (!hasMoreToReveal) return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setVisibleCount((c) => Math.min(c + LIST_GRID_WINDOW_STEP, allItemEntries.length));
        if (visibleCount + LIST_GRID_WINDOW_STEP >= allItemEntries.length && hasMoreRemote) {
          void fetchMoreItems().then(() => {
            setVisibleCount((c) => c + LIST_GRID_WINDOW_STEP);
          });
        }
      },
      { rootMargin: '800px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [
    hasMoreToReveal,
    visibleCount,
    allItemEntries.length,
    hasMoreRemote,
    fetchMoreItems,
  ]);

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
    startTransition(() => {
      setPreviewIndex((current) => {
        if (current == null) return current;
        if (previewNavIndices) {
          const pos = previewNavIndices.indexOf(current);
          return pos > 0 ? previewNavIndices[pos - 1] : current;
        }
        return current > 0 ? current - 1 : current;
      });
    });
  }, [previewNavIndices]);

  const goPreviewNext = useCallback(() => {
    startTransition(() => {
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

  const handleTonightTop5 = useCallback(() => {
    setTonightTop5(true);
    setItemSearchQuery('');
    setViewMode('grid');
    itemsSectionEl.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [itemsSectionEl]);

  const handleTonightRandom = useCallback(() => {
    if (list.items.length === 0) return;
    const idx = Math.floor(Math.random() * list.items.length);
    preloadItemPreviewSheet();
    startTransition(() => {
      setPreviewIndex(idx);
    });
  }, [list.items.length]);

  const openItemPreview = useCallback((index: number) => {
    preloadItemPreviewSheet();
    startTransition(() => {
      setPreviewIndex(index);
    });
  }, []);

  const closeItemPreview = useCallback(() => {
    setPreviewIndex(null);
  }, []);

  const previewAdjacentImageUrls = useMemo(() => {
    if (previewIndex == null) return undefined;
    const urls: Array<string | null | undefined> = [];
    const pushAt = (idx: number) => {
      const row = list.items[idx];
      if (!row) return;
      urls.push(row.displayImageUrl ?? row.imageUrl);
    };
    if (previewNavIndices) {
      const pos = previewNavIndices.indexOf(previewIndex);
      if (pos > 0) pushAt(previewNavIndices[pos - 1]);
      if (pos >= 0 && pos < previewNavIndices.length - 1) {
        pushAt(previewNavIndices[pos + 1]);
      }
    } else {
      if (previewIndex > 0) pushAt(previewIndex - 1);
      if (previewIndex < list.items.length - 1) pushAt(previewIndex + 1);
    }
    return urls.length ? urls : undefined;
  }, [previewIndex, previewNavIndices, list.items]);

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
          className="inline-flex items-center gap-1 rounded-md bg-wibe-surface px-2.5 py-1 wibe-caption font-medium text-foreground transition-colors hover:bg-wibe-surface lg:bg-wibe-surface lg:ring-1 lg:ring-wibe/80"
        >
          {list.categories.icon} {list.categories.name}
        </Link>
      )}
      {badgeLabel && (
        <span className={`inline-flex px-2.5 py-0.5 rounded-pill wibe-caption font-semibold ${badgeClass ?? 'bg-wibe-surface text-foreground'}`}>
          {badgeLabel}
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
      <JsonLdBreadcrumb items={uiBreadcrumbToSchema(breadcrumbItems)} />
      <div className="mb-1 hidden px-4 pt-2 lg:mb-0 lg:block lg:px-0 lg:pt-3">
        <PageBreadcrumb items={breadcrumbItems} />
      </div>

      {/* Hero — هر دو چیدمان با CSS تا hydration CLS نسازد؛ aria-hidden فقط برای AT. */}
      <section ref={heroBannerRef} className="lg:mt-1">
        <div
          className="hidden grid-cols-[minmax(13rem,17.5rem)_minmax(0,1fr)] items-center gap-5 lg:grid xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-6"
          aria-hidden={!isDesktop || undefined}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-wibe-surface shadow-sm ring-1 ring-black/[0.04] xl:aspect-[16/10]">
            <ImageWithFallback
              src={heroImage}
              alt={displayTitle}
              className="h-full w-full object-cover object-center"
              fallbackIcon={categoryIcon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-wibe-surface text-5xl"
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
            <h1 className="text-h1 font-bold leading-snug text-foreground line-clamp-2 xl:text-h1">
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

        <div
          className="relative h-[210px] overflow-hidden rounded-b-2xl bg-gray-900 sm:h-[240px] lg:hidden"
          aria-hidden={isDesktop || undefined}
        >
          <ImageWithFallback
            src={heroImage}
            alt={displayTitle}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fallbackIcon={categoryIcon ?? '📋'}
            fallbackClassName="absolute inset-0 flex h-full w-full items-center justify-center bg-wibe-surface text-6xl"
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
              {badgeLabel && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-pill wibe-caption font-semibold ${badgeClass ?? 'bg-white/20 text-white'}`}>
                  {badgeLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 space-y-2 px-4 pt-3 lg:hidden">
        <ListConsumeActionBar
          isOwner={isOwner}
          isBookmarked={isBookmarked}
          bookmarkSaving={bookmarkSaving}
          viralProgress={viralProgress}
          saveCount={saveCount}
          onSave={() => handleToggleBookmark()}
          onShare={handleShare}
          onManage={() => setMoreOpen(true)}
        />
        <p className="text-center wibe-caption text-wibe-secondary tabular-nums">
          <button
            type="button"
            onClick={() => scrollToSection(itemsSectionEl)}
            className="hover:text-foreground"
          >
            {itemCount.toLocaleString('fa-IR')} آیتم
          </button>
          {' · '}
          <button type="button" onClick={scrollToComments} className="hover:text-foreground">
            {commentCount.toLocaleString('fa-IR')} نظر
          </button>
          {' · '}
          <span>{formatCompact(viewCount)} بازدید</span>
          {isOwner ? (
            <>
              {' · '}
              <span>{formatCompact(displaySaveCount)} ذخیره</span>
            </>
          ) : null}
        </p>
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
            {list.tags && list.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 lg:hidden">
                {list.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-md bg-wibe-surface px-3 py-1 wibe-caption font-medium text-wibe-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <section
              ref={itemsSectionRef}
              id="list-items-section"
              className={`${LIST_SECTION_SCROLL_MT} lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card lg:p-5 lg:shadow-sm`}
            >
              {showTonightPath ? (
                <div className="mb-3 flex flex-wrap items-center gap-2 lg:mb-4">
                  <span className="wibe-caption font-semibold text-foreground">امشب چی؟</span>
                  <button
                    type="button"
                    onClick={handleTonightTop5}
                    aria-pressed={tonightTop5}
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 wibe-caption font-medium transition-colors active:scale-[0.98] ${
                      tonightTop5
                        ? 'bg-primary text-white'
                        : 'border border-wibe bg-wibe-card text-foreground hover:border-primary/30'
                    }`}
                  >
                    <ListOrdered className="h-3.5 w-3.5" aria-hidden />
                    ۵تای اول
                  </button>
                  <button
                    type="button"
                    onClick={handleTonightRandom}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-wibe bg-wibe-card px-3 wibe-caption font-medium text-foreground transition-colors hover:border-primary/30 active:scale-[0.98]"
                  >
                    <Shuffle className="h-3.5 w-3.5" aria-hidden />
                    یکی تصادفی
                  </button>
                  {tonightTop5 ? (
                    <button
                      type="button"
                      onClick={() => setTonightTop5(false)}
                      className="ms-auto wibe-caption font-medium text-primary hover:underline"
                    >
                      نمایش همه
                    </button>
                  ) : null}
                </div>
              ) : null}

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
                  {isOwner ? (
                    <Link
                      href={`/user-lists/${list.id}/add-item`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 wibe-small font-medium text-white"
                    >
                      <Plus className="h-4 w-4" />
                      افزودن اولین آیتم
                    </Link>
                  ) : null}
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
                <>
                  {renderItemEntries(nonSearchEntries)}
                  {hasMoreToReveal ? (
                    <div ref={loadMoreRef} className="flex h-10 w-full items-center justify-center">
                      {loadingMoreRemote ? (
                        <span className="wibe-caption text-wibe-secondary">در حال بارگذاری…</span>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </section>

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
                  <div className="h-11 animate-pulse rounded-xl bg-wibe-surface" />
                  <div className="h-20 animate-pulse rounded-xl bg-wibe-surface" />
                  <div className="h-20 animate-pulse rounded-xl bg-wibe-surface" />
                </div>
              )}
            </div>

            {/* مشابه بعد از نظرات — وسط مصرف نیاید */}
            {showSimilarLists ? <ListSimilarListsSectionLazy listSlug={list.slug} /> : null}

            {sponsoredPlacements.afterSimilar.length > 0 ? (
              <SponsoredPlacementStack
                placements={sponsoredPlacements.afterSimilar}
                listId={list.id}
                categoryId={list.categories?.id}
                variant="inline"
              />
            ) : null}

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
            onManage={() => setMoreOpen(true)}
            onSuggestItem={handleOpenSuggest}
            statsBar={
              <ListCompactStatsBar
                variant="vertical"
                saveCount={displaySaveCount}
                itemCount={itemCount}
                commentCount={commentCount}
                viewCount={viewCount}
                isOwner={isOwner}
                isBookmarked={isBookmarked}
                bookmarkSaving={bookmarkSaving}
                onItemsClick={() => scrollToSection(itemsSectionEl)}
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
          adjacentImageUrls={previewAdjacentImageUrls}
        />
      ) : null}

      {/* منوی ⋮ — لیست تخت؛ بدون کارت تو‌در‌تو و زیرعنوان اضافه */}
      <BottomSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="گزینه‌ها"
        maxHeight="55vh"
      >
        <div className="pb-2" role="menu" aria-label="گزینه‌های لیست">
          {isOwner ? (
            <>
              <Link
                href={`/user-lists/${list.id}/add-item`}
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-right wibe-small font-semibold text-foreground">
                  افزودن آیتم
                </span>
              </Link>
              <Link
                href={`/user-lists/${list.id}`}
                role="menuitem"
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-wibe-secondary">
                  <Settings className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-right wibe-small font-medium text-foreground">
                  ویرایش لیست
                </span>
              </Link>
              <div className="my-1.5 border-t border-wibe/70" aria-hidden />
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                disabled={bookmarkSaving}
                onClick={() => handleToggleBookmark(true)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface disabled:opacity-60"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                    isBookmarked ? 'text-primary' : 'text-wibe-secondary'
                  }`}
                >
                  {isBookmarked ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Bookmark className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-right wibe-small font-medium text-foreground">
                  {isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره لیست'}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenSuggestFromMenu}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-wibe-secondary">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-right wibe-small font-medium text-foreground">
                  پیشنهاد آیتم
                </span>
              </button>
              <div className="my-1.5 border-t border-wibe/70" aria-hidden />
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleShare}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-wibe-secondary">
              <Share2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-right wibe-small font-medium text-foreground">
              اشتراک‌گذاری
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              setToast({ message: 'لینک کپی شد', type: 'success' });
              setMoreOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-wibe-secondary">
              <Link2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-right wibe-small font-medium text-foreground">
              کپی لینک
            </span>
          </button>

          {!isOwner ? (
            <>
              <div className="my-1.5 border-t border-wibe/70" aria-hidden />
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenReportFromMenu}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-red-50 active:bg-red-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-red-600">
                  <Flag className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-right wibe-small font-medium text-red-600">
                  گزارش لیست
                </span>
              </button>
            </>
          ) : null}
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
