'use client';

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
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
import { Button } from '@/components/ui/button';
import AdminListQuickEditSheet, {
  type AdminListQuickEditValues,
} from '@/components/mobile/lists/AdminListQuickEditSheet';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
  isActive?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  commentsEnabled?: boolean;
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
  /** لینک اشخاصی که صفحهٔ منتشرشده دارند. کلید: personLinkKey */
  personHrefs?: Record<string, string>;
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
          <span className="wibe-caption text-muted-foreground">ذخیره</span>
          <span className="wibe-small font-bold tabular-nums text-foreground">{countLabel}</span>
        </>
      );
      return layout === 'vertical' ? (
        <div className="flex items-center justify-between px-1 py-0.5">{row}</div>
      ) : (
        <div className="px-1 py-2.5 text-center">
          <p className="wibe-small font-bold tabular-nums leading-none text-foreground">{countLabel}</p>
          <p className="mt-0.5 wibe-caption text-muted-foreground">ذخیره</p>
        </div>
      );
    }

    const saveInteractive = Boolean(onSavesClick);
    const saveLabel = isBookmarked ? 'ذخیره شد' : 'ذخیره';
    const saveCountLabel = saveCount > 0 ? formatCompact(saveCount) : null;

    const bookmarkedHorizontal = (
      <>
        <Bookmark
          className={`mx-auto mb-1 size-4 fill-brand text-brand ${bookmarkSaving ? 'opacity-60' : ''}`}
          aria-hidden
        />
        <p className="wibe-caption font-bold leading-none text-brand">{saveLabel}</p>
        {saveCountLabel ? (
          <p className="mt-0.5 wibe-caption tabular-nums text-brand/75">{saveCountLabel}</p>
        ) : null}
      </>
    );

    const defaultHorizontal = (
      <>
        <p
          className={`wibe-small font-bold tabular-nums leading-none ${
            saveCount > 0 ? 'text-brand' : 'text-foreground'
          }`}
        >
          {saveCountLabel ?? '۰'}
        </p>
        <p className="mt-0.5 wibe-caption text-muted-foreground">{saveLabel}</p>
      </>
    );

    const bookmarkedVertical = (
      <>
        <span className="inline-flex items-center gap-1.5 wibe-caption font-bold text-brand">
          <Bookmark className="size-4 fill-brand text-brand" aria-hidden />
          {saveLabel}
        </span>
        {saveCountLabel ? (
          <span className="wibe-caption tabular-nums text-brand/75">{saveCountLabel}</span>
        ) : null}
      </>
    );

    const defaultVertical = (
      <>
        <span className="wibe-caption text-muted-foreground">{saveLabel}</span>
        <span
          className={`wibe-small font-bold tabular-nums ${
            saveCount > 0 ? 'text-brand' : 'text-foreground'
          }`}
        >
          {saveCountLabel ?? '۰'}
        </span>
      </>
    );

    const horizontalInner = isBookmarked ? bookmarkedHorizontal : defaultHorizontal;
    const verticalInner = isBookmarked ? bookmarkedVertical : defaultVertical;

    const horizontalClass = isBookmarked
      ? 'bg-brand/10 ring-1 ring-inset ring-brand/25'
      : saveInteractive
        ? 'hover:bg-brand/5 active:bg-brand/10'
        : '';

    const verticalClass = isBookmarked
      ? 'rounded-control bg-brand/10 px-2 py-1.5 ring-1 ring-inset ring-brand/20'
      : saveInteractive
        ? 'rounded-lg px-1 py-0.5 hover:bg-muted'
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
          className={`border-s border-border px-1 py-2.5 text-center transition-colors first:border-s-0 disabled:opacity-60 ${horizontalClass}`}
        >
          {horizontalInner}
        </button>
      );
    }

    return (
      <div className={`border-s border-border px-1 py-2.5 text-center first:border-s-0 ${horizontalClass}`}>
        {horizontalInner}
      </div>
    );
  };

  if (variant === 'vertical') {
    return (
      <Card className="bg-popover p-3">
        <div className="space-y-2">
          {renderSaveCell('vertical')}
          {metricCells.map(({ key, label, value, onClick }) => {
            const row = (
              <>
                <span className="wibe-caption text-muted-foreground">{label}</span>
                <span className="wibe-small font-bold tabular-nums text-foreground">{value}</span>
              </>
            );

            if (onClick) {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={onClick}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg px-1 transition-colors hover:bg-muted"
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
      </Card>
    );
  }

  return (
    <Card className="grid grid-cols-4 overflow-hidden bg-popover p-0 shadow-none lg:py-0.5">
      {renderSaveCell('horizontal')}
      {metricCells.map(({ key, label, value, onClick }) => {
        const inner = (
          <>
            <p className="wibe-small font-bold tabular-nums leading-none text-foreground">{value}</p>
            <p className="mt-0.5 wibe-caption text-muted-foreground">{label}</p>
          </>
        );

        if (onClick) {
          return (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="border-s border-border px-1 py-2.5 text-center transition-colors first:border-s-0 hover:bg-muted active:bg-muted"
            >
              {inner}
            </button>
          );
        }

        return (
          <div key={key} className="border-s border-border px-1 py-2.5 text-center first:border-s-0">
            {inner}
          </div>
        );
      })}
    </Card>
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
          <Button
            type="button"
            onClick={onSave}
            disabled={bookmarkSaving}
            aria-pressed={isBookmarked}
            variant={isBookmarked ? 'secondary' : 'brand'}
            size="lg"
            className="flex-1"
          >
            <Bookmark
              className={isBookmarked ? 'fill-primary' : undefined}
              aria-hidden
            />
            {isBookmarked ? 'ذخیره شد' : 'ذخیره'}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onShare}
          variant="outline"
          size="lg"
          className={isOwner ? 'flex-1' : undefined}
        >
          <Share2 aria-hidden />
          اشتراک
        </Button>
        {isOwner ? (
          <Button type="button" onClick={onManage} variant="ghost" size="lg">
            <Settings aria-hidden />
            مدیریت
          </Button>
        ) : null}
      </div>
      {showViral ? (
        <div className="flex items-center gap-2 px-0.5">
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-warning transition-all"
              style={{ width: `${viralProgress}%` }}
            />
          </div>
          <span className="shrink-0 wibe-caption tabular-nums text-muted-foreground">
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
  personHrefs: personHrefsProp = {},
}: ListDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  // فقط برای AT — چیدمان همچنان با CSS (`lg:`) تا CLS نسازد
  const isDesktop = useIsDesktop();
  const [items, setItems] = useState(listProp.items);
  const [personHrefs, setPersonHrefs] = useState(personHrefsProp);
  const [hasMoreRemote, setHasMoreRemote] = useState(itemsHasMore);
  const [loadingMoreRemote, setLoadingMoreRemote] = useState(false);
  const remoteFetchLock = useRef(false);
  const itemsLenRef = useRef(listProp.items.length);
  const hasMoreRemoteRef = useRef(itemsHasMore);

  const list = useMemo(() => ({ ...listProp, items }), [listProp, items]);

  useEffect(() => {
    setItems(listProp.items);
    setPersonHrefs(personHrefsProp);
    setHasMoreRemote(itemsHasMore);
    itemsLenRef.current = listProp.items.length;
    hasMoreRemoteRef.current = itemsHasMore;
  }, [listProp.id, listProp.items, itemsHasMore, personHrefsProp]);

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
        personHrefs?: Record<string, string>;
      };
      if (!res.ok || !json.success || !Array.isArray(json.items)) return false;
      if (json.items.length === 0) {
        hasMoreRemoteRef.current = false;
        setHasMoreRemote(false);
        return false;
      }
      if (json.personHrefs) {
        setPersonHrefs((prev) => ({ ...prev, ...json.personHrefs }));
      }

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
  const { can } = usePermissions();
  const canEditList = can('manage_lists');
  const [editOpen, setEditOpen] = useState(false);
  const [listDraft, setListDraft] = useState<AdminListQuickEditValues | null>(null);

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

  const editedTitle = listDraft?.title ?? list.title;
  const editedDescription = listDraft ? listDraft.description : list.description;
  const displayTitle = getDisplayListTitle({
    title: editedTitle,
    slug: list.slug,
    categorySlug: list.categories?.slug,
  });
  const categorySlug = list.categories?.slug ?? null;
  const isLifestyleList = isLifestyleCategory(categorySlug);
  const categoryIcon = list.categories?.icon ?? null;
  const listDescription = editedDescription?.trim();
  const editValues: AdminListQuickEditValues = {
    id: list.id,
    title: editedTitle,
    description: editedDescription,
    isActive: listDraft?.isActive ?? list.isActive ?? true,
    isPublic: listDraft?.isPublic ?? list.isPublic ?? true,
    isFeatured: listDraft?.isFeatured ?? list.isFeatured ?? false,
    commentsEnabled: listDraft?.commentsEnabled ?? list.commentsEnabled ?? true,
  };

  const openListEditor = () => {
    setMoreOpen(false);
    setEditOpen(true);
  };

  const handleListSaved = (next: AdminListQuickEditValues) => {
    setListDraft(next);
    setEditOpen(false);
    if (!next.isActive || !next.isPublic) {
      setToast({ message: 'لیست از دید بازدیدکننده‌ها خارج شد', type: 'success' });
      router.push(`/admin/lists/${next.id}/edit`);
      return;
    }
    setToast({ message: 'لیست ذخیره شد', type: 'success' });
    router.refresh();
  };

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
          className="inline-flex min-h-11 items-center gap-1 rounded-full bg-muted px-3 text-sm font-medium text-foreground transition-colors hover:bg-border"
        >
          {list.categories.icon} {list.categories.name}
        </Link>
      )}
      {badgeLabel && (
        <span className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold ${badgeClass ?? 'bg-muted text-foreground'}`}>
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
    <div className="bg-background" dir="rtl">
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
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-sm xl:aspect-[16/10]">
            <ImageWithFallback
              src={heroImage}
              alt={displayTitle}
              className="h-full w-full object-cover object-center"
              fallbackIcon={categoryIcon ?? '📋'}
              fallbackClassName="flex h-full w-full items-center justify-center bg-muted text-5xl"
              categorySlug={categorySlug}
              listSlug={list.slug}
              listTitle={list.title}
              priority
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setMoreOpen(true)}
              className="absolute start-3 top-3 size-11 rounded-full bg-popover/95 shadow-sm backdrop-blur"
              aria-label="بیشتر"
            >
              <MoreVertical />
            </Button>
          </div>

          <div className="min-w-0 py-1">
            <h1 className="text-h1 font-bold leading-snug text-foreground line-clamp-2 xl:text-h1">
              {displayTitle}
            </h1>
            {listDescription && (
              <p className="mt-2 line-clamp-3 max-w-2xl wibe-small leading-relaxed text-muted-foreground xl:line-clamp-2">
                {listDescription}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">{listHeroChips}</div>
          </div>
        </div>

        <div
          className="relative h-52 overflow-hidden rounded-b-xl bg-foreground sm:h-60 lg:hidden"
          aria-hidden={isDesktop || undefined}
        >
          <ImageWithFallback
            src={heroImage}
            alt={displayTitle}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fallbackIcon={categoryIcon ?? '📋'}
            fallbackClassName="absolute inset-0 flex h-full w-full items-center justify-center bg-muted text-6xl"
            categorySlug={categorySlug}
            listSlug={list.slug}
            listTitle={list.title}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
          <div className="absolute start-4 top-4 z-10">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setMoreOpen(true)}
              className="size-11 rounded-full bg-popover/95 shadow-sm backdrop-blur"
              aria-label="بیشتر"
            >
              <MoreVertical />
            </Button>
          </div>
          {isViral && (
            <div className="absolute end-4 top-4 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md wibe-caption font-semibold bg-warning text-foreground">
                <Flame className="w-3.5 h-3.5" /> وایرال
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-4 text-start">
            <h1 className="text-h1 font-bold leading-tight text-background line-clamp-2">{displayTitle}</h1>
            {listDescription && (
              <p className="mt-1 line-clamp-2 wibe-small leading-relaxed text-background/85">{listDescription}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {list.categories && (
                <Link
                  href={`/categories/${list.categories.slug}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md wibe-caption font-medium bg-background/15 backdrop-blur text-background/95"
                >
                  {list.categories.icon} {list.categories.name}
                </Link>
              )}
              {badgeLabel && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-pill wibe-caption font-semibold ${badgeClass ?? 'bg-background/20 text-background'}`}>
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
        <p className="text-center wibe-caption text-muted-foreground tabular-nums">
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
                    className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 text-sm font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <section
              ref={itemsSectionRef}
              id="list-items-section"
              className={LIST_SECTION_SCROLL_MT}
            >
            <Card className="rounded-none border-0 bg-transparent p-0 shadow-none lg:border lg:bg-popover lg:p-5 lg:shadow-surface">
              {showTonightPath ? (
                <div className="mb-3 flex flex-wrap items-center gap-2 lg:mb-4">
                  <span className="wibe-caption font-semibold text-foreground">امشب چی؟</span>
                  <Button
                    type="button"
                    onClick={handleTonightTop5}
                    aria-pressed={tonightTop5}
                    variant={tonightTop5 ? 'default' : 'outline'}
                    size="sm"
                    className="h-11 rounded-full"
                  >
                    <ListOrdered aria-hidden />
                    ۵تای اول
                  </Button>
                  <Button
                    type="button"
                    onClick={handleTonightRandom}
                    variant="outline"
                    size="sm"
                    className="h-11 rounded-full"
                  >
                    <Shuffle aria-hidden />
                    یکی تصادفی
                  </Button>
                  {tonightTop5 ? (
                    <Button
                      type="button"
                      onClick={() => setTonightTop5(false)}
                      variant="ghost"
                      size="sm"
                      className="ms-auto h-11"
                    >
                      نمایش همه
                    </Button>
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
                        <p className="mt-1 px-0.5 wibe-caption text-muted-foreground">
                          {filteredItemEntries.length.toLocaleString('fa-IR')} نتیجه از{' '}
                          {list.items.length.toLocaleString('fa-IR')} آیتم
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {showMapView && list.items.length > 0 ? (
                    <Button
                      type="button"
                      onClick={handleSetMap}
                      title={viewMode === 'map' ? 'نمایش شبکه‌ای' : 'نمایش نقشه'}
                      aria-label={viewMode === 'map' ? 'نمایش شبکه‌ای' : 'نمایش نقشه'}
                      aria-pressed={viewMode === 'map'}
                      variant={viewMode === 'map' ? 'secondary' : 'outline'}
                      size="lg"
                      className="shrink-0"
                    >
                      {viewMode === 'map' ? (
                        <LayoutGrid className="h-4 w-4" />
                      ) : (
                        <Map className="h-4 w-4" />
                      )}
                      {viewMode === 'map' ? 'شبکه' : 'نقشه'}
                    </Button>
                  ) : null}
                </div>
              )}

              {!list.items?.length ? (
                <EmptyState
                  title="این لیست هنوز آیتمی ندارد"
                  action={
                    isOwner ? (
                      <Button
                        type="button"
                        variant="brand"
                        size="lg"
                        onClick={() => router.push(`/user-lists/${list.id}/add-item`)}
                      >
                        <Plus aria-hidden />
                        افزودن اولین آیتم
                      </Button>
                    ) : undefined
                  }
                />
              ) : isItemSearchActive && filteredItemEntries.length === 0 ? (
                <EmptyState
                  title="آیتمی پیدا نشد"
                  description={`عبارت دیگری برای «${normalizedItemSearch}» امتحان کن`}
                  action={
                    <Button type="button" variant="ghost" size="lg" onClick={() => setItemSearchQuery('')}>
                      پاک کردن جستجو
                    </Button>
                  }
                />
              ) : isItemSearchActive ? (
                renderItemEntries(filteredItemEntries)
              ) : (
                <>
                  {renderItemEntries(nonSearchEntries)}
                  {hasMoreToReveal ? (
                    <div ref={loadMoreRef} className="flex h-10 w-full items-center justify-center">
                      {loadingMoreRemote ? (
                        <span className="wibe-caption text-muted-foreground">در حال بارگذاری…</span>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </Card>
            </section>

            <div
              ref={commentsSectionRef}
              id="list-comments-section"
              className={`${LIST_SECTION_SCROLL_MT} border-t border-border pt-6 lg:mt-0 lg:border-0 lg:pt-0`}
            >
            <Card className="rounded-none border-0 bg-transparent p-0 shadow-none lg:border lg:bg-popover lg:p-5 lg:shadow-surface">
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
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              )}
            </Card>
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
            onEdit={canEditList ? openListEditor : undefined}
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
          personHrefs={personHrefs}
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
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start text-sm font-semibold text-foreground">
                  افزودن آیتم
                </span>
              </Link>
              {canEditList ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={openListEditor}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
                    <Settings className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
                    ویرایش لیست
                  </span>
                </button>
              ) : (
                <Link
                  href={`/user-lists/${list.id}`}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
                    <Settings className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
                    ویرایش لیست
                  </span>
                </Link>
              )}
              <div className="my-1.5 border-t border-border" aria-hidden />
            </>
          ) : (
            <>
              {canEditList ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={openListEditor}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Settings className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-start text-sm font-semibold text-foreground">
                    ویرایش لیست
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                disabled={bookmarkSaving}
                onClick={() => handleToggleBookmark(true)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center ${
                    isBookmarked ? 'text-brand' : 'text-muted-foreground'
                  }`}
                >
                  {isBookmarked ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Bookmark className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
                  {isBookmarked ? 'حذف از ذخیره‌ها' : 'ذخیره لیست'}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenSuggestFromMenu}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
                  پیشنهاد آیتم
                </span>
              </button>
              <div className="my-1.5 border-t border-border" aria-hidden />
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={handleShare}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
          >
            <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
              <Share2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
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
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-muted"
          >
            <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
              <Link2 className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-start text-sm font-medium text-foreground">
              کپی لینک
            </span>
          </button>

          {!isOwner ? (
            <>
              <div className="my-1.5 border-t border-border" aria-hidden />
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenReportFromMenu}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-start transition-colors hover:bg-destructive/10"
              >
                <span className="flex size-11 shrink-0 items-center justify-center text-destructive">
                  <Flag className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-start text-sm font-medium text-destructive">
                  گزارش لیست
                </span>
              </button>
            </>
          ) : null}
        </div>
      </BottomSheet>

      {canEditList ? (
        <AdminListQuickEditSheet
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          list={editValues}
          onSaved={handleListSaved}
          onError={(message) => setToast({ message, type: 'error' })}
        />
      ) : null}

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
