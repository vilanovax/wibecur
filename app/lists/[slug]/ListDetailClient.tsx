'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Share2, MoreVertical, Flame, Bookmark, LayoutGrid, List as ListIcon, Plus, Settings, Link2, Flag, Lightbulb } from 'lucide-react';
import ListDetailActionRow from '@/components/mobile/lists/ListDetailActionRow';
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
import { getDisplayListTitle } from '@/lib/list-display-title';
import { getItemCardSubtitle, filterItemsByQuery, LIST_INNER_SEARCH_MIN_ITEMS } from '@/lib/item-display-utils';
import { normalizeSearchQuery } from '@/lib/list-search';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';
type Item = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  displayImageUrl?: string | null;
  externalUrl?: string | null;
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
}

const LIST_VIEW_PREFERENCE_KEY = 'wibe:listViewPreference';

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
  items?: { imageUrl: string | null }[]
): 'grid' | 'list' {
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
  onItemsClick,
  onCommentsClick,
}: {
  saveCount: number;
  itemCount: number;
  commentCount: number;
  viewCount: number;
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
    { key: 'save', label: 'ذخیره', value: formatCompact(saveCount), highlight: true },
    { key: 'items', label: 'آیتم', value: itemCount.toLocaleString('fa-IR'), onClick: onItemsClick },
    {
      key: 'comments',
      label: 'نظر',
      value: commentCount.toLocaleString('fa-IR'),
      onClick: onCommentsClick,
    },
    { key: 'views', label: 'بازدید', value: formatCompact(viewCount) },
  ];

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

function SimilarListsCarousel({ relatedLists }: { relatedLists: RelatedList[] }) {
  if (relatedLists.length === 0) return null;
  return (
    <section className="mt-1 border-t border-wibe pt-4 lg:rounded-2xl lg:border lg:bg-wibe-card/60 lg:p-5 lg:pt-5">
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

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full overflow-hidden rounded-lg border border-wibe bg-wibe-card text-right shadow-sm transition-all active:scale-[0.99] lg:hover:border-primary/20 lg:hover:shadow-md"
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
        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/55 px-1 wibe-caption font-semibold text-white tabular-nums lg:h-6 lg:min-w-[1.5rem]">
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

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full min-h-[68px] items-center gap-3 rounded-lg border border-wibe bg-wibe-card p-2.5 text-right shadow-sm transition-all active:scale-[0.99] lg:min-h-[80px] lg:gap-4 lg:p-3.5 lg:hover:border-primary/15 lg:hover:shadow-sm ${
        isSimilar ? 'opacity-85' : ''
      }`}
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
  );
}

export default function ListDetailClient({
  list,
  relatedLists,
}: ListDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [stickyVisible, setStickyVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [stickySaving, setStickySaving] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsSectionRef = useRef<HTMLElement>(null);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
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
    const el = titleRef.current;
    if (el) observer.observe(el);
    return () => (el ? observer.unobserve(el) : undefined);
  }, []);

  const displayTitle = getDisplayListTitle({
    title: list.title,
    slug: list.slug,
    categorySlug: list.categories?.slug,
  });
  const categorySlug = list.categories?.slug ?? null;
  const categoryIcon = list.categories?.icon ?? null;
  const listDescription = list.description?.trim();

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

  const handleOpenSuggestFromMenu = () => {
    setMoreOpen(false);
    if (isOwner) {
      router.push(`/user-lists/${list.id}/add-item`);
      return;
    }
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/lists/${list.slug}?suggest=1`)}`);
      return;
    }
    setSuggestOpen(true);
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
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {entries.map(({ item, originalIndex }) => (
            <GridItemCard
              key={item.id}
              item={item}
              index={originalIndex}
              categorySlug={categorySlug}
              categoryIcon={categoryIcon}
              onOpen={() => openItemPreview(originalIndex)}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2.5 lg:grid lg:grid-cols-1 lg:gap-2.5 lg:space-y-0 xl:grid-cols-2 xl:gap-3">
        {entries.map(({ item, originalIndex }, i) => {
          const prevEntry = i > 0 ? entries[i - 1] : null;
          const isSimilar =
            !!prevEntry &&
            item.title.slice(0, 12) === prevEntry.item.title.slice(0, 12);
          return (
            <ListItemRow
              key={item.id}
              item={item}
              index={originalIndex}
              categorySlug={categorySlug}
              categoryIcon={categoryIcon}
              isSimilar={isSimilar}
              onOpen={() => openItemPreview(originalIndex)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-wibe-surface" dir="rtl">
      {/* Hero — تمام‌عرض در دسکتاپ */}
      <section className="lg:-mx-4 xl:-mx-5">
        <div className="relative h-[210px] overflow-hidden rounded-b-2xl bg-gray-900 sm:h-[240px] lg:h-auto lg:min-h-[280px] lg:aspect-[16/9] lg:rounded-none lg:shadow-sm xl:min-h-[300px]">
          <ImageWithFallback
            src={list.bannerImage ?? list.horizontalImage ?? list.coverImage ?? ''}
            alt={displayTitle}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fallbackIcon={categoryIcon ?? '📋'}
            fallbackClassName="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-200 text-6xl"
            categorySlug={categorySlug}
            listSlug={list.slug}
            listTitle={list.title}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 lg:from-black/85 lg:via-black/40 lg:to-transparent" />
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 lg:top-5 lg:right-5">
            <ListDetailActionRow
              listId={list.id}
              saveCount={saveCount}
              isOwner={isOwner}
              variant="icons"
              onBookmarkToggle={(saved) => setIsBookmarked(saved)}
              onShare={handleShare}
            />
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-wibe-card/95 text-foreground shadow-sm backdrop-blur transition-transform active:scale-95"
              aria-label="بیشتر"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 lg:top-5 lg:left-5">
            {isViral && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md wibe-caption font-semibold bg-warning text-white">
                <Flame className="w-3.5 h-3.5" /> وایرال
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-4 text-right lg:p-6 lg:pb-7">
            <h1
              ref={titleRef}
              className="text-h1 font-bold leading-tight text-white line-clamp-2 lg:text-[1.75rem] lg:leading-snug xl:text-3xl"
            >
              {displayTitle}
            </h1>
            {listDescription && (
              <p className="mt-1 line-clamp-1 wibe-small leading-relaxed text-white/85 lg:line-clamp-2 lg:max-w-3xl">
                {listDescription}
              </p>
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
      </section>

      <div className="relative z-20 -mt-4 px-4 lg:mt-0 lg:px-0">
        <ListCompactStatsBar
          saveCount={saveCount}
          itemCount={itemCount}
          commentCount={commentCount}
          viewCount={viewCount}
          onItemsClick={() => scrollToSection(itemsSectionRef)}
          onCommentsClick={() => scrollToSection(commentsSectionRef)}
        />
      </div>

      <main className="relative z-10 px-4 pt-3 lg:px-0 lg:pt-5">
        <div className="flex flex-col gap-6 lg:gap-8">
          <div className="min-w-0 space-y-3 lg:space-y-4">
        {isOwner ? (
          <>
            {saveCount < 100 && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                <div className="mb-1 flex items-center justify-between wibe-caption text-wibe-secondary">
                  <span>تا لیست وایرال</span>
                  <span className="font-semibold tabular-nums">{Math.round(viralProgress)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-warning" style={{ width: `${viralProgress}%` }} />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-2.5 wibe-small font-semibold text-primary active:scale-[0.99]"
            >
              <Settings className="h-4 w-4" />
              مدیریت لیست
            </button>
            <p className="text-center wibe-caption text-wibe-secondary">
              این لیست مال خودته — امکان ذخیره‌اش نیست
            </p>
            <ListDetailActionRow
              listId={list.id}
              saveCount={saveCount}
              isOwner
              onShare={handleShare}
            />
          </>
        ) : (
          <ListDetailActionRow
            listId={list.id}
            saveCount={saveCount}
            isOwner={false}
            onBookmarkToggle={(saved) => setIsBookmarked(saved)}
            onShare={handleShare}
          />
        )}

        {/* آیتم‌ها — اولویت اول */}
        <section ref={itemsSectionRef} className="scroll-mt-16 lg:rounded-2xl lg:border lg:border-wibe lg:bg-wibe-card lg:p-5 lg:shadow-sm">
          <div className="mb-3 flex flex-col gap-3 lg:mb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <h2 className="wibe-h3 shrink-0">آیتم‌های لیست</h2>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 lg:gap-3">
            {showItemSearch && (
              <div className="order-3 w-full min-w-0 lg:order-1 lg:max-w-sm lg:flex-1">
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
              <div className="order-1 flex shrink-0 rounded-lg border border-wibe bg-gray-100 p-0.5 lg:order-2">
                <button
                  type="button"
                  onClick={handleSetList}
                  title="لیستی"
                  aria-label="نمایش لیستی"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md wibe-caption transition-colors ${
                    viewMode === 'list' ? 'bg-wibe-card shadow-sm text-primary' : 'text-wibe-secondary'
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
                    viewMode === 'grid' ? 'bg-wibe-card shadow-sm text-primary' : 'text-wibe-secondary'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  شبکه
                </button>
              </div>
            )}
            </div>
          </div>

          {viewMode === 'grid' && gridHintVisible && !isItemSearchActive && (
            <p className="wibe-caption text-wibe-secondary mb-2.5 text-center">مرور سریع‌تر با نمای شبکه‌ای</p>
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

        {list.tags && list.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {list.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex px-3 py-1 rounded-md wibe-caption font-medium bg-gray-100 text-wibe-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {isViral && !isOwner && (
          <div className="py-2.5 px-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning shrink-0" />
            <span className="wibe-caption font-medium text-foreground">لیست وایرال — {formatCompact(saveCount)} ذخیره</span>
          </div>
        )}

          </div>

        {showSimilarLists && (
          <SimilarListsCarousel relatedLists={relatedLists} />
        )}

        <div
          ref={commentsSectionRef}
          className="scroll-mt-16 border-t border-wibe pt-6 lg:mt-2 lg:rounded-2xl lg:border lg:bg-wibe-card lg:p-5 lg:pt-5 lg:shadow-sm"
        >
          <VibeCommentSectionLazy
            listId={list.id}
            isOwner={isOwner}
            categorySlug={categorySlug}
            onOpenSuggestItem={() => setSuggestOpen(true)}
            embeddedInSidebar
          />
        </div>

        <div className="h-6 lg:h-2" />
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
