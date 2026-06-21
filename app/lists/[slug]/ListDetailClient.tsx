'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useListScrollDepth } from '@/hooks/useListScrollDepth';
import { useInterestTracking } from '@/hooks/useInterestTracking';
import { Share2, MoreVertical, Flame, Bookmark, LayoutGrid, List as ListIcon, Plus, Settings, Link2, Flag, Lightbulb, Map } from 'lucide-react';
import ListDetailActionRow from '@/components/mobile/lists/ListDetailActionRow';
import ListDetailSidebar from '@/components/mobile/lists/ListDetailSidebar';
import ListDetailSubNav from '@/components/mobile/lists/ListDetailSubNav';
import ListItemQuickActions from '@/components/mobile/lists/ListItemQuickActions';
import ListItemsMapView from '@/components/mobile/lists/ListItemsMapView';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import { uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';
import ListReportModal from '@/components/mobile/lists/ListReportModal';
import VibeCommentSectionLazy from '@/components/mobile/lists/VibeCommentSectionLazy';
import SuggestItemSearch from '@/components/mobile/lists/SuggestItemSearch';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import Toast from '@/components/shared/Toast';
import ItemPreviewSheet, { type ItemPreviewData } from '@/components/mobile/lists/ItemPreviewSheet';
import SearchInput from '@/components/mobile/search/SearchInput';
import LazyItemCoverImage from '@/components/shared/LazyItemCoverImage';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ListCardStats from '@/components/shared/ListCardStats';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/lib/layout-tokens';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop';
import { getDisplayListTitle } from '@/lib/list-display-title';
import { getItemCardSubtitle, filterItemsByQuery, LIST_INNER_SEARCH_MIN_ITEMS } from '@/lib/item-display-utils';
import { isLocationCategorySlug } from '@/lib/category-layout';
import {
  buildListItemQuickActions,
  itemHasMapLocation,
} from '@/lib/list-item-quick-actions';
import { normalizeSearchQuery } from '@/lib/list-search';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';
import LightweightEntryRow from '@/components/shared/list-entries/LightweightEntryRow';
import { SponsoredPlacementStack } from '@/components/shared/SponsoredTextBanner';
import type { ListPagePlacements } from '@/lib/sponsored-placements';
import {
  isLightweightListItem,
  isLifestyleCategory,
  isMixedListCategory,
  resolveEntryKind,
  sourceCategorySlugFromItem,
} from '@/lib/list-entry';
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

type RelatedList = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  saveCount: number;
  itemCount: number;
  categories: Category;
};

interface ListDetailClientProps {
  list: ListDetail;
  relatedLists: RelatedList[];
  sponsoredPlacements?: ListPagePlacements;
}

const LIST_VIEW_PREFERENCE_KEY = 'wibe:listViewPreference';

type ListViewMode = 'list' | 'grid' | 'map';

type ItemEntry = { item: Item; originalIndex: number };

const GRID_DEFAULT_CATEGORY_SLUGS = [
  'movie',
  'movies',
  'series',
  'travel',
  'restaurant',
  'cafe',
  'book',
  'books',
];

function getDefaultView(
  categorySlug: string | undefined,
  items?: { imageUrl: string | null; catalogItemId?: string | null; metadata?: unknown }[]
): 'grid' | 'list' {
  if (categorySlug && isMixedListCategory(categorySlug)) {
    const lightweightCount =
      items?.filter((i) => isLightweightListItem(i)).length ?? 0;
    if (items?.length && lightweightCount / items.length >= 0.35) return 'list';
  }
  if (categorySlug) {
    const slug = categorySlug.toLowerCase();
    if (GRID_DEFAULT_CATEGORY_SLUGS.some((s) => slug === s || slug.includes(s))) return 'grid';
  }
  if (items?.length) {
    const withImage = items.filter((i) => i.imageUrl?.trim()).length;
    if (withImage / items.length >= 0.8) return 'grid';
  }
  return 'list';
}

function ListCompactStatsBar({
  saveCount,
  itemCount,
  commentCount,
  viewCount,
  isOwner = false,
  variant = 'horizontal',
  onItemsClick,
  onCommentsClick,
}: {
  saveCount: number;
  itemCount: number;
  commentCount: number;
  viewCount: number;
  isOwner?: boolean;
  variant?: 'horizontal' | 'vertical';
  onItemsClick?: () => void;
  onCommentsClick?: () => void;
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

function SimilarListCard({ rel }: { rel: RelatedList }) {
  const title = getDisplayListTitle({
    title: rel.title,
    slug: rel.slug,
    categorySlug: rel.categories?.slug,
  });
  return (
    <Link
      href={`/lists/${rel.slug}`}
      className="w-[calc(55vw)] max-w-[220px] shrink-0 overflow-hidden rounded-lg border border-wibe bg-wibe-card shadow-sm transition-all active:scale-[0.99] lg:w-full lg:max-w-none lg:hover:border-primary/20 lg:hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-200 lg:aspect-[16/10] lg:max-h-[7.25rem]">
        <ImageWithFallback
          src={rel.coverImage ?? ''}
          alt={title}
          className="h-full w-full object-cover"
          fallbackIcon={rel.categories?.icon ?? '📋'}
          fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200 text-2xl"
          categorySlug={rel.categories?.slug}
          listSlug={rel.slug}
          listTitle={rel.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2 text-right lg:p-2.5">
          <h3 className="mb-0.5 line-clamp-2 wibe-small font-semibold text-white lg:hidden">{title}</h3>
          <ListCardStats saves={rel.saveCount} itemCount={rel.itemCount} variant="overlay" />
        </div>
      </div>
      <div className="hidden min-w-0 p-2 lg:block">
        <h3 className="line-clamp-2 wibe-caption font-semibold text-foreground">{title}</h3>
      </div>
    </Link>
  );
}

const LIST_SECTION_SCROLL_MT = 'scroll-mt-[7.5rem]';

function SimilarListsCarousel({
  relatedLists,
  sectionRef,
}: {
  relatedLists: RelatedList[];
  sectionRef?: React.RefObject<HTMLElement | null>;
}) {
  if (relatedLists.length === 0) return null;
  return (
    <section
      ref={sectionRef}
      id="list-similar-section"
      className={`${LIST_SECTION_SCROLL_MT} mt-1 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card/60 lg:p-5 lg:pt-5`}
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="wibe-h3 text-foreground">لیست‌های مشابه</h3>
          <p className="mt-0.5 wibe-caption text-wibe-secondary">ممکنه این‌ها هم به کارت بیان</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0 xl:grid-cols-5 2xl:grid-cols-6">
        {relatedLists.map((rel) => (
          <SimilarListCard key={rel.id} rel={rel} />
        ))}
      </div>
    </section>
  );
}

function itemDisplayCategorySlug(item: Item, listCategorySlug?: string | null): string | null {
  return sourceCategorySlugFromItem(item) ?? listCategorySlug ?? null;
}

function LightweightGridCard({
  item,
  index,
  entryKind,
  categorySlug,
  onOpen,
  hideEntryKindChrome = false,
}: {
  item: Item;
  index: number;
  entryKind: ReturnType<typeof resolveEntryKind>;
  categorySlug?: string | null;
  onOpen: () => void;
  hideEntryKindChrome?: boolean;
}) {
  return (
    <div className={hideEntryKindChrome ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
      <LightweightEntryRow
        item={item}
        index={index}
        entryKind={entryKind}
        categorySlug={categorySlug}
        onOpen={onOpen}
        compact={!hideEntryKindChrome}
        hideEntryKindChrome={hideEntryKindChrome}
      />
    </div>
  );
}

function GridItemCard({
  item,
  index,
  categorySlug,
  categoryIcon,
  onOpen,
}: {
  item: Item;
  index: number;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  onOpen: () => void;
}) {
  const subtitle = getItemCardSubtitle({
    description: item.description,
    rating: item.rating,
    metadata: item.metadata,
    categorySlug,
  });
  const isMovieGrid = isMovieLikeCategory(categorySlug);
  const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-wibe bg-wibe-card text-right shadow-sm transition-all lg:hover:border-primary/20 lg:hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-right transition-all active:scale-[0.99]"
      >
      <div
        className={`relative overflow-hidden ${
          isMovieGrid
            ? 'aspect-[2/3] lg:mx-auto lg:max-h-[13.5rem] lg:w-full lg:max-w-[10.5rem]'
            : 'aspect-[4/3] lg:max-h-[10.5rem]'
        }`}
      >
        <LazyItemCoverImage
          itemId={item.id}
          imageUrl={item.displayImageUrl ?? item.imageUrl}
          title={item.title}
          metadata={item.metadata}
          categorySlug={categorySlug}
          className="h-full w-full object-cover"
          fallbackIcon={categoryIcon ?? '🎬'}
          fallbackClassName="flex h-full w-full items-center justify-center text-2xl"
          enrichWhenVisible={isMovieGrid}
          coverLayout="grid"
        />
        <span className="absolute right-1.5 top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-black/70 px-1.5 ring-1 ring-white/25 wibe-caption font-bold text-white tabular-nums">
          {(index + 1).toLocaleString('fa-IR')}
        </span>
      </div>
      <div className="min-h-0 p-2.5 lg:p-3">
        <h3 className="line-clamp-2 wibe-small font-semibold leading-tight text-foreground lg:text-[0.9375rem]">
          {item.title}
        </h3>
        {subtitle && (
          <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">{subtitle}</p>
        )}
      </div>
      </button>
      {quickActions.length > 0 && (
        <div className="border-t border-wibe/60 px-2.5 py-2 lg:px-3">
          <ListItemQuickActions actions={quickActions} size="sm" />
        </div>
      )}
    </div>
  );
}

function ListItemRow({
  item,
  index,
  categorySlug,
  categoryIcon,
  isSimilar,
  onOpen,
}: {
  item: Item;
  index: number;
  categorySlug?: string | null;
  categoryIcon?: string | null;
  isSimilar?: boolean;
  onOpen: () => void;
}) {
  const subtitle = getItemCardSubtitle({
    description: item.description,
    rating: item.rating,
    metadata: item.metadata,
    categorySlug,
  });
  const isMovieRow = isMovieLikeCategory(categorySlug);
  const quickActions = buildListItemQuickActions(item.metadata, categorySlug);

  return (
    <div
      className={`flex items-stretch gap-1 rounded-lg border border-wibe bg-wibe-card shadow-sm transition-all lg:hover:border-primary/15 lg:hover:shadow-sm ${
        isSimilar ? 'opacity-85' : ''
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 min-h-[68px] items-center gap-3 p-2.5 text-right transition-all active:scale-[0.99] lg:min-h-[80px] lg:gap-4 lg:p-3.5"
      >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 wibe-caption font-semibold text-wibe-secondary tabular-nums lg:h-8 lg:w-8">
        {(index + 1).toLocaleString('fa-IR')}
      </div>
      <div
        className={`relative shrink-0 overflow-hidden rounded-md ${
          isMovieRow ? 'aspect-[2/3] w-11 lg:w-14' : 'h-12 w-12 lg:h-14 lg:w-14'
        }`}
      >
        <LazyItemCoverImage
          itemId={item.id}
          imageUrl={item.displayImageUrl ?? item.imageUrl}
          title={item.title}
          metadata={item.metadata}
          categorySlug={categorySlug}
          className="h-full w-full object-cover"
          fallbackIcon={categoryIcon ?? '🎬'}
          fallbackClassName="flex h-full w-full items-center justify-center text-lg"
          enrichWhenVisible={isMovieRow}
          coverLayout="list"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 wibe-small font-semibold text-foreground lg:text-[0.9375rem] lg:leading-snug">
          {item.title}
          {isSimilar && (
            <span className="wibe-caption font-normal text-wibe-secondary mr-1">(مشابه)</span>
          )}
        </h3>
        {subtitle && (
          <p className="wibe-caption text-wibe-secondary line-clamp-1 mt-0.5">{subtitle}</p>
        )}
      </div>
      </button>
      {quickActions.length > 0 && (
        <div className="flex shrink-0 items-center border-r border-wibe/60 px-2">
          <ListItemQuickActions actions={quickActions} layout="vertical" size="sm" />
        </div>
      )}
    </div>
  );
}

export default function ListDetailClient({
  list,
  relatedLists,
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
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [stickySaving, setStickySaving] = useState(false);
  const heroBannerRef = useRef<HTMLElement>(null);
  const itemsSectionRef = useRef<HTMLElement>(null);
  const similarSectionRef = useRef<HTMLElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ListViewMode>(() => {
    if (typeof window === 'undefined')
      return getDefaultView(list.categories?.slug, list.items);
    try {
      const stored = localStorage.getItem(LIST_VIEW_PREFERENCE_KEY);
      if (stored === 'grid' || stored === 'list') return stored;
    } catch {}
    return getDefaultView(list.categories?.slug, list.items);
  });
  const [showGridHint, setShowGridHint] = useState(false);
  const [gridHintVisible, setGridHintVisible] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [listReportOpen, setListReportOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleScrollToComment = useCallback((commentId: string) => {
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

  const fetchViewerState = useCallback(() => {
    if (!session?.user) return;
    fetch(`/api/lists/${list.id}/viewer-state`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.data) {
          setIsBookmarked(!!data.data.isBookmarked);
        }
      })
      .catch(() => {});
  }, [session?.user, list.id]);

  useEffect(() => {
    if (!session?.user) return;
    fetchViewerState();
  }, [session?.user, fetchViewerState]);

  useEffect(() => {
    if (!stickyVisible || !session?.user) return;
    fetchViewerState();
  }, [stickyVisible, session?.user, fetchViewerState]);

  const setViewModeAndPersist = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem(LIST_VIEW_PREFERENCE_KEY, mode);
    } catch {}
  };

  const handleSetGrid = () => {
    if (viewMode !== 'grid') {
      setViewModeAndPersist('grid');
      setShowGridHint(true);
      setGridHintVisible(true);
    }
  };

  const handleSetList = () => {
    if (viewMode !== 'list') setViewModeAndPersist('list');
  };

  const handleSetMap = () => {
    if (viewMode !== 'map') setViewMode('map');
  };

  useEffect(() => {
    if (!showGridHint) return;
    const t = setTimeout(() => setGridHintVisible(false), 2500);
    return () => clearTimeout(t);
  }, [showGridHint]);

  const itemCount = list.itemCount ?? list._count?.items ?? list.items?.length ?? 0;
  const commentCount = list._count?.list_comments ?? 0;
  const saveCount = list.saveCount ?? 0;
  const viewCount = list.viewCount ?? 0;
  const isViral = list.badge === 'TRENDING' || saveCount >= 100;
  const isOwner = !!session?.user && list.userId === (session.user as { id?: string }).id;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    const el = heroBannerRef.current;
    if (el) observer.observe(el);
    return () => (el ? observer.unobserve(el) : undefined);
  }, []);

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
          itemDisplayCategorySlug(item, categorySlug)
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

  const showStickyBar = stickyVisible && !isBookmarked && !isOwner;

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

  const normalizedItemSearch = normalizeSearchQuery(itemSearchQuery);
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
  const showSimilarLists = !isItemSearchActive && relatedLists.length > 0;

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
        <ListItemsMapView entries={entries} categorySlug={categorySlug} />
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {entries.map(({ item, originalIndex }) => {
            const entryKind = resolveEntryKind(item);
            if (isLightweightListItem(item)) {
              const itemCategorySlug = itemDisplayCategorySlug(item, categorySlug);
              return (
                <LightweightGridCard
                  key={item.id}
                  item={item}
                  index={originalIndex}
                  entryKind={entryKind}
                  categorySlug={itemCategorySlug}
                  onOpen={() => openItemPreview(originalIndex)}
                  hideEntryKindChrome={isLifestyleList}
                />
              );
            }
            const itemCategorySlug = itemDisplayCategorySlug(item, categorySlug);
            return (
              <GridItemCard
                key={item.id}
                item={item}
                index={originalIndex}
                categorySlug={itemCategorySlug}
                categoryIcon={categoryIcon}
                onOpen={() => openItemPreview(originalIndex)}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div
        className={
          isLifestyleList
            ? 'mx-auto max-w-2xl space-y-2.5'
            : 'space-y-2.5 lg:grid lg:grid-cols-1 lg:gap-2.5 lg:space-y-0 xl:grid-cols-2 xl:gap-3'
        }
      >
        {entries.map(({ item, originalIndex }, i) => {
          const prevEntry = i > 0 ? entries[i - 1] : null;
          const isSimilar =
            !!prevEntry &&
            item.title.slice(0, 12) === prevEntry.item.title.slice(0, 12);
          const entryKind = resolveEntryKind(item);

          if (isLightweightListItem(item)) {
            const itemCategorySlug = itemDisplayCategorySlug(item, categorySlug);
            return (
              <LightweightEntryRow
                key={item.id}
                item={item}
                index={originalIndex}
                entryKind={entryKind}
                categorySlug={itemCategorySlug}
                onOpen={() => openItemPreview(originalIndex)}
                hideEntryKindChrome={isLifestyleList}
              />
            );
          }

          const itemCategorySlug = itemDisplayCategorySlug(item, categorySlug);
          return (
            <ListItemRow
              key={item.id}
              item={item}
              index={originalIndex}
              categorySlug={itemCategorySlug}
              categoryIcon={categoryIcon}
              isSimilar={isSimilar}
              onOpen={() => openItemPreview(originalIndex)}
            />
          );
        })}
      </div>
    );
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
          saveCount={saveCount}
          itemCount={itemCount}
          commentCount={commentCount}
          viewCount={viewCount}
          isOwner={isOwner}
          onItemsClick={() => scrollToSection(itemsSectionRef)}
          onCommentsClick={() => scrollToSection(commentsSectionRef)}
        />
      </div>

      <div className="relative z-20 px-4 lg:px-0">
        <ListDetailSubNav
          itemCount={itemCount}
          commentCount={commentCount}
          showSimilar={showSimilarLists}
          onItemsClick={() => scrollToSection(itemsSectionRef)}
          onSimilarClick={() => scrollToSection(similarSectionRef)}
          onCommentsClick={() => scrollToSection(commentsSectionRef)}
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
              ) : (
                <ListDetailActionRow
                  listId={list.id}
                  listSlug={list.slug}
                  categorySlug={list.categories?.slug}
                  saveCount={saveCount}
                  isOwner={false}
                  onBookmarkToggle={(saved) => setIsBookmarked(saved)}
                  onShare={handleShare}
                />
              )}

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

              {isViral && !isOwner && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2.5">
                  <Flame className="h-4 w-4 shrink-0 text-warning" />
                  <span className="wibe-caption font-medium text-foreground">
                    لیست وایرال — {formatCompact(saveCount)} ذخیره
                  </span>
                </div>
              )}
            </div>

            <section
              ref={itemsSectionRef}
              id="list-items-section"
              className={`${LIST_SECTION_SCROLL_MT} lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card lg:p-5 lg:shadow-sm`}
            >
              <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:mb-4">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:gap-3">
                  <h2 className="wibe-h3 shrink-0">
                    آیتم‌های لیست
                    <span className="mr-1.5 wibe-caption font-medium text-wibe-secondary">
                      ({itemCount.toLocaleString('fa-IR')})
                    </span>
                  </h2>
                  {showItemSearch && (
                    <div className="min-w-0 w-full flex-1 sm:w-auto sm:max-w-xs lg:max-w-sm">
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
                  )}
                  {list.items?.length > 0 && (
                    <div className="mr-auto flex shrink-0 rounded-lg border border-wibe bg-gray-100 p-0.5 sm:mr-0">
                      <button
                        type="button"
                        onClick={handleSetList}
                        title="لیستی"
                        aria-label="نمایش لیستی"
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md wibe-caption transition-colors ${
                          viewMode === 'list'
                            ? 'bg-wibe-card shadow-sm text-primary'
                            : 'text-wibe-secondary'
                        }`}
                      >
                        <ListIcon className="w-3.5 h-3.5" />
                        لیست
                      </button>
                      <button
                        type="button"
                        onClick={handleSetGrid}
                        title="شبکه‌ای"
                        aria-label="نمایش شبکه‌ای"
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md wibe-caption transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-wibe-card shadow-sm text-primary'
                            : 'text-wibe-secondary'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        شبکه
                      </button>
                      {showMapView && (
                        <button
                          type="button"
                          onClick={handleSetMap}
                          title="نقشه"
                          aria-label="نمایش نقشه"
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md wibe-caption transition-colors ${
                            viewMode === 'map'
                              ? 'bg-wibe-card shadow-sm text-primary'
                              : 'text-wibe-secondary'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" />
                          نقشه
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {viewMode === 'grid' && gridHintVisible && !isItemSearchActive && (
                <p className="wibe-caption text-wibe-secondary mb-2.5 text-center">
                  مرور سریع‌تر با نمای شبکه‌ای
                </p>
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

            {showSimilarLists && (
              <SimilarListsCarousel relatedLists={relatedLists} sectionRef={similarSectionRef} />
            )}

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
              <VibeCommentSectionLazy
                listId={list.id}
                listSlug={list.slug}
                isOwner={isOwner}
                categorySlug={categorySlug}
                onOpenSuggestItem={() => setSuggestOpen(true)}
                embeddedInSidebar
              />
            </div>

            <div className="h-6 lg:h-2" />
          </div>

          <ListDetailSidebar
            listId={list.id}
            saveCount={saveCount}
            isOwner={isOwner}
            isViral={isViral}
            viralProgress={viralProgress}
            sidebarAds={sponsoredPlacements.sidebar}
            sidebarAdListId={list.id}
            sidebarAdCategoryId={list.categories?.id}
            tags={list.tags}
            onBookmarkToggle={(saved) => setIsBookmarked(saved)}
            onShare={handleShare}
            onManage={() => setManageOpen(true)}
            onSuggestItem={handleOpenSuggest}
            statsBar={
              <ListCompactStatsBar
                variant="vertical"
                saveCount={saveCount}
                itemCount={itemCount}
                commentCount={commentCount}
                viewCount={viewCount}
                isOwner={isOwner}
                onItemsClick={() => scrollToSection(itemsSectionRef)}
                onCommentsClick={() => scrollToSection(commentsSectionRef)}
              />
            }
          />
        </div>
      </main>

      {/* پیش‌نمایش آیتم */}
      <ItemPreviewSheet
        isOpen={previewIndex != null}
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

      <ListReportModal
        isOpen={listReportOpen}
        onClose={() => setListReportOpen(false)}
        listId={list.id}
        onReportSuccess={() => setToast({ message: 'گزارش ثبت شد', type: 'success' })}
      />

      {/* مودال پیشنهاد آیتم */}
      <BottomSheet
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="پیشنهاد آیتم"
        subtitle="جستجو کن یا از پیشنهادها انتخاب کن"
        maxHeight="85vh"
      >
        <SuggestItemSearch
          listId={list.id}
          categorySlug={list.categories?.slug}
          onSuccess={() => setSuggestOpen(false)}
          onScrollToComment={handleScrollToComment}
          showToast={(message, type) => setToast({ message, type })}
        />
      </BottomSheet>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {showStickyBar && session?.user && (
        <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center px-4 lg:hidden">
          <div className={`flex w-full gap-2 ${MOBILE_SHELL_MAX_WIDTH_CLASS}`}>
            <button
              type="button"
              disabled={stickySaving}
              onClick={async () => {
                setStickySaving(true);
                try {
                  const res = await fetch(`/api/lists/${list.id}/bookmark`, { method: 'POST' });
                  const data = await res.json();
                  if (data?.success && data.data?.isBookmarked) setIsBookmarked(true);
                } finally {
                  setStickySaving(false);
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-semibold text-white shadow-lg wibe-small transition-colors hover:bg-primary-dark disabled:opacity-70"
            >
              <Bookmark className="h-4 w-4" />
              ذخیره لیست
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-wibe bg-wibe-card shadow-lg"
              aria-label="اشتراک‌گذاری"
            >
              <Share2 className="h-5 w-5 text-wibe-secondary" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav placeholder - actual BottomNav is in page */}
    </div>
  );
}
